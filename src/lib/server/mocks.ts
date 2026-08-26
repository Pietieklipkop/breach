import type { Expense, Asset, AssetActivity } from '$lib/types';

export function getMockExpenses(userId: string): Expense[] {
	const today = new Date();
	return [
		{
			id: 'exp-mock-1',
			userId,
			category: 'services',
			vendor: 'Cloudflare Inc',
			amountCents: 450000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 1 * 86400000),
			createdAt: new Date(today.getTime() - 1 * 86400000),
			notes: 'Monthly enterprise Cloudflare Workers & R2 storage subscription'
		},
		{
			id: 'exp-mock-2',
			userId,
			category: 'groceries',
			vendor: 'Woolworths Food',
			amountCents: 64280,
			currency: 'ZAR',
			date: new Date(today.getTime() - 2 * 86400000),
			createdAt: new Date(today.getTime() - 2 * 86400000),
			notes: 'Fresh produce & organic groceries'
		},
		{
			id: 'exp-mock-3',
			userId,
			category: 'utilities',
			vendor: 'Eskom Holdings',
			amountCents: 380000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 4 * 86400000),
			createdAt: new Date(today.getTime() - 4 * 86400000),
			notes: 'Shared office facility power & utility bill'
		},
		{
			id: 'exp-mock-4',
			userId,
			category: 'vehicle',
			vendor: 'Shell V-Power Garage',
			amountCents: 125000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 5 * 86400000),
			createdAt: new Date(today.getTime() - 5 * 86400000),
			notes: 'Full tank 95 Unleaded refuel'
		},
		{
			id: 'exp-mock-5',
			userId,
			category: 'supplies',
			vendor: 'Office National',
			amountCents: 295000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 8 * 86400000),
			createdAt: new Date(today.getTime() - 8 * 86400000),
			notes: 'Printing cartridges and desk accessories'
		},
		{
			id: 'exp-mock-6',
			userId,
			category: 'travel',
			vendor: 'Uber B.V.',
			amountCents: 85000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 11 * 86400000),
			createdAt: new Date(today.getTime() - 11 * 86400000),
			notes: 'Executive client meeting airport transfer'
		},
		{
			id: 'exp-mock-7',
			userId,
			category: 'maintenance',
			vendor: 'Tiger Wheel & Tyre',
			amountCents: 640000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 14 * 86400000),
			createdAt: new Date(today.getTime() - 14 * 86400000),
			notes: 'Vehicle tyre replacement & wheel alignment'
		},
		{
			id: 'exp-mock-8',
			userId,
			category: 'services',
			vendor: 'Discovery Health',
			amountCents: 1450000,
			currency: 'ZAR',
			date: new Date(today.getTime() - 18 * 86400000),
			createdAt: new Date(today.getTime() - 18 * 86400000),
			notes: 'Group medical aid & executive healthcare scheme'
		}
	];
}

export function getMockAssets(userId: string): Asset[] {
	return [
		{
			id: `asset-hilux-${userId.substring(0, 5)}`,
			userId,
			type: 'vehicle',
			name: '2022 Toyota Hilux 2.8 GD-6 Legend',
			make: 'Toyota',
			model: 'Hilux 2.8 GD-6',
			yearModel: 2022,
			purchaseDate: new Date('2022-03-15'),
			purchasePriceCents: 58000000,
			currentValuationCents: 54000000,
			purchaseKm: 15000,
			currentKm: 42500,
			notes: 'Main family vehicle asset.'
		}
	];
}

export function getMockActivities(assetsList: Asset[]): AssetActivity[] {
	const targetId = assetsList[0]?.id || 'asset-1';
	const today = new Date();
	return [
		{
			id: 'act-1',
			assetId: targetId,
			title: '10,000 km Scheduled Service',
			category: 'maintenance',
			costCents: 450000,
			vendor: 'Toyota Dealer Service',
			date: new Date(today.getTime() - 6 * 86400000),
			createdAt: new Date(today.getTime() - 6 * 86400000),
			mileageKm: 41000,
			notes: 'Full synthetic oil change & inspection.'
		},
		{
			id: 'act-2',
			assetId: targetId,
			title: 'All-Terrain Tyre Replacement',
			category: 'upgrade',
			costCents: 1250000,
			vendor: 'Tiger Wheel & Tyre',
			date: new Date(today.getTime() - 14 * 86400000),
			createdAt: new Date(today.getTime() - 14 * 86400000),
			mileageKm: 38000,
			notes: 'Replaced 4 tyres with BFGoodrich KO2 A/T.'
		}
	];
}
