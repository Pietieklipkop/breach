import type { Asset, AssetActivity, ExpenseCategory } from './types';

export function formatCurrency(amountCents: number, currency: string = 'ZAR'): string {
	const amount = amountCents / 100;
	return new Intl.NumberFormat('en-ZA', {
		style: 'currency',
		currency: currency,
		maximumFractionDigits: 2
	}).format(amount);
}

export function formatDate(dateInput: Date | number | string | null | undefined): string {
	if (!dateInput) return 'N/A';
	const d = new Date(dateInput);
	if (isNaN(d.getTime())) return 'N/A';
	return new Intl.DateTimeFormat('en-ZA', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(d);
}

export function calculateAssetLifetimeStats(asset: Asset, activities: AssetActivity[]) {
	const totalMaintenanceCents = activities.reduce((sum, act) => sum + act.costCents, 0);
	const totalInvestedCents = asset.purchasePriceCents + totalMaintenanceCents;
	const netValueDiffCents = asset.currentValuationCents - totalInvestedCents;
	const isValuePositive = netValueDiffCents >= 0;

	return {
		purchasePriceCents: asset.purchasePriceCents,
		totalMaintenanceCents,
		totalInvestedCents,
		currentValuationCents: asset.currentValuationCents,
		netValueDiffCents,
		isValuePositive
	};
}

/**
 * Automatically categorize a purchase given its vendor name, receipt text, and list of categories.
 * Returns null if no keyword or name match is found.
 */
export function autoCategorizeExpense(
	vendor: string,
	rawText: string,
	categories: ExpenseCategory[]
): { slug: string; name: string } | null {
	const combined = `${vendor} ${rawText}`.toLowerCase().trim();
	if (!combined) return null;

	for (const cat of categories) {
		if (!cat.keywords) continue;
		const keywords = cat.keywords
			.split(',')
			.map((k) => k.trim().toLowerCase())
			.filter(Boolean);

		for (const kw of keywords) {
			if (combined.includes(kw)) {
				return { slug: cat.slug, name: cat.name };
			}
		}
	}

	// Exact name or slug match
	for (const cat of categories) {
		if (combined.includes(cat.name.toLowerCase()) || combined.includes(cat.slug.toLowerCase())) {
			return { slug: cat.slug, name: cat.name };
		}
	}

	// IMPORTANT: Return null if no match. Do NOT force a default category!
	return null;
}

/**
 * Calculates straight-line depreciation for an asset given lifespan and age.
 */
export function calculateLinearDepreciation(
	purchasePriceCents: number,
	salvageValueCents: number,
	usefulLifespanMonths: number,
	ageMonths: number
): { depreciatedValueCents: number; totalDepreciationCents: number } {
	if (usefulLifespanMonths <= 0 || purchasePriceCents <= 0) {
		return { depreciatedValueCents: purchasePriceCents, totalDepreciationCents: 0 };
	}
	const depreciableBase = Math.max(0, purchasePriceCents - salvageValueCents);
	const monthlyDepreciation = depreciableBase / usefulLifespanMonths;
	const totalDepreciation = Math.min(depreciableBase, Math.max(0, monthlyDepreciation * ageMonths));
	const depreciatedValue = Math.round(purchasePriceCents - totalDepreciation);
	return {
		depreciatedValueCents: depreciatedValue,
		totalDepreciationCents: Math.round(totalDepreciation)
	};
}
