import { getDb } from '$lib/server/db';
import { invoices, invoiceItems, companies } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { and, desc, eq } from 'drizzle-orm';
import type { Company, Invoice, InvoiceItem, TenantContext } from '$lib/types';

export class InvoiceService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<Invoice[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);

		const invoiceRows = await db
			.select()
			.from(invoices)
			.where(tenantFilter(invoices.userId, invoices.householdId, tenant))
			.orderBy(desc(invoices.createdAt));

		if (invoiceRows.length === 0) return [];

		// Load companies and items
		const allCompanies = await db.select().from(companies);
		const companyMap = new Map<string, Company>();
		for (const c of allCompanies) {
			companyMap.set(c.id, {
				id: c.id,
				userId: c.userId,
				householdId: c.householdId,
				name: c.name,
				regNumber: c.regNumber,
				taxNumber: c.taxNumber,
				companyType: c.companyType as Company['companyType'],
				address: c.address,
				email: c.email,
				phone: c.phone,
				ownershipDetails: c.ownershipDetails,
				logoUrl: c.logoUrl,
				createdAt: c.createdAt,
				updatedAt: c.updatedAt
			});
		}

		const allItems = await db.select().from(invoiceItems);
		const itemsMap = new Map<string, InvoiceItem[]>();
		for (const it of allItems) {
			const list = itemsMap.get(it.invoiceId) || [];
			list.push({
				id: it.id,
				invoiceId: it.invoiceId,
				expenseId: it.expenseId,
				description: it.description,
				category: it.category,
				amountCents: it.amountCents,
				createdAt: it.createdAt
			});
			itemsMap.set(it.invoiceId, list);
		}

		return invoiceRows.map((inv) => ({
			id: inv.id,
			userId: inv.userId,
			householdId: inv.householdId,
			invoiceNumber: inv.invoiceNumber,
			fromCompanyId: inv.fromCompanyId,
			toCompanyId: inv.toCompanyId,
			fromCompany: inv.fromCompanyId ? companyMap.get(inv.fromCompanyId) || null : null,
			toCompany: inv.toCompanyId ? companyMap.get(inv.toCompanyId) || null : null,
			issueDate: inv.issueDate,
			dueDate: inv.dueDate,
			status: (inv.status || 'draft') as Invoice['status'],
			subtotalCents: inv.subtotalCents,
			vatCents: inv.vatCents,
			totalCents: inv.totalCents,
			notes: inv.notes,
			items: itemsMap.get(inv.id) || [],
			createdAt: inv.createdAt
		}));
	}

	async getById(tenant: TenantContext | null | undefined, id: string): Promise<Invoice | null> {
		if (!tenant?.userId) return null;
		const db = getDb(this.d1);

		const [invoice] = await db
			.select()
			.from(invoices)
			.where(and(eq(invoices.id, id), tenantFilter(invoices.userId, invoices.householdId, tenant)))
			.limit(1);

		if (!invoice) return null;

		let fromCompany: Company | null = null;
		if (invoice.fromCompanyId) {
			const [fc] = await db
				.select()
				.from(companies)
				.where(eq(companies.id, invoice.fromCompanyId))
				.limit(1);
			if (fc) {
				fromCompany = {
					id: fc.id,
					userId: fc.userId,
					householdId: fc.householdId,
					name: fc.name,
					regNumber: fc.regNumber,
					taxNumber: fc.taxNumber,
					companyType: fc.companyType as Company['companyType'],
					address: fc.address,
					email: fc.email,
					phone: fc.phone,
					ownershipDetails: fc.ownershipDetails,
					logoUrl: fc.logoUrl,
					createdAt: fc.createdAt,
					updatedAt: fc.updatedAt
				};
			}
		}

		let toCompany: Company | null = null;
		if (invoice.toCompanyId) {
			const [tc] = await db
				.select()
				.from(companies)
				.where(eq(companies.id, invoice.toCompanyId))
				.limit(1);
			if (tc) {
				toCompany = {
					id: tc.id,
					userId: tc.userId,
					householdId: tc.householdId,
					name: tc.name,
					regNumber: tc.regNumber,
					taxNumber: tc.taxNumber,
					companyType: tc.companyType as Company['companyType'],
					address: tc.address,
					email: tc.email,
					phone: tc.phone,
					ownershipDetails: tc.ownershipDetails,
					logoUrl: tc.logoUrl,
					createdAt: tc.createdAt,
					updatedAt: tc.updatedAt
				};
			}
		}

		const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

		return {
			id: invoice.id,
			userId: invoice.userId,
			householdId: invoice.householdId,
			invoiceNumber: invoice.invoiceNumber,
			fromCompanyId: invoice.fromCompanyId,
			toCompanyId: invoice.toCompanyId,
			fromCompany,
			toCompany,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate,
			status: (invoice.status || 'draft') as Invoice['status'],
			subtotalCents: invoice.subtotalCents,
			vatCents: invoice.vatCents,
			totalCents: invoice.totalCents,
			notes: invoice.notes,
			items: items.map((it) => ({
				id: it.id,
				invoiceId: it.invoiceId,
				expenseId: it.expenseId,
				description: it.description,
				category: it.category,
				amountCents: it.amountCents,
				createdAt: it.createdAt
			})),
			createdAt: invoice.createdAt
		};
	}

	async createInvoiceWithItems(
		tenant: TenantContext | null | undefined,
		invoiceData: {
			invoiceNumber?: string;
			fromCompanyId: string;
			toCompanyId: string;
			issueDate?: Date | string | number;
			dueDate?: Date | string | number;
			status?: 'draft' | 'issued' | 'paid';
			items?: Array<{
				description: string;
				amountCents: number;
				category?: string | null;
				expenseId?: string | null;
			}>;
			notes?: string | null;
			subtotalCents?: number;
			vatCents?: number;
			totalCents?: number;
		}
	): Promise<Invoice> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const items = invoiceData.items || [];
		const computedSubtotal =
			invoiceData.subtotalCents !== undefined
				? invoiceData.subtotalCents
				: items.reduce((sum, it) => sum + it.amountCents, 0);
		const computedVat =
			invoiceData.vatCents !== undefined
				? invoiceData.vatCents
				: Math.round(computedSubtotal * 0.15);
		const computedTotal =
			invoiceData.totalCents !== undefined
				? invoiceData.totalCents
				: computedSubtotal + computedVat;

		const invId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
		const parsedIssueDate = invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date();
		const parsedDueDate = invoiceData.dueDate
			? new Date(invoiceData.dueDate)
			: new Date(Date.now() + 14 * 86400000);

		const invoiceNum =
			invoiceData.invoiceNumber ||
			`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

		await db.insert(invoices).values({
			id: invId,
			userId: tenant.userId,
			householdId: tenant.activeHouseholdId,
			invoiceNumber: invoiceNum,
			fromCompanyId: invoiceData.fromCompanyId,
			toCompanyId: invoiceData.toCompanyId,
			issueDate: parsedIssueDate,
			dueDate: parsedDueDate,
			status: invoiceData.status || 'issued',
			subtotalCents: computedSubtotal,
			vatCents: computedVat,
			totalCents: computedTotal,
			notes: invoiceData.notes ? invoiceData.notes.trim() : null
		});

		if (items.length > 0) {
			const itemInserts = items.map((item) => ({
				id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
				invoiceId: invId,
				expenseId: item.expenseId || null,
				description: item.description,
				category: item.category || 'general',
				amountCents: item.amountCents
			}));
			await db.insert(invoiceItems).values(itemInserts);
		}

		const created = await this.getById(tenant, invId);
		if (!created) {
			throw new Error('Failed to retrieve created invoice');
		}

		return created;
	}

	async delete(tenant: TenantContext | null | undefined, id: string): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(invoices)
			.where(and(eq(invoices.id, id), tenantFilter(invoices.userId, invoices.householdId, tenant)))
			.returning();
		return !!deleted;
	}
}
