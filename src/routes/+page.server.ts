import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { DEFAULT_MASTER_CATEGORIES, getOrSeedExpenseCategories } from '$lib/server/categories';
import { ExpenseService, AssetService } from '$lib/server/services';
import { getMockExpenses, getMockAssets, getMockActivities } from '$lib/server/mocks';
import { redirect } from '@sveltejs/kit';
import type { ExpenseCategory, AssetActivity } from '$lib/types';

export const load: PageServerLoad = async (event) => {
	const currentUser = event.locals.user;
	if (!currentUser) {
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

	const d1 = event.platform?.env?.DB;
	if (!d1) {
		const mockExpenses = getMockExpenses(currentUser.id);
		const mockAssets = getMockAssets(currentUser.id);
		const mockActivities = getMockActivities(mockAssets);
		return {
			expenses: mockExpenses,
			assets: mockAssets,
			activities: mockActivities,
			categories: defaultCategories,
			user: currentUser
		};
	}

	const db = getDb(d1);
	const tenant = event.locals.tenant;
	const householdId = tenant?.activeHouseholdId || null;

	const categories = await getOrSeedExpenseCategories(db, householdId, currentUser.id);

	// Load Expenses via ExpenseService
	const expenseService = new ExpenseService(d1);
	const loadedExpenses = tenant ? await expenseService.list(tenant) : [];

	// Load Assets via AssetService
	const assetService = new AssetService(d1);
	const loadedAssets = tenant ? await assetService.list(tenant) : [];

	// Load Asset Activities for the primary asset if available
	let loadedActivities: AssetActivity[] = [];
	if (loadedAssets.length > 0 && tenant) {
		loadedActivities = await assetService.listActivities(tenant, loadedAssets[0].id);
	}

	return {
		expenses: loadedExpenses,
		assets: loadedAssets,
		activities: loadedActivities,
		categories,
		user: currentUser
	};
};
