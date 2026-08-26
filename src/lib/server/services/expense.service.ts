import { getDb } from '$lib/server/db';
import { expenses } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { and, desc, eq } from 'drizzle-orm';
import type { Expense, TenantContext } from '$lib/types';

export class ExpenseService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<Expense[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);
		const rows = await db
			.select()
			.from(expenses)
			.where(tenantFilter(expenses.userId, expenses.householdId, tenant))
			.orderBy(desc(expenses.date));

		return rows.map((r) => ({
			id: r.id,
			userId: r.userId,
			householdId: r.householdId,
			assetId: r.assetId,
			category: r.category,
			vendor: r.vendor,
			amountCents: r.amountCents,
			currency: r.currency,
			date: r.date,
			receiptUrl: r.receiptUrl,
			rawOcrData: r.rawOcrData,
			notes: r.notes,
			createdAt: r.createdAt
		}));
	}

	async getById(tenant: TenantContext | null | undefined, id: string): Promise<Expense | null> {
		if (!tenant?.userId) return null;
		const db = getDb(this.d1);
		const [row] = await db
			.select()
			.from(expenses)
			.where(and(eq(expenses.id, id), tenantFilter(expenses.userId, expenses.householdId, tenant)))
			.limit(1);

		if (!row) return null;

		return {
			id: row.id,
			userId: row.userId,
			householdId: row.householdId,
			assetId: row.assetId,
			category: row.category,
			vendor: row.vendor,
			amountCents: row.amountCents,
			currency: row.currency,
			date: row.date,
			receiptUrl: row.receiptUrl,
			rawOcrData: row.rawOcrData,
			notes: row.notes,
			createdAt: row.createdAt
		};
	}

	async create(
		tenant: TenantContext | null | undefined,
		data: {
			vendor: string;
			amountCents: number;
			category?: string;
			currency?: string;
			date?: Date | string | number;
			receiptUrl?: string | null;
			rawOcrData?: string | null;
			notes?: string | null;
			assetId?: string | null;
		}
	): Promise<Expense> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const parsedDate = data.date
			? typeof data.date === 'string' || typeof data.date === 'number'
				? new Date(data.date)
				: data.date
			: new Date();

		const [created] = await db
			.insert(expenses)
			.values({
				userId: tenant.userId,
				householdId: tenant.activeHouseholdId,
				vendor: data.vendor.trim(),
				category: data.category || 'general',
				amountCents: data.amountCents,
				currency: data.currency || 'ZAR',
				date: parsedDate,
				receiptUrl: data.receiptUrl || null,
				rawOcrData: data.rawOcrData || null,
				notes: data.notes ? data.notes.trim() : null,
				assetId: data.assetId || null
			})
			.returning();

		return {
			id: created.id,
			userId: created.userId,
			householdId: created.householdId,
			assetId: created.assetId,
			category: created.category,
			vendor: created.vendor,
			amountCents: created.amountCents,
			currency: created.currency,
			date: created.date,
			receiptUrl: created.receiptUrl,
			rawOcrData: created.rawOcrData,
			notes: created.notes,
			createdAt: created.createdAt
		};
	}

	async delete(tenant: TenantContext | null | undefined, id: string): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(expenses)
			.where(and(eq(expenses.id, id), tenantFilter(expenses.userId, expenses.householdId, tenant)))
			.returning();
		return !!deleted;
	}
}
