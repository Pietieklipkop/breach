import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { AssetService } from '$lib/server/services';
import type { AssetType } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user || !locals.tenant) {
		throw redirect(303, '/login');
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return { assets: [] };
	}

	const assetService = new AssetService(d1);
	const assets = await assetService.list(locals.tenant);

	return { assets };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) {
			return fail(401, { error: 'Unauthorized' });
		}

		const d1 = platform?.env?.DB;
		if (!d1) {
			return fail(500, { error: 'Database unavailable' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString() || '';
		const type = (formData.get('type')?.toString() as AssetType) || 'vehicle';
		const make = formData.get('make')?.toString() || null;
		const model = formData.get('model')?.toString() || null;
		const yearModelStr = formData.get('yearModel')?.toString();
		const purchaseDateStr = formData.get('purchaseDate')?.toString();
		const purchasePriceRandStr = formData.get('purchasePriceRand')?.toString();
		const currentValuationRandStr = formData.get('currentValuationRand')?.toString();
		const purchaseKmStr = formData.get('purchaseKm')?.toString();
		const currentKmStr = formData.get('currentKm')?.toString();
		const notes = formData.get('notes')?.toString() || null;

		if (!name && (!make || !model)) {
			return fail(400, { error: 'Asset name or make and model required' });
		}

		const assetName = name.trim() || `${make || ''} ${model || ''}`.trim();
		const purchasePriceRand = parseFloat(purchasePriceRandStr || '0');
		const currentValuationRand = currentValuationRandStr
			? parseFloat(currentValuationRandStr)
			: purchasePriceRand;

		const purchasePriceCents = isNaN(purchasePriceRand) ? 0 : Math.round(purchasePriceRand * 100);
		const currentValuationCents = isNaN(currentValuationRand)
			? purchasePriceCents
			: Math.round(currentValuationRand * 100);

		const assetService = new AssetService(d1);
		const created = await assetService.create(locals.tenant, {
			name: assetName,
			type,
			make: make ? make.trim() : null,
			model: model ? model.trim() : null,
			yearModel: yearModelStr ? parseInt(yearModelStr, 10) : null,
			purchaseDate: purchaseDateStr ? new Date(purchaseDateStr) : new Date(),
			purchasePriceCents,
			currentValuationCents,
			purchaseKm: purchaseKmStr ? parseInt(purchaseKmStr, 10) : null,
			currentKm: currentKmStr ? parseInt(currentKmStr, 10) : null,
			notes: notes ? notes.trim() : null
		});

		return { success: true, asset: created };
	}
};
