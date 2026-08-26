import { eq, or, isNull } from 'drizzle-orm';
import { expenseCategories } from './db/schema';
import type { getDb } from './db';
import type { ExpenseCategory } from '$lib/types';

type BreachDb = ReturnType<typeof getDb>;

export const DEFAULT_MASTER_CATEGORIES = [
	{
		name: 'Groceries',
		slug: 'groceries',
		icon: 'ShoppingCart',
		color: 'emerald',
		keywords:
			'woolworths, checkers, spar, pick n pay, shoprite, food lover, supermarket, grocery, fresh stop, fruit & veg, bakery'
	},
	{
		name: 'Fuel & Vehicle',
		slug: 'vehicle',
		icon: 'Fuel',
		color: 'amber',
		keywords:
			'shell, engen, bp, total, sasol, caltex, garage, petrol, diesel, fuel, auto, tyre, tiger wheel, supa quick, car wash, toyota, volkswagen, bmw, ford'
	},
	{
		name: 'Utilities & Municipal',
		slug: 'utilities',
		icon: 'Zap',
		color: 'blue',
		keywords:
			'eskom, city of cape town, city power, municipal, electricity, water, rates, refuse, solar, gas, prepaid'
	},
	{
		name: 'Maintenance & Repairs',
		slug: 'maintenance',
		icon: 'Wrench',
		color: 'purple',
		keywords:
			'builders, leroy merlin, chamberlains, mica, hardware, plumbing, electrician, pest control, repairs, handyman, painting, timber'
	},
	{
		name: 'Dining & Takeout',
		slug: 'dining',
		icon: 'Utensils',
		color: 'coral',
		keywords:
			'restaurant, cafe, kfc, mcdonald, nando, steers, wimpy, uber eats, mr d, coffee, starbucks, vida, mugg, ocean basket, spur, sushi'
	},
	{
		name: 'Subscriptions & Telecom',
		slug: 'subscriptions',
		icon: 'Tv',
		color: 'indigo',
		keywords:
			'netflix, spotify, dstv, apple, google, microsoft, internet, afrihost, vodacom, mtn, telkom, showmax, youtube, icloud'
	},
	{
		name: 'Health & Pharmacy',
		slug: 'health',
		icon: 'HeartPulse',
		color: 'rose',
		keywords:
			'clicks, dis-chem, pharmacy, chemist, doctor, medical, medi-clinic, dentist, optom, hospital, medicine'
	},
	{
		name: 'General Household',
		slug: 'general',
		icon: 'Tag',
		color: 'slate',
		keywords:
			'takealot, amazon, makro, game, mr price, zara, h&m, cotton on, retail, clothing, household, general'
	},
	{
		name: 'Professional & Business Services',
		slug: 'services',
		icon: 'Briefcase',
		color: 'blue',
		keywords:
			'cloudflare, aws, google cloud, hosting, legal, accounting, consulting, advisory, retainers, discovery health, medical aid, services, retainer, software'
	},
	{
		name: 'Office & Business Supplies',
		slug: 'supplies',
		icon: 'Package',
		color: 'amber',
		keywords:
			'office national, woolworths commercial, stationery, paper, cartridges, ink, desk, supplies, office'
	},
	{
		name: 'Travel & Transport',
		slug: 'travel',
		icon: 'Car',
		color: 'indigo',
		keywords:
			'uber, flight, kulula, flysafair, airbnb, hotel, car rental, taxi, transport, travel, airline'
	}
];

/**
 * Ensures a household or user has default expense categories populated.
 */
export async function getOrSeedExpenseCategories(
	db: BreachDb,
	householdId?: string | null,
	userId?: string | null
): Promise<ExpenseCategory[]> {
	try {
		const existing = await db
			.select()
			.from(expenseCategories)
			.where(
				householdId
					? or(
							eq(expenseCategories.householdId, householdId),
							isNull(expenseCategories.householdId)
						)
					: userId
						? or(eq(expenseCategories.userId, userId), isNull(expenseCategories.userId))
						: undefined
			);

		if (existing && existing.length > 0) {
			return existing.map((cat) => ({
				id: cat.id,
				userId: cat.userId,
				householdId: cat.householdId,
				name: cat.name,
				slug: cat.slug,
				icon: cat.icon,
				color: cat.color,
				keywords: cat.keywords,
				isDefault: cat.isDefault,
				createdAt: cat.createdAt,
				updatedAt: cat.updatedAt
			}));
		}

		// Seed default categories
		const inserted: ExpenseCategory[] = [];
		for (const def of DEFAULT_MASTER_CATEGORIES) {
			const [res] = await db
				.insert(expenseCategories)
				.values({
					householdId: householdId || null,
					userId: userId || null,
					name: def.name,
					slug: def.slug,
					icon: def.icon,
					color: def.color,
					keywords: def.keywords,
					isDefault: 1
				})
				.returning();

			if (res) {
				inserted.push({
					...res,
					createdAt: res.createdAt ? new Date(res.createdAt) : undefined,
					updatedAt: res.updatedAt ? new Date(res.updatedAt) : undefined
				});
			}
		}

		return inserted;
	} catch (err) {
		console.error('Failed to seed expense categories:', err);
		return DEFAULT_MASTER_CATEGORIES.map((cat, idx) => ({
			id: `def-${idx}`,
			name: cat.name,
			slug: cat.slug,
			icon: cat.icon,
			color: cat.color,
			keywords: cat.keywords,
			isDefault: 1
		}));
	}
}

export { autoCategorizeExpense } from '$lib/utils';
