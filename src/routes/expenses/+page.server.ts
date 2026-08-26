import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { DEFAULT_MASTER_CATEGORIES, getOrSeedExpenseCategories } from '$lib/server/categories';
import { ExpenseService } from '$lib/server/services';
import { createExpenseSchema, deleteExpenseSchema } from '$lib/schemas';
import type { Expense, ExpenseCategory } from '$lib/types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const currentUser = locals.user;
	if (!currentUser || !locals.tenant) {
		throw redirect(303, '/login');
	}

	const defaultCategories: ExpenseCategory[] = DEFAULT_MASTER_CATEGORIES.map((c, idx) => ({
		id: `def-cat-${idx}`,
		name: c.name,
		slug: c.slug,
		icon: c.icon,
		color: c.color,
		keywords: c.keywords,
		isDefault: 1
	}));

	const d1 = platform?.env?.DB;
	if (!d1) {
		return {
			expenses: [] as Expense[],
			categories: defaultCategories,
			user: currentUser
		};
	}

	const db = getDb(d1);
	const categories = await getOrSeedExpenseCategories(
		db,
		locals.tenant.activeHouseholdId,
		locals.tenant.userId
	);

	const expenseService = new ExpenseService(d1);
	const expenses = await expenseService.list(locals.tenant);

	return {
		expenses,
		categories,
		user: currentUser
	};
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const formEntries = Object.fromEntries(formData.entries());
		const amountFloat = parseFloat((formEntries.amount as string) || '0');

		const parsed = createExpenseSchema.safeParse({
			...formEntries,
			amountCents: Math.round(amountFloat * 100),
			date: formEntries.date ? new Date(formEntries.date as string) : undefined
		});

		if (!parsed.success) {
			return fail(400, { error: 'Invalid expense data', details: parsed.error.format() });
		}

		const parsedDate = parsed.data.date
			? typeof parsed.data.date === 'string' || typeof parsed.data.date === 'number'
				? new Date(parsed.data.date)
				: parsed.data.date
			: undefined;

		const expenseService = new ExpenseService(d1);
		await expenseService.create(locals.tenant, {
			...parsed.data,
			date: parsedDate
		});

		return { success: true };
	},

	delete: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const parsed = deleteExpenseSchema.safeParse(Object.fromEntries(formData.entries()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid expense ID', details: parsed.error.format() });
		}

		const expenseService = new ExpenseService(d1);
		const deleted = await expenseService.delete(locals.tenant, parsed.data.id);

		if (!deleted) {
			return fail(404, { error: 'Expense not found or access denied' });
		}

		return { success: true };
	}
};
