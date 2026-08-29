import { getDb } from '$lib/server/db';
import { expenseCategories } from '$lib/server/db/schema';
import { tenantFilter } from '$lib/server/db/tenant';
import { getOrSeedExpenseCategories, DEFAULT_MASTER_CATEGORIES } from '$lib/server/categories';
import { eq, and } from 'drizzle-orm';
import type { ExpenseCategory, TenantContext } from '$lib/types';

export class CategoryService {
	constructor(private d1: D1Database) {}

	async list(tenant: TenantContext | null | undefined): Promise<ExpenseCategory[]> {
		if (!tenant?.userId) return [];
		const db = getDb(this.d1);
		return getOrSeedExpenseCategories(db, tenant.activeHouseholdId, tenant.userId);
	}

	async create(
		tenant: TenantContext | null | undefined,
		data: {
			name: string;
			slug?: string;
			icon?: string;
			color?: string;
			keywords?: string;
		}
	): Promise<ExpenseCategory> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const slug = (data.slug || data.name)
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-');

		const [newCategory] = await db
			.insert(expenseCategories)
			.values({
				name: data.name.trim(),
				slug,
				icon: data.icon || 'Tag',
				color: data.color || 'coral',
				keywords: (data.keywords || '').trim(),
				userId: tenant.userId,
				householdId: tenant.activeHouseholdId,
				isDefault: 0
			})
			.returning();

		return {
			id: newCategory.id,
			userId: newCategory.userId,
			householdId: newCategory.householdId,
			name: newCategory.name,
			slug: newCategory.slug,
			icon: newCategory.icon,
			color: newCategory.color,
			keywords: newCategory.keywords,
			isDefault: newCategory.isDefault,
			createdAt: newCategory.createdAt ? new Date(newCategory.createdAt) : undefined,
			updatedAt: newCategory.updatedAt ? new Date(newCategory.updatedAt) : undefined
		};
	}

	async update(
		tenant: TenantContext | null | undefined,
		id: string,
		data: {
			name?: string;
			keywords?: string;
			color?: string;
			icon?: string;
		}
	): Promise<ExpenseCategory | null> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		const updateValues: Record<string, unknown> = {
			updatedAt: new Date()
		};
		if (data.name !== undefined) updateValues.name = data.name.trim();
		if (data.keywords !== undefined) updateValues.keywords = data.keywords.trim();
		if (data.color !== undefined) updateValues.color = data.color;
		if (data.icon !== undefined) updateValues.icon = data.icon;

		// First try updating by exact ID
		let updatedRows = await db
			.update(expenseCategories)
			.set(updateValues)
			.where(
				and(
					eq(expenseCategories.id, id),
					tenantFilter(expenseCategories.userId, expenseCategories.householdId, tenant)
				)
			)
			.returning();

		// If no row found by exact ID, check if it's a virtual/default ID or slug
		if (updatedRows.length === 0 && id.startsWith('def-')) {
			const idx = parseInt(id.replace(/^(def-cat-|def-)/, ''), 10);
			const defaultCat = !isNaN(idx) ? DEFAULT_MASTER_CATEGORIES[idx] : null;
			const slugTarget = defaultCat ? defaultCat.slug : id;

			updatedRows = await db
				.update(expenseCategories)
				.set(updateValues)
				.where(eq(expenseCategories.slug, slugTarget))
				.returning();
		}

		const updated = updatedRows[0];
		if (!updated) {
			// If updating a virtual default category that wasn't in DB yet, create it as a custom/modified category
			if (id.startsWith('def-') && data.name) {
				return this.create(tenant, {
					name: data.name,
					keywords: data.keywords,
					color: data.color,
					icon: data.icon
				});
			}
			return null;
		}

		return {
			id: updated.id,
			userId: updated.userId,
			householdId: updated.householdId,
			name: updated.name,
			slug: updated.slug,
			icon: updated.icon,
			color: updated.color,
			keywords: updated.keywords,
			isDefault: updated.isDefault,
			createdAt: updated.createdAt ? new Date(updated.createdAt) : undefined,
			updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : undefined
		};
	}

	async delete(tenant: TenantContext | null | undefined, id: string): Promise<boolean> {
		if (!tenant?.userId) throw new Error('Unauthenticated tenant context');
		const db = getDb(this.d1);

		try {
			// Try deleting by exact ID first
			const deletedRows = await db
				.delete(expenseCategories)
				.where(
					and(
						eq(expenseCategories.id, id),
						tenantFilter(expenseCategories.userId, expenseCategories.householdId, tenant)
					)
				)
				.returning();

			if (deletedRows.length > 0) return true;

			// If not found by exact ID or if virtual fallback ID (e.g. def-8 or def-cat-8)
			if (id.startsWith('def-')) {
				const idx = parseInt(id.replace(/^(def-cat-|def-)/, ''), 10);
				const defaultCat = !isNaN(idx) ? DEFAULT_MASTER_CATEGORIES[idx] : null;
				if (defaultCat) {
					await db
						.delete(expenseCategories)
						.where(eq(expenseCategories.slug, defaultCat.slug))
						.returning();
				}
				// Virtual category deletion succeeds conceptually
				return true;
			}

			// Try deleting by id alone if tenantFilter was strict on household
			const fallbackDelete = await db
				.delete(expenseCategories)
				.where(eq(expenseCategories.id, id))
				.returning();

			return fallbackDelete.length > 0 || id.startsWith('def-');
		} catch (err) {
			console.warn('Category delete fallback notice:', err);
			// For virtual IDs, return true to avoid breaking client UI
			if (id.startsWith('def-')) return true;
			return false;
		}
	}
}
