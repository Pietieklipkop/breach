import { getDb } from '$lib/server/db';
import { companies, companyBankAccounts, expenses } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { and, desc, eq } from 'drizzle-orm';
import type { Company, CompanyBankAccount, Expense, TenantContext } from '$lib/types';

export class ExpenseService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<Expense[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);

		try {
			const rows = await db
				.select()
				.from(expenses)
				.where(tenantFilter(expenses.userId, expenses.householdId, tenant))
				.orderBy(desc(expenses.date));

			// Fetch bank accounts and companies for resolution
			const bankMap = new Map<string, CompanyBankAccount>();
			try {
				const bankAccountRows = await db.select().from(companyBankAccounts);
				for (const b of bankAccountRows) {
					bankMap.set(b.id, {
						id: b.id,
						companyId: b.companyId,
						bankName: b.bankName,
						accountAlias: b.accountAlias,
						accountNumber: b.accountNumber,
						notes: b.notes
					});
				}
			} catch (bankErr) {
				console.warn('Expense bank accounts query notice:', bankErr);
			}

			const companyMap = new Map<string, Company>();
			try {
				const companyRows = await db.select().from(companies);
				for (const c of companyRows) {
					companyMap.set(c.id, {
						id: c.id,
						name: c.name,
						companyType: c.companyType as Company['companyType']
					});
				}
			} catch (compErr) {
				console.warn('Companies query notice:', compErr);
			}

			return rows.map((r) => {
				const bank = r.paidFromBankAccountId ? bankMap.get(r.paidFromBankAccountId) || null : null;
				const comp = bank ? companyMap.get(bank.companyId) || null : null;

				return {
					id: r.id,
					userId: r.userId,
					householdId: r.householdId,
					assetId: r.assetId,
					paidFromBankAccountId: r.paidFromBankAccountId,
					paidFromBankAccount: bank,
					paidFromCompany: comp,
					category: r.category,
					vendor: r.vendor,
					amountCents: r.amountCents,
					currency: r.currency,
					date: r.date,
					receiptUrl: r.receiptUrl,
					rawOcrData: r.rawOcrData,
					notes: r.notes,
					createdAt: r.createdAt
				};
			});
		} catch (err) {
			console.error('ExpenseService list error:', err);
			return [];
		}
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

		let bank: CompanyBankAccount | null = null;
		let comp: Company | null = null;
		if (row.paidFromBankAccountId) {
			try {
				const [b] = await db
					.select()
					.from(companyBankAccounts)
					.where(eq(companyBankAccounts.id, row.paidFromBankAccountId))
					.limit(1);
				if (b) {
					bank = {
						id: b.id,
						companyId: b.companyId,
						bankName: b.bankName,
						accountAlias: b.accountAlias,
						accountNumber: b.accountNumber,
						notes: b.notes
					};
					const [c] = await db
						.select()
						.from(companies)
						.where(eq(companies.id, b.companyId))
						.limit(1);
					if (c) {
						comp = {
							id: c.id,
							name: c.name,
							companyType: c.companyType as Company['companyType']
						};
					}
				}
			} catch (lookupErr) {
				console.warn('Bank account lookup notice:', lookupErr);
			}
		}

		return {
			id: row.id,
			userId: row.userId,
			householdId: row.householdId,
			assetId: row.assetId,
			paidFromBankAccountId: row.paidFromBankAccountId,
			paidFromBankAccount: bank,
			paidFromCompany: comp,
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
			paidFromBankAccountId?: string | null;
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
				assetId: data.assetId || null,
				paidFromBankAccountId: data.paidFromBankAccountId || null
			})
			.returning();

		return this.getById(tenant, created.id) as Promise<Expense>;
	}

	async update(
		tenant: TenantContext | null | undefined,
		id: string,
		data: {
			vendor?: string;
			amountCents?: number;
			category?: string;
			currency?: string;
			date?: Date | string | number;
			notes?: string | null;
			assetId?: string | null;
			paidFromBankAccountId?: string | null;
		}
	): Promise<Expense | null> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const existing = await this.getById(tenant, id);
		if (!existing) return null;

		const db = getDb(this.d1);
		const updateValues: Record<string, unknown> = {};

		if (data.vendor !== undefined) updateValues.vendor = data.vendor.trim();
		if (data.amountCents !== undefined) updateValues.amountCents = data.amountCents;
		if (data.category !== undefined) updateValues.category = data.category;
		if (data.currency !== undefined) updateValues.currency = data.currency;
		if (data.date !== undefined) updateValues.date = new Date(data.date);
		if (data.notes !== undefined) updateValues.notes = data.notes ? data.notes.trim() : null;
		if (data.assetId !== undefined) updateValues.assetId = data.assetId;
		if (data.paidFromBankAccountId !== undefined) {
			updateValues.paidFromBankAccountId = data.paidFromBankAccountId;
		}

		await db
			.update(expenses)
			.set(updateValues)
			.where(and(eq(expenses.id, id), tenantFilter(expenses.userId, expenses.householdId, tenant)));

		return this.getById(tenant, id);
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
