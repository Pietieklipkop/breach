import { json, type RequestHandler } from '@sveltejs/kit';
import { DocumentProcessingService } from '$lib/server/services';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user || !locals.tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const documentType = (formData.get('documentType') as string) || 'receipt';
		const rawText = (formData.get('rawText') as string) || '';

		if (!file) {
			return json({ error: 'No file uploaded' }, { status: 400 });
		}

		const service = new DocumentProcessingService(
			platform?.env?.DB,
			platform?.env?.RECEIPTS_BUCKET
		);

		const result = await service.processScan(
			locals.tenant,
			await file.arrayBuffer(),
			file.name || `doc_${Date.now()}`,
			file.type || 'image/jpeg',
			documentType,
			rawText
		);

		return json({
			success: true,
			...result
		});
	} catch (err: unknown) {
		console.error('OCR scan error:', err);
		const message = err instanceof Error ? err.message : 'Upload and OCR scan failed';
		return json({ error: message }, { status: 500 });
	}
};
