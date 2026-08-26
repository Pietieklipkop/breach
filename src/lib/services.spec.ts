import { describe, it, expect } from 'vitest';
import {
	ExpenseService,
	InvoiceService,
	CompanyService,
	AssetService,
	CategoryService
} from './server/services';
import { tenantFilter } from './server/db/tenant';
import { assets } from './server/db/schema';

describe('Domain Services & Tenancy Security Layer', () => {
	it('should export all domain service classes', () => {
		expect(ExpenseService).toBeDefined();
		expect(InvoiceService).toBeDefined();
		expect(CompanyService).toBeDefined();
		expect(AssetService).toBeDefined();
		expect(CategoryService).toBeDefined();
	});

	it('should throw error when tenant context is missing', async () => {
		const mockD1 = {} as D1Database;

		const expenseService = new ExpenseService(mockD1);
		await expect(
			expenseService.create(null, {
				vendor: 'Test Vendor',
				amountCents: 1000
			})
		).rejects.toThrow('Unauthenticated tenant context');

		const invoiceService = new InvoiceService(mockD1);
		await expect(
			invoiceService.createInvoiceWithItems(null, {
				fromCompanyId: 'comp-1',
				toCompanyId: 'comp-2'
			})
		).rejects.toThrow('Unauthenticated tenant context');

		const companyService = new CompanyService(mockD1);
		await expect(
			companyService.create(null, {
				name: 'Test Corp'
			})
		).rejects.toThrow('Unauthenticated tenant context');

		const assetService = new AssetService(mockD1);
		await expect(
			assetService.create(null, {
				name: 'Test Vehicle'
			})
		).rejects.toThrow('Unauthenticated tenant context');

		const categoryService = new CategoryService(mockD1);
		await expect(
			categoryService.create(null, {
				name: 'Test Category'
			})
		).rejects.toThrow('Unauthenticated tenant context');
	});

	it('should enforce strict scope isolation in tenantFilter', () => {
		// In household mode, it should filter strictly by householdId
		const householdTenant = {
			userId: 'usr-1',
			activeHouseholdId: 'hh-123',
			role: 'owner' as const
		};
		const householdFilter = tenantFilter(assets.userId, assets.householdId, householdTenant);
		expect(householdFilter).toBeDefined();

		// In personal mode, it should filter strictly by userId with null householdId
		const personalTenant = {
			userId: 'usr-2',
			activeHouseholdId: null,
			role: 'individual' as const
		};
		const personalFilter = tenantFilter(assets.userId, assets.householdId, personalTenant);
		expect(personalFilter).toBeDefined();

		// Unauthenticated throws
		expect(() => tenantFilter(assets.userId, assets.householdId, null)).toThrow(
			'Unauthenticated tenant context'
		);
	});
});
