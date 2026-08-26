import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { DEFAULT_MASTER_CATEGORIES, getOrSeedExpenseCategories } from '$lib/server/categories';
import { CompanyService, ExpenseService, InvoiceService } from '$lib/server/services';
import type { Company, Expense, ExpenseCategory, Invoice } from '$lib/types';
import { createInvoiceSchema, deleteInvoiceSchema } from '$lib/schemas';

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
			companies: [] as Company[],
			expenses: [] as Expense[],
			categories: defaultCategories,
			invoices: [] as Invoice[],
			user: currentUser
		};
	}

	const db = getDb(d1);
	const categories = await getOrSeedExpenseCategories(
		db,
		locals.tenant.activeHouseholdId,
		locals.tenant.userId
	);

	const companyService = new CompanyService(d1);
	const expenseService = new ExpenseService(d1);
	const invoiceService = new InvoiceService(d1);

	const [companies, expenses, invoices] = await Promise.all([
		companyService.list(locals.tenant),
		expenseService.list(locals.tenant),
		invoiceService.list(locals.tenant)
	]);

	return {
		companies,
		expenses,
		categories,
		invoices,
		user: currentUser
	};
};

export const actions: Actions = {
	createInvoice: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		try {
			const formData = await request.formData();
			const rawPayloadStr = formData.get('payload')?.toString();

			let payload: Record<string, unknown>;
			if (rawPayloadStr) {
				payload = JSON.parse(rawPayloadStr);
			} else {
				// Parse individual form fields
				const itemsStr = formData.get('items')?.toString();
				const items = itemsStr ? JSON.parse(itemsStr) : [];
				payload = {
					invoiceNumber: formData.get('invoiceNumber')?.toString(),
					fromCompanyId: formData.get('fromCompanyId')?.toString(),
					toCompanyId: formData.get('toCompanyId')?.toString(),
					issueDate: formData.get('issueDate')?.toString(),
					dueDate: formData.get('dueDate')?.toString(),
					notes: formData.get('notes')?.toString(),
					items
				};
			}

			const parsed = createInvoiceSchema.safeParse(payload);
			if (!parsed.success) {
				return fail(400, { error: 'Invalid invoice payload', details: parsed.error.format() });
			}

			const invoiceService = new InvoiceService(d1);
			const created = await invoiceService.createInvoiceWithItems(locals.tenant, parsed.data);

			return { success: true, invoice: created };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to create invoice';
			return fail(500, { error: message });
		}
	},

	deleteInvoice: async ({ request, locals, platform }) => {
		if (!locals.user || !locals.tenant) return fail(401, { error: 'Unauthorized' });

		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { error: 'Database unavailable' });

		try {
			const formData = await request.formData();
			const id = formData.get('id')?.toString();

			const parsed = deleteInvoiceSchema.safeParse({ id });
			if (!parsed.success) {
				return fail(400, { error: 'Invoice ID is required' });
			}

			const invoiceService = new InvoiceService(d1);
			const deleted = await invoiceService.delete(locals.tenant, parsed.data.id);

			if (!deleted) {
				return fail(404, { error: 'Invoice not found or access denied' });
			}

			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete invoice' });
		}
	}
};
