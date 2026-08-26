import { getDb } from '$lib/server/db';
import { companies, companyDocuments } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { and, eq, desc } from 'drizzle-orm';
import type { Company, CompanyDocument, CompanyType, TenantContext } from '$lib/types';

export class CompanyService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<Company[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);

		const companyRows = await db
			.select()
			.from(companies)
			.where(tenantFilter(companies.userId, companies.householdId, tenant))
			.orderBy(desc(companies.createdAt));

		if (companyRows.length === 0) return [];

		// Fetch documents for all fetched companies
		const docRows = await db.select().from(companyDocuments);
		const docMap = new Map<string, CompanyDocument[]>();
		for (const doc of docRows) {
			const list = docMap.get(doc.companyId) || [];
			list.push({
				id: doc.id,
				companyId: doc.companyId,
				title: doc.title,
				documentType: doc.documentType,
				fileUrl: doc.fileUrl,
				createdAt: doc.createdAt
			});
			docMap.set(doc.companyId, list);
		}

		return companyRows.map((c) => ({
			id: c.id,
			userId: c.userId,
			householdId: c.householdId,
			name: c.name,
			regNumber: c.regNumber,
			taxNumber: c.taxNumber,
			companyType: c.companyType as CompanyType,
			address: c.address,
			email: c.email,
			phone: c.phone,
			ownershipDetails: c.ownershipDetails,
			logoUrl: c.logoUrl,
			documents: docMap.get(c.id) || [],
			createdAt: c.createdAt,
			updatedAt: c.updatedAt
		}));
	}

	async getById(tenant: TenantContext | null | undefined, id: string): Promise<Company | null> {
		if (!tenant?.userId) return null;
		const db = getDb(this.d1);

		const [company] = await db
			.select()
			.from(companies)
			.where(
				and(eq(companies.id, id), tenantFilter(companies.userId, companies.householdId, tenant))
			)
			.limit(1);

		if (!company) return null;

		const docs = await db.select().from(companyDocuments).where(eq(companyDocuments.companyId, id));

		return {
			id: company.id,
			userId: company.userId,
			householdId: company.householdId,
			name: company.name,
			regNumber: company.regNumber,
			taxNumber: company.taxNumber,
			companyType: company.companyType as CompanyType,
			address: company.address,
			email: company.email,
			phone: company.phone,
			ownershipDetails: company.ownershipDetails,
			logoUrl: company.logoUrl,
			documents: docs.map((d) => ({
				id: d.id,
				companyId: d.companyId,
				title: d.title,
				documentType: d.documentType,
				fileUrl: d.fileUrl,
				createdAt: d.createdAt
			})),
			createdAt: company.createdAt,
			updatedAt: company.updatedAt
		};
	}

	async create(
		tenant: TenantContext | null | undefined,
		data: {
			name: string;
			regNumber?: string | null;
			taxNumber?: string | null;
			companyType?: CompanyType;
			address?: string | null;
			email?: string | null;
			phone?: string | null;
			ownershipDetails?: string | null;
			logoUrl?: string | null;
		}
	): Promise<Company> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const [created] = await db
			.insert(companies)
			.values({
				userId: tenant.userId,
				householdId: tenant.activeHouseholdId,
				name: data.name.trim(),
				regNumber: data.regNumber ? data.regNumber.trim() : null,
				taxNumber: data.taxNumber ? data.taxNumber.trim() : null,
				companyType: data.companyType || 'subsidiary',
				address: data.address ? data.address.trim() : null,
				email: data.email ? data.email.trim() : null,
				phone: data.phone ? data.phone.trim() : null,
				ownershipDetails: data.ownershipDetails ? data.ownershipDetails.trim() : null,
				logoUrl: data.logoUrl || null
			})
			.returning();

		return {
			id: created.id,
			userId: created.userId,
			householdId: created.householdId,
			name: created.name,
			regNumber: created.regNumber,
			taxNumber: created.taxNumber,
			companyType: created.companyType as CompanyType,
			address: created.address,
			email: created.email,
			phone: created.phone,
			ownershipDetails: created.ownershipDetails,
			logoUrl: created.logoUrl,
			documents: [],
			createdAt: created.createdAt,
			updatedAt: created.updatedAt
		};
	}

	async update(
		tenant: TenantContext | null | undefined,
		id: string,
		data: {
			name?: string;
			regNumber?: string | null;
			taxNumber?: string | null;
			companyType?: CompanyType;
			address?: string | null;
			email?: string | null;
			phone?: string | null;
			ownershipDetails?: string | null;
			logoUrl?: string | null;
		}
	): Promise<Company | null> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const updateValues: Record<string, unknown> = {
			updatedAt: new Date()
		};

		if (data.name !== undefined) updateValues.name = data.name.trim();
		if (data.regNumber !== undefined)
			updateValues.regNumber = data.regNumber ? data.regNumber.trim() : null;
		if (data.taxNumber !== undefined)
			updateValues.taxNumber = data.taxNumber ? data.taxNumber.trim() : null;
		if (data.companyType !== undefined) updateValues.companyType = data.companyType;
		if (data.address !== undefined)
			updateValues.address = data.address ? data.address.trim() : null;
		if (data.email !== undefined) updateValues.email = data.email ? data.email.trim() : null;
		if (data.phone !== undefined) updateValues.phone = data.phone ? data.phone.trim() : null;
		if (data.ownershipDetails !== undefined)
			updateValues.ownershipDetails = data.ownershipDetails ? data.ownershipDetails.trim() : null;
		if (data.logoUrl !== undefined) updateValues.logoUrl = data.logoUrl;

		const [updated] = await db
			.update(companies)
			.set(updateValues)
			.where(
				and(eq(companies.id, id), tenantFilter(companies.userId, companies.householdId, tenant))
			)
			.returning();

		if (!updated) return null;

		return this.getById(tenant, id);
	}

	async delete(tenant: TenantContext | null | undefined, id: string): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(companies)
			.where(
				and(eq(companies.id, id), tenantFilter(companies.userId, companies.householdId, tenant))
			)
			.returning();
		return !!deleted;
	}

	async addDocument(
		tenant: TenantContext | null | undefined,
		companyId: string,
		doc: { title: string; documentType?: string; fileUrl: string }
	): Promise<CompanyDocument | null> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const company = await this.getById(tenant, companyId);
		if (!company) return null;

		const db = getDb(this.d1);
		const [created] = await db
			.insert(companyDocuments)
			.values({
				companyId,
				title: doc.title.trim(),
				documentType: doc.documentType || 'general',
				fileUrl: doc.fileUrl
			})
			.returning();

		return {
			id: created.id,
			companyId: created.companyId,
			title: created.title,
			documentType: created.documentType,
			fileUrl: created.fileUrl,
			createdAt: created.createdAt
		};
	}

	async deleteDocument(
		tenant: TenantContext | null | undefined,
		companyId: string,
		docId: string
	): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const company = await this.getById(tenant, companyId);
		if (!company) return false;

		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(companyDocuments)
			.where(and(eq(companyDocuments.id, docId), eq(companyDocuments.companyId, companyId)))
			.returning();

		return !!deleted;
	}
}
