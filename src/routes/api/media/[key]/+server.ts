import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform }) => {
	const key = params.key;
	if (!key) {
		throw error(400, 'Missing media key');
	}

	const bucket = platform?.env?.RECEIPTS_BUCKET;
	if (!bucket) {
		throw error(503, 'Cloudflare R2 storage bucket is not available in local dev/environment');
	}

	try {
		const object = await bucket.get(key);
		if (!object) {
			throw error(404, 'Media object not found');
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		headers.set('cache-control', 'public, max-age=31536000, immutable');

		// Guess content type if not set
		if (!headers.has('content-type')) {
			if (key.endsWith('.png')) {
				headers.set('content-type', 'image/png');
			} else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
				headers.set('content-type', 'image/jpeg');
			} else if (key.endsWith('.svg')) {
				headers.set('content-type', 'image/svg+xml');
			} else if (key.endsWith('.pdf')) {
				headers.set('content-type', 'application/pdf');
			} else {
				headers.set('content-type', 'application/octet-stream');
			}
		}

		return new Response(object.body, { headers });
	} catch (err: unknown) {
		console.error('Error retrieving R2 media object:', err);
		throw error(500, 'Failed to retrieve media file');
	}
};
