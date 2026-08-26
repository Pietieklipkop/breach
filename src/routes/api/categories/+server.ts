import { json, type RequestHandler } from '@sveltejs/kit';
import { CategoryService } from '$lib/server/services';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user || !locals.tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return json({ categories: [] });
	}

	const categoryService = new CategoryService(d1);
	const categories = await categoryService.list(locals.tenant);
	return json({ categories });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user || !locals.tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const body = (await request.json()) as {
			name?: string;
			slug?: string;
			icon?: string;
			color?: string;
			keywords?: string;
		};

		if (!body.name) {
			return json({ error: 'Category name is required' }, { status: 400 });
		}

		const categoryService = new CategoryService(d1);
		const created = await categoryService.create(locals.tenant, {
			name: body.name,
			slug: body.slug,
			icon: body.icon,
			color: body.color,
			keywords: body.keywords
		});

		return json({ success: true, category: created });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to create category';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user || !locals.tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const body = (await request.json()) as {
			id?: string;
			name?: string;
			keywords?: string;
			color?: string;
			icon?: string;
		};

		if (!body.id || !body.name) {
			return json({ error: 'Category ID and Name are required' }, { status: 400 });
		}

		const categoryService = new CategoryService(d1);
		const updated = await categoryService.update(locals.tenant, body.id, {
			name: body.name,
			keywords: body.keywords,
			color: body.color,
			icon: body.icon
		});

		if (!updated) {
			return json({ error: 'Category not found or access denied' }, { status: 404 });
		}

		return json({ success: true, category: updated });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to update category';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user || !locals.tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const body = (await request.json()) as { id?: string };
		if (!body.id) {
			return json({ error: 'Category ID is required' }, { status: 400 });
		}

		const categoryService = new CategoryService(d1);
		const deleted = await categoryService.delete(locals.tenant, body.id);

		if (!deleted) {
			return json({ error: 'Category not found or access denied' }, { status: 404 });
		}

		return json({ success: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to delete category';
		return json({ error: message }, { status: 500 });
	}
};
