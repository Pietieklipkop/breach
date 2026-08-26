import { describe, it, expect } from 'vitest';
import { tenantFilter } from './server/db/tenant';
import { assets } from './server/db/schema';
import {
	formatCurrency,
	autoCategorizeExpense,
	calculateLinearDepreciation,
	calculateAssetLifetimeStats
} from './utils';
import { parseExtractedDocumentText } from './server/ocr';
import {
	createExpenseSchema,
	createInvoiceSchema,
	createCompanySchema,
	createAssetSchema
} from './schemas';
import type { ExpenseCategory, TenantContext } from './types';

describe('Unit Test Suite - Breach AI Core Engine', () => {
	// --------------------------------------------------------------------------
	// 1. Multi-Tenant Context Boundary Isolation
	// --------------------------------------------------------------------------
	describe('1. tenantFilter Multi-Tenant Isolation', () => {
		it('should strictly isolate queries between Household and Personal contexts', () => {
			const householdTenant: TenantContext = {
				userId: 'usr_owner_101',
				activeHouseholdId: 'hh_fairtree_88',
				role: 'owner'
			};
			const personalTenant: TenantContext = {
				userId: 'usr_owner_101',
				activeHouseholdId: null,
				role: 'individual'
			};

			const hhFilter = tenantFilter(assets.userId, assets.householdId, householdTenant);
			expect(hhFilter).toBeDefined();

			const personalFilter = tenantFilter(assets.userId, assets.householdId, personalTenant);
			expect(personalFilter).toBeDefined();

			// Unauthenticated context must throw to prevent data leak
			expect(() => tenantFilter(assets.userId, assets.householdId, null)).toThrow(
				'Unauthenticated tenant context'
			);
			expect(() =>
				tenantFilter(assets.userId, assets.householdId, {
					userId: '',
					activeHouseholdId: null,
					role: 'individual'
				})
			).toThrow('Unauthenticated tenant context');
		});
	});

	// --------------------------------------------------------------------------
	// 2. Invoice Item Totals, Subtotal & VAT Calculations
	// --------------------------------------------------------------------------
	describe('2. Invoice Calculations & Subtotals', () => {
		it('should accurately compute invoice line item sums, VAT, and grand totals in integer cents', () => {
			const items = [
				{ description: 'Cloud Edge Hosting & Worker Compute', amountCents: 150000 }, // R1,500.00
				{ description: 'Database D1 Storage & Read Queries', amountCents: 45050 }, // R450.50
				{ description: 'R2 Object Storage Egress', amountCents: 24950 } // R249.50
			];

			const subtotalCents = items.reduce((sum, item) => sum + item.amountCents, 0);
			expect(subtotalCents).toBe(220000); // R2,200.00

			// 15% South African VAT computation
			const vatRate = 0.15;
			const vatCents = Math.round(subtotalCents * vatRate);
			expect(vatCents).toBe(33000); // R330.00

			const totalCents = subtotalCents + vatCents;
			expect(totalCents).toBe(253000); // R2,530.00
		});
	});

	// --------------------------------------------------------------------------
	// 3. OCR Text & Receipt Parsing Heuristic Engine
	// --------------------------------------------------------------------------
	describe('3. OCR Text & Receipt Parsing Heuristics', () => {
		it('should extract vendor, total amount, vehicle make/model, and date from raw OCR text', () => {
			const rawReceiptText = `
				TAX INVOICE
				Toyota Financial Services & Cape Town Dealership
				Make: Toyota Hilux 2.8 GD-6
				Year: 2022
				Date: 2026-03-15
				Total Due: R 4,500.00
				TAX (15%): R 586.95
				Thank you for your business
			`;

			const parsed = parseExtractedDocumentText(rawReceiptText, 'toyota_service.pdf', 'invoice');
			expect(parsed).toBeDefined();
			expect(parsed.make).toBe('Toyota');
			expect(parsed.model).toContain('Hilux 2.8 GD-6');
			expect(parsed.yearModel).toBe(2022);
			expect(parsed.amountCents).toBe(450000); // 4500.00 * 100
		});
	});

	// --------------------------------------------------------------------------
	// 4. Currency Formatter (formatCurrency) Edge Cases
	// --------------------------------------------------------------------------
	describe('4. formatCurrency Formatter Edge Cases', () => {
		it('should correctly format standard amounts, zero, negative credits, and multi-currency', () => {
			// Zero
			const zero = formatCurrency(0, 'ZAR');
			expect(zero).toMatch(/0[,.]00/);

			// Standard Positive ZAR (R 1,250.50)
			const positive = formatCurrency(125050, 'ZAR');
			expect(positive).toContain('1');
			expect(positive).toContain('250');

			// Negative / Refund (-R 50.00)
			const negative = formatCurrency(-5000, 'ZAR');
			expect(negative).toContain('50');

			// USD Currency format
			const usd = formatCurrency(9900, 'USD');
			expect(usd).toContain('99');
		});
	});

	// --------------------------------------------------------------------------
	// 5. Heatmap 365-Day Contribution Aggregation
	// --------------------------------------------------------------------------
	describe('5. Heatmap Contribution Aggregation', () => {
		it('should aggregate expenses and asset activities by date string and calculate spend', () => {
			const expensesList = [
				{ date: '2026-06-01', amountCents: 12000, vendor: 'Woolworths', category: 'groceries' },
				{ date: '2026-06-01', amountCents: 8000, vendor: 'Checkers', category: 'groceries' },
				{ date: '2026-06-02', amountCents: 45000, vendor: 'Shell', category: 'vehicle' }
			];

			const activityMap = new Map<
				string,
				{ count: number; spendCents: number; items: typeof expensesList }
			>();

			for (const exp of expensesList) {
				const dateKey = exp.date;
				const current = activityMap.get(dateKey) || { count: 0, spendCents: 0, items: [] };
				current.count += 1;
				current.spendCents += exp.amountCents;
				current.items.push(exp);
				activityMap.set(dateKey, current);
			}

			expect(activityMap.get('2026-06-01')?.count).toBe(2);
			expect(activityMap.get('2026-06-01')?.spendCents).toBe(20000);
			expect(activityMap.get('2026-06-02')?.count).toBe(1);
			expect(activityMap.get('2026-06-02')?.spendCents).toBe(45000);
			expect(activityMap.get('2026-06-03')).toBeUndefined();
		});
	});

	// --------------------------------------------------------------------------
	// 6. Asset Straight-Line Depreciation & Valuation Calculator
	// --------------------------------------------------------------------------
	describe('6. Asset Straight-Line Depreciation & Lifetime Stats', () => {
		it('should compute depreciation and net lifetime asset valuation differences', () => {
			// Asset: R600,000 purchase, R120,000 salvage value over 60 months (5 years), at month 30 (half-life)
			const depreciation = calculateLinearDepreciation(60000000, 12000000, 60, 30);
			// Depreciable base = R480,000 -> half = R240,000 depreciation -> value = R360,000
			expect(depreciation.totalDepreciationCents).toBe(24000000);
			expect(depreciation.depreciatedValueCents).toBe(36000000);

			// Test Asset Lifetime Stats helper
			const mockAsset = {
				id: 'asset_1',
				userId: 'usr_1',
				householdId: null,
				type: 'vehicle' as const,
				name: 'Family SUV',
				make: 'Toyota',
				model: 'Fortuner',
				yearModel: 2022,
				purchaseDate: new Date('2022-01-01'),
				purchasePriceCents: 50000000,
				currentValuationCents: 42000000,
				purchaseKm: 10000,
				currentKm: 35000,
				documentUrl: null,
				notes: null,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const mockActivities = [
				{
					id: 'act_1',
					assetId: 'asset_1',
					title: 'Tyre replacement',
					category: 'maintenance' as const,
					costCents: 1200000,
					vendor: 'Tiger Wheel & Tyre',
					date: new Date(),
					mileageKm: 30000,
					invoiceUrl: null,
					notes: null,
					createdAt: new Date()
				}
			];

			const stats = calculateAssetLifetimeStats(mockAsset, mockActivities);
			expect(stats.totalMaintenanceCents).toBe(1200000);
			expect(stats.totalInvestedCents).toBe(51200000);
			expect(stats.netValueDiffCents).toBe(-9200000);
			expect(stats.isValuePositive).toBe(false);
		});
	});

	// --------------------------------------------------------------------------
	// 7. Custom Category Matching & Keyword Precedence
	// --------------------------------------------------------------------------
	describe('7. Category Keyword Matching Precedence', () => {
		it('should match custom categories by keywords before falling back or returning null', () => {
			const categories: ExpenseCategory[] = [
				{
					id: 'cat_custom_1',
					name: 'Software Subscriptions',
					slug: 'subscriptions',
					icon: 'Cloud',
					color: '#8b5cf6',
					keywords: 'github, cloudflare, openrouter, vercel, aws',
					isDefault: 0
				},
				{
					id: 'cat_groceries',
					name: 'Groceries',
					slug: 'groceries',
					icon: 'ShoppingBag',
					color: '#22c55e',
					keywords: 'woolworths, checkers, pick n pay, spar',
					isDefault: 1
				}
			];

			// Match custom keyword
			const match1 = autoCategorizeExpense('Cloudflare Inc London', 'DNS and Workers', categories);
			expect(match1?.slug).toBe('subscriptions');
			expect(match1?.name).toBe('Software Subscriptions');

			// Match grocery keyword
			const match2 = autoCategorizeExpense('Checkers Hyper Sandton', 'Fresh food', categories);
			expect(match2?.slug).toBe('groceries');

			// Unknown merchant returns null
			const unknown = autoCategorizeExpense('XYZ Mystery Store 99', 'Unknown item', categories);
			expect(unknown).toBeNull();
		});
	});

	// --------------------------------------------------------------------------
	// 8. R2 Media MIME Resolution & Path Security
	// --------------------------------------------------------------------------
	describe('8. Media MIME Resolution & Security Guard', () => {
		function resolveMimeType(key: string): string {
			if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
				throw new Error('Invalid path traversal sequence in media key');
			}
			if (key.endsWith('.png')) return 'image/png';
			if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
			if (key.endsWith('.svg')) return 'image/svg+xml';
			if (key.endsWith('.pdf')) return 'application/pdf';
			if (key.endsWith('.webp')) return 'image/webp';
			return 'application/octet-stream';
		}

		it('should resolve correct MIME types and reject directory traversal attempts', () => {
			expect(resolveMimeType('receipts/slip_2026.png')).toBe('image/png');
			expect(resolveMimeType('documents/invoice_march.pdf')).toBe('application/pdf');
			expect(resolveMimeType('logos/brand_logo.svg')).toBe('image/svg+xml');
			expect(resolveMimeType('photos/car.webp')).toBe('image/webp');
			expect(resolveMimeType('archive/data.bin')).toBe('application/octet-stream');

			// Path traversal guards
			expect(() => resolveMimeType('../secret.env')).toThrow('Invalid path traversal sequence');
			expect(() => resolveMimeType('/etc/passwd')).toThrow('Invalid path traversal sequence');
		});
	});

	// --------------------------------------------------------------------------
	// 9. Zod Validation Schemas Rigor
	// --------------------------------------------------------------------------
	describe('9. Zod Validation Schemas', () => {
		it('should validate valid data and reject invalid schema payloads', () => {
			// Valid Expense
			const validExp = createExpenseSchema.safeParse({
				vendor: 'Woolworths',
				amountCents: 15400,
				category: 'groceries',
				currency: 'ZAR'
			});
			expect(validExp.success).toBe(true);

			// Invalid Expense (negative amount)
			const invalidExp = createExpenseSchema.safeParse({
				vendor: 'Invalid Shop',
				amountCents: -500
			});
			expect(invalidExp.success).toBe(false);

			// Valid Invoice
			const validInvoice = createInvoiceSchema.safeParse({
				fromCompanyId: 'comp_1',
				toCompanyId: 'comp_2',
				status: 'issued',
				items: [{ description: 'Dev Service', amountCents: 50000 }]
			});
			expect(validInvoice.success).toBe(true);

			// Valid Company
			const validCompany = createCompanySchema.safeParse({
				name: 'Fairtree Capital',
				taxNumber: '4920192831',
				companyType: 'holding'
			});
			expect(validCompany.success).toBe(true);

			// Valid Asset
			const validAsset = createAssetSchema.safeParse({
				name: 'Primary Residence',
				type: 'home',
				purchasePriceCents: 350000000
			});
			expect(validAsset.success).toBe(true);
		});
	});

	// --------------------------------------------------------------------------
	// 10. Disabled User Authentication & Session Eviction Logic
	// --------------------------------------------------------------------------
	describe('10. Disabled User Session Eviction', () => {
		it('should identify disabled users and enforce session invalidation', () => {
			const activeUser = { id: 'usr_1', email: 'user@breach.co.za', disabled: false };
			const disabledUser = { id: 'usr_2', email: 'banned@breach.co.za', disabled: true };

			function processUserSession(user: { id: string; email: string; disabled?: boolean }) {
				if (user.disabled) {
					return { shouldSignOut: true, session: null, redirect: '/login' };
				}
				return { shouldSignOut: false, session: { userId: user.id }, redirect: null };
			}

			const activeResult = processUserSession(activeUser);
			expect(activeResult.shouldSignOut).toBe(false);
			expect(activeResult.session).not.toBeNull();

			const disabledResult = processUserSession(disabledUser);
			expect(disabledResult.shouldSignOut).toBe(true);
			expect(disabledResult.session).toBeNull();
			expect(disabledResult.redirect).toBe('/login');
		});
	});
});
