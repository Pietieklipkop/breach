import { describe, it, expect } from 'vitest';
import { autoCategorizeExpense, DEFAULT_MASTER_CATEGORIES } from './server/categories';
import type { ExpenseCategory } from '$lib/types';

describe('Expense Auto-Categorization', () => {
	const categories: ExpenseCategory[] = DEFAULT_MASTER_CATEGORIES.map((c, i) => ({
		id: `cat-${i}`,
		name: c.name,
		slug: c.slug,
		icon: c.icon,
		color: c.color,
		keywords: c.keywords,
		isDefault: 1
	}));

	it('should categorize Woolworths receipts as groceries', () => {
		const result = autoCategorizeExpense('Woolworths Food V&A', 'Organic Milk, Bread', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('groceries');
		expect(result?.name).toBe('Groceries');
	});

	it('should categorize Shell petrol receipts as vehicle', () => {
		const result = autoCategorizeExpense('Shell V-Power Garage', '50L Unleaded 95', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('vehicle');
		expect(result?.name).toBe('Fuel & Vehicle');
	});

	it('should categorize Builders Warehouse receipts as maintenance', () => {
		const result = autoCategorizeExpense(
			'Builders Warehouse',
			'Paint, Screws, Sealant',
			categories
		);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('maintenance');
		expect(result?.name).toBe('Maintenance & Repairs');
	});

	it('should categorize Eskom / City power as utilities', () => {
		const result = autoCategorizeExpense(
			'City of Cape Town',
			'Prepaid Electricity 500 kWh',
			categories
		);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('utilities');
		expect(result?.name).toBe('Utilities & Municipal');
	});

	it("should categorize Nando's as dining", () => {
		const result = autoCategorizeExpense("Nando's Table", 'Full platter dinner', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('dining');
		expect(result?.name).toBe('Dining & Takeout');
	});

	it('should categorize Clicks Pharmacy as health', () => {
		const result = autoCategorizeExpense(
			'Clicks Pharmacy',
			'Vitamins and prescription',
			categories
		);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('health');
		expect(result?.name).toBe('Health & Pharmacy');
	});

	it('should categorize Cloudflare as professional services', () => {
		const result = autoCategorizeExpense('Cloudflare Inc', 'Workers and R2 hosting', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('services');
		expect(result?.name).toBe('Professional & Business Services');
	});

	it('should categorize Office National as office supplies', () => {
		const result = autoCategorizeExpense('Office National', 'Paper reams and ink', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('supplies');
		expect(result?.name).toBe('Office & Business Supplies');
	});

	it('should categorize Uber as travel', () => {
		const result = autoCategorizeExpense('Uber B.V.', 'Airport transfer trip', categories);
		expect(result).not.toBeNull();
		expect(result?.slug).toBe('travel');
		expect(result?.name).toBe('Travel & Transport');
	});

	it('should return null for unknown merchant without keywords', () => {
		const result = autoCategorizeExpense('Generic Mystery Shop', 'Misc item purchase', categories);
		expect(result).toBeNull();
	});
});
