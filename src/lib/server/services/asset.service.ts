import { getDb } from '$lib/server/db';
import { assets, assetActivities } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { eq, and, desc } from 'drizzle-orm';
import type { Asset, AssetActivity, AssetType, ActivityCategory, TenantContext } from '$lib/types';

export class AssetService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<Asset[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);
		const rows = await db
			.select()
			.from(assets)
			.where(tenantFilter(assets.userId, assets.householdId, tenant))
			.orderBy(desc(assets.createdAt));

		return rows.map((a) => ({
			id: a.id,
			userId: a.userId,
			householdId: a.householdId,
			type: a.type as AssetType,
			name: a.name,
			make: a.make,
			model: a.model,
			yearModel: a.yearModel,
			purchaseDate: a.purchaseDate,
			purchasePriceCents: a.purchasePriceCents,
			currentValuationCents: a.currentValuationCents,
			purchaseKm: a.purchaseKm,
			currentKm: a.currentKm,
			documentUrl: a.documentUrl,
			notes: a.notes,
			createdAt: a.createdAt,
			updatedAt: a.updatedAt
		}));
	}

	async getById(tenant: TenantContext | null | undefined, id: string): Promise<Asset | null> {
		if (!tenant?.userId) return null;
		const db = getDb(this.d1);
		const [row] = await db
			.select()
			.from(assets)
			.where(and(eq(assets.id, id), tenantFilter(assets.userId, assets.householdId, tenant)))
			.limit(1);

		if (!row) return null;

		return {
			id: row.id,
			userId: row.userId,
			householdId: row.householdId,
			type: row.type as AssetType,
			name: row.name,
			make: row.make,
			model: row.model,
			yearModel: row.yearModel,
			purchaseDate: row.purchaseDate,
			purchasePriceCents: row.purchasePriceCents,
			currentValuationCents: row.currentValuationCents,
			purchaseKm: row.purchaseKm,
			currentKm: row.currentKm,
			documentUrl: row.documentUrl,
			notes: row.notes,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
	}

	async create(
		tenant: TenantContext | null | undefined,
		data: {
			name: string;
			type?: AssetType;
			make?: string | null;
			model?: string | null;
			yearModel?: number | null;
			purchaseDate?: Date | string | number | null;
			purchasePriceCents?: number;
			currentValuationCents?: number;
			purchaseKm?: number | null;
			currentKm?: number | null;
			documentUrl?: string | null;
			notes?: string | null;
		}
	): Promise<Asset> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const purchaseCents = data.purchasePriceCents || 0;
		const valCents =
			data.currentValuationCents !== undefined ? data.currentValuationCents : purchaseCents;

		const purchaseDate = data.purchaseDate
			? typeof data.purchaseDate === 'string' || typeof data.purchaseDate === 'number'
				? new Date(data.purchaseDate)
				: data.purchaseDate
			: new Date();

		const [created] = await db
			.insert(assets)
			.values({
				userId: tenant.userId,
				householdId: tenant.activeHouseholdId,
				name: data.name.trim(),
				type: data.type || 'vehicle',
				make: data.make ? data.make.trim() : null,
				model: data.model ? data.model.trim() : null,
				yearModel: data.yearModel || null,
				purchaseDate,
				purchasePriceCents: purchaseCents,
				currentValuationCents: valCents,
				purchaseKm: data.purchaseKm || null,
				currentKm: data.currentKm || data.purchaseKm || null,
				documentUrl: data.documentUrl || null,
				notes: data.notes ? data.notes.trim() : null
			})
			.returning();

		return {
			id: created.id,
			userId: created.userId,
			householdId: created.householdId,
			type: created.type as AssetType,
			name: created.name,
			make: created.make,
			model: created.model,
			yearModel: created.yearModel,
			purchaseDate: created.purchaseDate,
			purchasePriceCents: created.purchasePriceCents,
			currentValuationCents: created.currentValuationCents,
			purchaseKm: created.purchaseKm,
			currentKm: created.currentKm,
			documentUrl: created.documentUrl,
			notes: created.notes,
			createdAt: created.createdAt,
			updatedAt: created.updatedAt
		};
	}

	async update(
		tenant: TenantContext | null | undefined,
		id: string,
		data: {
			name?: string;
			type?: AssetType;
			make?: string | null;
			model?: string | null;
			yearModel?: number | null;
			purchaseDate?: Date | string | number | null;
			purchasePriceCents?: number;
			currentValuationCents?: number;
			purchaseKm?: number | null;
			currentKm?: number | null;
			documentUrl?: string | null;
			notes?: string | null;
		}
	): Promise<Asset | null> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const existing = await this.getById(tenant, id);
		if (!existing) return null;

		const db = getDb(this.d1);
		const updateValues: Record<string, unknown> = {
			updatedAt: new Date()
		};

		if (data.name !== undefined) updateValues.name = data.name.trim();
		if (data.type !== undefined) updateValues.type = data.type;
		if (data.make !== undefined) updateValues.make = data.make ? data.make.trim() : null;
		if (data.model !== undefined) updateValues.model = data.model ? data.model.trim() : null;
		if (data.yearModel !== undefined) updateValues.yearModel = data.yearModel;
		if (data.purchaseDate !== undefined) {
			updateValues.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
		}
		if (data.purchasePriceCents !== undefined) {
			updateValues.purchasePriceCents = data.purchasePriceCents;
		}
		if (data.currentValuationCents !== undefined) {
			updateValues.currentValuationCents = data.currentValuationCents;
		}
		if (data.purchaseKm !== undefined) updateValues.purchaseKm = data.purchaseKm;
		if (data.currentKm !== undefined) updateValues.currentKm = data.currentKm;
		if (data.documentUrl !== undefined) updateValues.documentUrl = data.documentUrl;
		if (data.notes !== undefined) updateValues.notes = data.notes ? data.notes.trim() : null;

		await db
			.update(assets)
			.set(updateValues)
			.where(and(eq(assets.id, id), tenantFilter(assets.userId, assets.householdId, tenant)));

		return this.getById(tenant, id);
	}

	async delete(tenant: TenantContext | null | undefined, id: string): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(assets)
			.where(and(eq(assets.id, id), tenantFilter(assets.userId, assets.householdId, tenant)))
			.returning();

		return !!deleted;
	}

	/**
	 * Lists activities for a specific asset, guaranteeing tenant authorization.
	 */
	async listActivities(
		tenant: TenantContext | null | undefined,
		assetId: string
	): Promise<AssetActivity[]> {
		if (!tenant?.userId) return [];
		// Verify asset belongs to tenant (IDOR prevention)
		const asset = await this.getById(tenant, assetId);
		if (!asset) return [];

		const db = getDb(this.d1);
		const rows = await db
			.select()
			.from(assetActivities)
			.where(eq(assetActivities.assetId, assetId))
			.orderBy(desc(assetActivities.date));

		return rows.map((act) => ({
			id: act.id,
			assetId: act.assetId,
			title: act.title,
			category: act.category as ActivityCategory,
			costCents: act.costCents,
			vendor: act.vendor,
			date: act.date,
			mileageKm: act.mileageKm,
			invoiceUrl: act.invoiceUrl,
			notes: act.notes,
			createdAt: act.createdAt
		}));
	}

	/**
	 * Creates an activity for an asset and automatically updates the asset's currentKm
	 * if the activity mileage exceeds the current recorded mileage.
	 */
	async createActivity(
		tenant: TenantContext | null | undefined,
		assetId: string,
		data: {
			title: string;
			category?: ActivityCategory;
			costCents?: number;
			vendor?: string | null;
			date?: Date | string | number;
			mileageKm?: number | null;
			invoiceUrl?: string | null;
			notes?: string | null;
		}
	): Promise<AssetActivity> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');

		// Verify asset belongs to tenant (IDOR prevention)
		const asset = await this.getById(tenant, assetId);
		if (!asset) {
			throw new Error('Asset not found or access denied');
		}

		const db = getDb(this.d1);
		const parsedDate = data.date
			? typeof data.date === 'string' || typeof data.date === 'number'
				? new Date(data.date)
				: data.date
			: new Date();

		const [created] = await db
			.insert(assetActivities)
			.values({
				assetId,
				title: data.title.trim(),
				category: data.category || 'maintenance',
				costCents: data.costCents || 0,
				vendor: data.vendor ? data.vendor.trim() : null,
				date: parsedDate,
				mileageKm: data.mileageKm || null,
				invoiceUrl: data.invoiceUrl || null,
				notes: data.notes ? data.notes.trim() : null
			})
			.returning();

		// Domain Business Logic: Automatic Mileage Rollover
		if (data.mileageKm && (asset.currentKm === null || data.mileageKm > (asset.currentKm || 0))) {
			await db
				.update(assets)
				.set({ currentKm: data.mileageKm, updatedAt: new Date() })
				.where(eq(assets.id, assetId));
		}

		return {
			id: created.id,
			assetId: created.assetId,
			title: created.title,
			category: created.category as ActivityCategory,
			costCents: created.costCents,
			vendor: created.vendor,
			date: created.date,
			mileageKm: created.mileageKm,
			invoiceUrl: created.invoiceUrl,
			notes: created.notes,
			createdAt: created.createdAt
		};
	}

	async deleteActivity(
		tenant: TenantContext | null | undefined,
		assetId: string,
		activityId: string
	): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');

		const asset = await this.getById(tenant, assetId);
		if (!asset) return false;

		const db = getDb(this.d1);
		const [deleted] = await db
			.delete(assetActivities)
			.where(and(eq(assetActivities.id, activityId), eq(assetActivities.assetId, assetId)))
			.returning();

		return !!deleted;
	}
}
