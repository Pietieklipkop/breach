import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AssetService } from '$lib/server/services';
import { createActivitySchema, deleteActivitySchema } from '$lib/schemas';
import type { ActivityCategory, AssetType } from '$lib/types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const currentUser = locals.user;
	if (!currentUser || !locals.tenant) {
		throw redirect(303, '/login');
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		throw error(500, 'Database unavailable');
	}

	const assetService = new AssetService(d1);
	const asset = await assetService.getById(locals.tenant, params.id);

	if (!asset) {
		throw error(404, 'Asset not found or access denied');
	}

	const activities = await assetService.listActivities(locals.tenant, params.id);

	return {
		asset,
		activities,
		user: currentUser
	};
};

export const actions: Actions = {
	addActivity: async ({ params, request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const title = formData.get('title')?.toString() || '';
		const category = (formData.get('category')?.toString() as ActivityCategory) || 'maintenance';
		const costRandStr = formData.get('costRand')?.toString();
		const vendor = formData.get('vendor')?.toString() || null;
		const dateStr = formData.get('date')?.toString();
		const mileageKmStr = formData.get('mileageKm')?.toString();
		const notes = formData.get('notes')?.toString() || null;

		const costRand = parseFloat(costRandStr || '0');
		const costCents = isNaN(costRand) ? 0 : Math.round(costRand * 100);
		const mileageKm = mileageKmStr ? parseInt(mileageKmStr, 10) : null;

		const parsed = createActivitySchema.safeParse({
			assetId: params.id,
			title,
			category,
			costCents,
			vendor,
			date: dateStr ? new Date(dateStr) : new Date(),
			mileageKm: isNaN(mileageKm as number) ? null : mileageKm,
			notes
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid activity data', details: parsed.error.format() });
		}

		try {
			const assetService = new AssetService(d1);
			const created = await assetService.createActivity(locals.tenant, params.id, parsed.data);
			return { success: true, activity: created };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to save activity';
			return fail(500, { error: message });
		}
	},

	updateAsset: async ({ params, request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const type = formData.get('type')?.toString() as AssetType | undefined;
		const make = formData.get('make')?.toString();
		const model = formData.get('model')?.toString();
		const yearModelStr = formData.get('yearModel')?.toString();
		const currentValuationRandStr = formData.get('currentValuationRand')?.toString();
		const currentKmStr = formData.get('currentKm')?.toString();
		const notes = formData.get('notes')?.toString();

		const currentValuationCents = currentValuationRandStr
			? Math.round(parseFloat(currentValuationRandStr) * 100)
			: undefined;

		const updateData: Record<string, unknown> = {};
		if (name !== undefined) updateData.name = name;
		if (type !== undefined) updateData.type = type;
		if (make !== undefined) updateData.make = make;
		if (model !== undefined) updateData.model = model;
		if (yearModelStr !== undefined) updateData.yearModel = parseInt(yearModelStr, 10);
		if (currentValuationCents !== undefined && !isNaN(currentValuationCents)) {
			updateData.currentValuationCents = currentValuationCents;
		}
		if (currentKmStr !== undefined) updateData.currentKm = parseInt(currentKmStr, 10);
		if (notes !== undefined) updateData.notes = notes;

		try {
			const assetService = new AssetService(d1);
			const updated = await assetService.update(locals.tenant, params.id, updateData);
			return { success: true, asset: updated };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to update asset';
			return fail(500, { error: message });
		}
	},

	deleteActivity: async ({ params, request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const activityId = formData.get('activityId')?.toString() || '';

		const parsed = deleteActivitySchema.safeParse({
			assetId: params.id,
			activityId
		});

		if (!parsed.success) {
			return fail(400, { error: 'Activity ID is required' });
		}

		try {
			const assetService = new AssetService(d1);
			const deleted = await assetService.deleteActivity(locals.tenant, params.id, activityId);
			if (!deleted) return fail(404, { error: 'Activity not found or access denied' });
			return { success: true };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to delete activity';
			return fail(500, { error: message });
		}
	},

	deleteAsset: async ({ params, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const assetService = new AssetService(d1);
		const deleted = await assetService.delete(locals.tenant, params.id);

		if (!deleted) {
			return fail(404, { error: 'Asset not found or access denied' });
		}

		throw redirect(303, '/assets');
	}
};
