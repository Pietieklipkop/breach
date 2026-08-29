import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { DEFAULT_MASTER_CATEGORIES, getOrSeedExpenseCategories } from '$lib/server/categories';
import { CompanyService, ExpenseService } from '$lib/server/services';
import { createExpenseSchema, deleteExpenseSchema } from '$lib/schemas';
import type { Company, Expense, ExpenseCategory } from '$lib/types';

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
			companies: [] as Company[],
			user: currentUser
		};
	}

	try {
		const db = getDb(d1);
		const categories = await getOrSeedExpenseCategories(
			db,
			locals.tenant.activeHouseholdId,
			locals.tenant.userId
		);

		const expenseService = new ExpenseService(d1);
		const companyService = new CompanyService(d1);

		const [expenses, companies] = await Promise.all([
			expenseService.list(locals.tenant),
			companyService.list(locals.tenant)
		]);

		return {
			expenses,
			categories,
			companies,
			user: currentUser
		};
	} catch (err) {
		console.error('Error loading expenses page:', err);
		return {
			expenses: [],
			categories: defaultCategories,
			companies: [],
			user: currentUser
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const formEntries = Object.fromEntries(formData.entries());
		const amountFloat = parseFloat((formEntries.amount as string) || '0');
		const paidFromBankAccountId = (formEntries.paidFromBankAccountId as string) || undefined;

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
			date: parsedDate,
			paidFromBankAccountId
		});

		return { success: true };
	},

	update: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		const formData = await request.formData();
		const formEntries = Object.fromEntries(formData.entries());
		const id = formEntries.id as string;
		if (!id) return fail(400, { error: 'Expense ID required' });

		const amountFloat = formEntries.amount ? parseFloat(formEntries.amount as string) : undefined;
		const amountCents = amountFloat !== undefined && !isNaN(amountFloat) ? Math.round(amountFloat * 100) : undefined;

		const updateData: Record<string, unknown> = {};
		if (formEntries.vendor) updateData.vendor = (formEntries.vendor as string).trim();
		if (amountCents !== undefined) updateData.amountCents = amountCents;
		if (formEntries.category) updateData.category = formEntries.category as string;
		if (formEntries.date) updateData.date = new Date(formEntries.date as string);
		if (formEntries.notes !== undefined) updateData.notes = formEntries.notes as string;

		const expenseService = new ExpenseService(d1);
		const updated = await expenseService.update(locals.tenant, id, updateData);

		if (!updated) {
			return fail(404, { error: 'Expense not found or access denied' });
		}

		return { success: true, expense: updated };
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
