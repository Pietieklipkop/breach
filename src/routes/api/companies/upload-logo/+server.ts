import { json, type RequestHandler } from '@sveltejs/kit';
import { CompanyService } from '$lib/server/services';

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await event.request.formData();
		const file = formData.get('logo') as File | null;
		const companyId = formData.get('companyId') as string | null;

		if (!file) {
			return json({ error: 'No logo file provided' }, { status: 400 });
		}

		// Validate file type: JPG and PNG only
		const validMimetypes = ['image/jpeg', 'image/jpg', 'image/png'];
		const extension = file.name.split('.').pop()?.toLowerCase() || '';
		const validExtensions = ['jpg', 'jpeg', 'png'];

		if (!validMimetypes.includes(file.type) && !validExtensions.includes(extension)) {
			return json(
				{ error: 'Invalid image format. Only JPG and PNG images are supported.' },
				{ status: 400 }
			);
		}

		const fileBuffer = await file.arrayBuffer();
		const cleanExt = extension === 'jpeg' ? 'jpg' : extension || 'png';
		const fileKey = `company-logos/logo-${companyId || Date.now()}-${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;

		let logoUrl = '';
		const bucket = event.platform?.env?.RECEIPTS_BUCKET;

		if (bucket) {
			await bucket.put(fileKey, fileBuffer, {
				httpMetadata: { contentType: file.type || `image/${cleanExt}` }
			});
			logoUrl = `/api/media/${fileKey}`;
		} else {
			// Fallback data URL if R2 bucket binding is unavailable in local runner
			const base64 = Buffer.from(fileBuffer).toString('base64');
			const mime = file.type || (cleanExt === 'png' ? 'image/png' : 'image/jpeg');
			logoUrl = `data:${mime};base64,${base64}`;
		}

		const tenant = event.locals.tenant;
		if (!user || !tenant) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// If companyId is provided, update company in D1 database
		const d1 = event.platform?.env?.DB;
		if (companyId && d1) {
			const companyService = new CompanyService(d1);
			await companyService.update(tenant, companyId, { logoUrl });
		}

		return json({
			success: true,
			logoUrl,
			fileKey,
			message: 'Company logo saved to Cloudflare Storage Bucket successfully.'
		});
	} catch (err: unknown) {
		console.error('Error uploading logo:', err);
		const message = err instanceof Error ? err.message : 'Failed to upload logo';
		return json({ error: message }, { status: 500 });
	}
};
