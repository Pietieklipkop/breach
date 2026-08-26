import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { DEFAULT_MASTER_CATEGORIES, getOrSeedExpenseCategories } from '$lib/server/categories';
import { CompanyService } from '$lib/server/services';
import { redirect } from '@sveltejs/kit';
import type { Company, ExpenseCategory } from '$lib/types';

export const load: PageServerLoad = async (event) => {
	const currentUser = event.locals.user;
	if (!currentUser || !event.locals.tenant) {
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
		return {
			categories: defaultCategories,
			companies: [] as Company[],
			user: currentUser
		};
	}

	const db = getDb(d1);
	const categories = await getOrSeedExpenseCategories(
		db,
		event.locals.tenant.activeHouseholdId,
		event.locals.tenant.userId
	);

	const companyService = new CompanyService(d1);
	const companies = await companyService.list(event.locals.tenant);

	return {
		categories,
		companies,
		user: currentUser
	};
};
