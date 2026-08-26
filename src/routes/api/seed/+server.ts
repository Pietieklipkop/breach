import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import {
	assets,
	assetActivities,
	expenses,
	companies,
	invoices,
	invoiceItems
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const handleSeed = async (event: RequestEvent) => {
	const { auth } = event.locals;
	const platform = event.platform;
	const d1 = platform?.env?.DB;

	const env = platform?.env as (Env & { ENVIRONMENT?: string; SEED_SECRET?: string }) | undefined;
	const isProd = env?.ENVIRONMENT === 'production';
	const seedKey = event.request.headers.get('x-seed-key');
	if (isProd && seedKey !== env?.SEED_SECRET) {
		return json({ error: 'Seeding disabled in production' }, { status: 403 });
	}

	try {
		let adminUser: { id: string; email: string; name: string } | null = null;

		// 1. Check if sign-in works with admin@breach.co.za / password123
		try {
			const signInRes = await auth.api.signInEmail({
				body: {
					email: 'admin@breach.co.za',
					password: 'password123'
				},
				headers: event.request.headers
			});
			if (signInRes && signInRes.user) {
				adminUser = signInRes.user;
			}
		} catch {
			if (d1) {
				try {
					const db = getDb(d1);
					await db.delete(user).where(eq(user.email, 'admin@breach.co.za'));
				} catch (dbErr) {
					console.warn('Clean user cleanup warning:', dbErr);
				}
			}

			const signUpRes = await auth.api.signUpEmail({
				body: {
					email: 'admin@breach.co.za',
					password: 'password123',
					name: 'Household Administrator'
				},
				headers: event.request.headers
			});
			if (signUpRes && signUpRes.user) {
				adminUser = signUpRes.user;
			}
		}

		if (d1 && adminUser?.id) {
			const db = getDb(d1);
			const now = new Date();

			// 2. Seed Assets
			try {
				const existingAssets = await db
					.select()
					.from(assets)
					.where(eq(assets.userId, adminUser.id));
				if (existingAssets.length === 0) {
					const [insertedAsset] = await db
						.insert(assets)
						.values({
							userId: adminUser.id,
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
						})
						.returning();

					if (insertedAsset) {
						await db.insert(assetActivities).values([
							{
								assetId: insertedAsset.id,
								title: '10,000 km Scheduled Service',
								category: 'maintenance',
								costCents: 450000,
								vendor: 'Toyota Dealer Service',
								date: new Date('2022-09-10'),
								mileageKm: 25000,
								notes: 'Full synthetic oil change & inspection.'
							},
							{
								assetId: insertedAsset.id,
								title: 'All-Terrain Tyre Replacement',
								category: 'upgrade',
								costCents: 1250000,
								vendor: 'Tiger Wheel & Tyre',
								date: new Date('2023-04-20'),
								mileageKm: 38000,
								notes: 'Replaced 4 tyres with BFGoodrich KO2 A/T.'
							}
						]);
					}
				}
			} catch (assetErr) {
				console.warn('Assets seed notice:', assetErr);
			}

			// 3. Seed Companies Master Data
			try {
				const existingCompanies = await db
					.select()
					.from(companies)
					.where(eq(companies.userId, adminUser.id));
				if (existingCompanies.length === 0) {
					const sampleCompanies = [
						{
							id: `comp-holding-${adminUser.id.substring(0, 5)}`,
							userId: adminUser.id,
							name: 'Apex Holdings (Pty) Ltd',
							regNumber: '2019/482910/07',
							taxNumber: '9182736450',
							companyType: 'holding' as const,
							address: '100 Fairtree Plaza, Sandton, Johannesburg, 2196',
							email: 'admin@apexholdings.co.za',
							phone: '+27 11 555 0199',
							ownershipDetails: '100% Owned by Primary Family Trust (Director: Lead Family Member)'
						},
						{
							id: `comp-sub-${adminUser.id.substring(0, 5)}`,
							userId: adminUser.id,
							name: 'Breach Digital Solutions (Pty) Ltd',
							regNumber: '2021/394012/07',
							taxNumber: '9827364102',
							companyType: 'subsidiary' as const,
							address: '42 Innovation Drive, Rosebank, Johannesburg, 2196',
							email: 'finance@breachdigital.co.za',
							phone: '+27 11 555 0244',
							ownershipDetails: '80% Owned by Apex Holdings (Pty) Ltd, 20% Founder Management'
						},
						{
							id: `comp-client-${adminUser.id.substring(0, 5)}`,
							userId: adminUser.id,
							name: 'Acme Enterprise Ventures',
							regNumber: '2018/102938/07',
							taxNumber: '9012837465',
							companyType: 'client' as const,
							address: '77 Executive Boulevard, Cape Town, 8001',
							email: 'accounts@acmeventures.co.za',
							phone: '+27 21 444 0100',
							ownershipDetails: 'External Client / Inter-company Partner'
						}
					];

					for (const comp of sampleCompanies) {
						await db.insert(companies).values(comp);
					}
				}
			} catch (compErr) {
				console.warn('Companies seed notice:', compErr);
			}

			// 4. Seed Test Expenses Data
			try {
				const existingExpenses = await db
					.select()
					.from(expenses)
					.where(eq(expenses.userId, adminUser.id));
				if (existingExpenses.length === 0) {
					const testExpenses = [
						{
							userId: adminUser.id,
							category: 'services',
							vendor: 'Cloudflare Inc',
							amountCents: 450000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 2 * 86400000),
							notes: 'Monthly enterprise Cloudflare Workers & R2 storage subscription'
						},
						{
							userId: adminUser.id,
							category: 'utilities',
							vendor: 'Eskom Holdings',
							amountCents: 380000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 5 * 86400000),
							notes: 'Shared office facility power & utility bill'
						},
						{
							userId: adminUser.id,
							category: 'supplies',
							vendor: 'Woolworths Commercial',
							amountCents: 125000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 7 * 86400000),
							notes: 'Executive office catering & refreshment stock'
						},
						{
							userId: adminUser.id,
							category: 'supplies',
							vendor: 'Office National',
							amountCents: 295000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 10 * 86400000),
							notes: 'Printing cartridges, paper reams, and desk accessories'
						},
						{
							userId: adminUser.id,
							category: 'utilities',
							vendor: 'Vodacom Business',
							amountCents: 189900,
							currency: 'ZAR',
							date: new Date(now.getTime() - 12 * 86400000),
							notes: 'High-speed dedicated fibre internet connection'
						},
						{
							userId: adminUser.id,
							category: 'travel',
							vendor: 'Uber B.V.',
							amountCents: 85000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 14 * 86400000),
							notes: 'Executive client meeting airport transfer'
						},
						{
							userId: adminUser.id,
							category: 'maintenance',
							vendor: 'Tiger Wheel & Tyre',
							amountCents: 640000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 18 * 86400000),
							notes: 'Commercial delivery vehicle tyre replacement & wheel alignment'
						},
						{
							userId: adminUser.id,
							category: 'services',
							vendor: 'Discovery Health',
							amountCents: 1450000,
							currency: 'ZAR',
							date: new Date(now.getTime() - 22 * 86400000),
							notes: 'Group medical aid & executive healthcare scheme'
						}
					];

					for (const exp of testExpenses) {
						await db.insert(expenses).values({
							id: `exp-seed-${Math.random().toString(36).substring(2, 8)}`,
							...exp
						});
					}
				}
			} catch (expErr) {
				console.warn('Expenses seed notice:', expErr);
			}

			// 5. Seed Test Invoices & Invoice Items (with custom line items)
			try {
				const existingInvoices = await db
					.select()
					.from(invoices)
					.where(eq(invoices.userId, adminUser.id));
				if (existingInvoices.length === 0) {
					const holdingId = `comp-holding-${adminUser.id.substring(0, 5)}`;
					const subId = `comp-sub-${adminUser.id.substring(0, 5)}`;
					const clientId = `comp-client-${adminUser.id.substring(0, 5)}`;

					const inv1Id = `inv-seed-1-${adminUser.id.substring(0, 5)}`;
					await db.insert(invoices).values({
						id: inv1Id,
						userId: adminUser.id,
						invoiceNumber: 'INV-2026-101',
						fromCompanyId: holdingId,
						toCompanyId: subId,
						issueDate: new Date(now.getTime() - 10 * 86400000),
						dueDate: new Date(now.getTime() + 4 * 86400000),
						status: 'issued',
						subtotalCents: 1850000,
						vatCents: 277500,
						totalCents: 2127500,
						notes: 'Monthly management fee & inter-company SLA allocation. Standard 14-day terms.'
					});

					await db.insert(invoiceItems).values([
						{
							id: `item-seed-1-1`,
							invoiceId: inv1Id,
							expenseId: null,
							description: 'Monthly Inter-Company Management & Administrative SLA',
							category: 'services',
							amountCents: 1250000
						},
						{
							id: `item-seed-1-2`,
							invoiceId: inv1Id,
							expenseId: null,
							description: 'Shared Cloud Infrastructure & IT Security Retainer',
							category: 'services',
							amountCents: 600000
						}
					]);

					const inv2Id = `inv-seed-2-${adminUser.id.substring(0, 5)}`;
					await db.insert(invoices).values({
						id: inv2Id,
						userId: adminUser.id,
						invoiceNumber: 'INV-2026-102',
						fromCompanyId: holdingId,
						toCompanyId: clientId,
						issueDate: new Date(now.getTime() - 25 * 86400000),
						dueDate: new Date(now.getTime() - 11 * 86400000),
						status: 'paid',
						subtotalCents: 930000,
						vatCents: 139500,
						totalCents: 1069500,
						notes: 'Paid via direct electronic funds transfer.'
					});

					await db.insert(invoiceItems).values([
						{
							id: `item-seed-2-1`,
							invoiceId: inv2Id,
							expenseId: null,
							description: 'Cloud Infrastructure Pass-Through & Hosting Facilities',
							category: 'services',
							amountCents: 450000
						},
						{
							id: `item-seed-2-2`,
							invoiceId: inv2Id,
							expenseId: null,
							description: 'Executive Advisory & Strategic Consultation Services',
							category: 'services',
							amountCents: 480000
						}
					]);
				}
			} catch (invErr) {
				console.warn('Invoices seed notice:', invErr);
			}
		}

		return json({
			success: true,
			message:
				'Database seeded successfully with test expenses, assets, companies, and sample invoices with custom line items!',
			credentials: {
				email: 'admin@breach.co.za',
				password: 'password123'
			}
		});
	} catch (error: unknown) {
		console.error('Seed endpoint error:', error);
		const msg = error instanceof Error ? error.message : 'Failed to seed database.';
		return json({ success: false, error: msg }, { status: 500 });
	}
};

export const POST: RequestHandler = handleSeed;
export const GET: RequestHandler = handleSeed;
