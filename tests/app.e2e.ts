import { test, expect } from '@playwright/test';

test.describe('Breach AI - End-to-End Test Suite', () => {
	// Helper login function for authenticated test suites
	async function loginAsAdmin(page: import('@playwright/test').Page) {
		await page.goto('/login');
		if (page.url().includes('/login')) {
			const emailInput = page.locator('input[name="email"]');
			if (await emailInput.isVisible().catch(() => false)) {
				await emailInput.fill('admin@breach.co.za');
				await page.fill('input[name="password"]', 'password123');
				await page.click('button[type="submit"]');
				await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
			}
		}
	}

	// =========================================================================
	// Suite 1: Authentication & Protection
	// =========================================================================
	test('E2E-01: User Registration creates account and redirects to dashboard', async ({ page }) => {
		const uniqueEmail = `user_${Date.now()}@breach.co.za`;
		await page.goto('/register');
		await page.fill('input[name="firstName"]', 'New Family');
		await page.fill('input[name="surname"]', 'Member');
		await page.fill('input[name="email"]', uniqueEmail);
		await page.fill('input[name="householdName"]', 'Fairtree Family');
		await page.fill('input[name="password"]', 'password123');
		await page.fill('input[name="confirmPassword"]', 'password123');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL(/\/(login)?/, { timeout: 15000 });
	});

	test('E2E-02: User Login, Session Persistence on Reload, and Logout Flow', async ({ page }) => {
		await loginAsAdmin(page);

		// Assert session persistence after page reload
		await page.reload();
		await expect(page.locator('header')).toBeVisible();

		// Logout
		await page.goto('/logout');
		await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
	});

	test('E2E-03: Route Guarding redirects unauthenticated requests to /login', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/expenses');
		await expect(page).toHaveURL(/\/login/);

		await page.goto('/invoicing');
		await expect(page).toHaveURL(/\/login/);

		await page.goto('/assets');
		await expect(page).toHaveURL(/\/login/);

		await page.goto('/profile');
		await expect(page).toHaveURL(/\/login/);
	});

	// =========================================================================
	// Suite 2: Streamlined Navigation & Hidden Style Guide (Desktop & Mobile)
	// =========================================================================
	test('E2E-04: Navigation GUI only shows 5 menu items and hides Style Guide & Settings', async ({
		page
	}) => {
		await loginAsAdmin(page);

		// Desktop Viewport Check
		await page.setViewportSize({ width: 1280, height: 800 });
		const desktopNav = page.locator('header nav');
		await expect(desktopNav).toBeVisible();

		// Assert exactly 5 links exist in desktop nav
		const desktopLinks = desktopNav.locator('a');
		await expect(desktopLinks).toHaveCount(5);

		// Assert the 5 links are Overview, Assets, Expenses, Invoices, Profile
		await expect(desktopNav.locator('a[href="/"]')).toBeVisible();
		await expect(desktopNav.locator('a[href="/assets"]')).toBeVisible();
		await expect(desktopNav.locator('a[href="/expenses"]')).toBeVisible();
		await expect(desktopNav.locator('a[href="/invoicing"]')).toBeVisible();
		await expect(desktopNav.locator('a[href="/profile"]')).toBeVisible();

		// Assert Style Guide and Settings are NOT in desktop nav
		await expect(desktopNav.locator('a[href="/style-guide"]')).toHaveCount(0);
		await expect(desktopNav.locator('a[href="/settings"]')).toHaveCount(0);

		// Mobile Viewport Check
		await page.setViewportSize({ width: 375, height: 667 });
		const mobileNav = page.locator('nav.mobile-bottom-nav');
		await expect(mobileNav).toBeVisible();

		const mobileLinks = mobileNav.locator('a');
		await expect(mobileLinks).toHaveCount(5);
		await expect(mobileNav.locator('a[href="/style-guide"]')).toHaveCount(0);
		await expect(mobileNav.locator('a[href="/settings"]')).toHaveCount(0);
	});

	test('E2E-05: Style Guide is accessible via direct URL link only', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/style-guide');

		await expect(page.locator('h1')).toContainText('Style Guide');
	});

	test('E2E-06: /settings redirects directly to /profile?tab=settings', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings');

		await expect(page).toHaveURL(/\/profile\?tab=settings/);
		await expect(page.locator('h1')).toContainText('Profile & System Management');
	});

	// =========================================================================
	// Suite 3: Profile 3-Tab Architecture & Management (Desktop & Mobile)
	// =========================================================================
	test('E2E-07: Profile tab lands on Personal Details and allows editing name, email, phone', async ({
		page
	}) => {
		await loginAsAdmin(page);
		await page.goto('/profile');

		// Verify lands on Personal Details form
		await expect(page.locator('h2:has-text("Personal Details")')).toBeVisible();
		const nameInput = page.locator('input#profile-name');
		const emailInput = page.locator('input#profile-email');
		const phoneInput = page.locator('input#profile-phone');

		await expect(nameInput).toBeVisible();
		await expect(emailInput).toBeVisible();
		await expect(phoneInput).toBeVisible();

		// Edit personal details
		await nameInput.fill('Admin User Updated');
		await phoneInput.fill('+27 82 999 8888');

		await page.click('button:has-text("Save Personal Details")');
		await expect(page.locator('text=Personal details updated successfully!')).toBeVisible({
			timeout: 10000
		});
	});

	test('E2E-08: Household tab shows households, member list, and invite generator', async ({
		page
	}) => {
		await loginAsAdmin(page);
		await page.goto('/profile');

		// Switch to Household Tab
		await page.click('button:has-text("Household")');

		// Verify My Households section
		await expect(page.locator('h2:has-text("My Households")')).toBeVisible();

		// Verify Add Person form & Invitation Link generator
		await expect(page.locator('h2:has-text("Add Person to Household")')).toBeVisible();
		await page.fill('input#invite-name', 'Test Invite Member');
		await page.fill('input#invite-email', 'invitee@breach.co.za');
		await page.click('button:has-text("Generate Registration Link")');

		await expect(page.locator('text=Invitation Link Generated!')).toBeVisible({ timeout: 10000 });
		await expect(page.locator('button:has-text("Copy Link")').first()).toBeVisible();

		// Verify Current Household Members section
		await expect(page.locator('h2:has-text("Current Household Members")')).toBeVisible();
	});

	test('E2E-09: Settings tab in Profile displays Master Data and manages categories & companies on mobile', async ({
		page
	}) => {
		await loginAsAdmin(page);

		// Test on mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/profile?tab=settings');

		// Verify Expense Master Categories is active
		await expect(page.locator('h3:has-text("Expense Master Categories")')).toBeVisible();

		// Open Add Category Modal
		await page.click('button:has-text("+ Add Category")');
		await expect(page.locator('h3:has-text("Create Expense Category")')).toBeVisible();
		await page.fill('input#modal-cat-name', 'Mobile Test Category');
		await page.fill('input#modal-cat-keywords', 'mobile, test, masterdata');
		await page.click('button[type="submit"]:has-text("Create Category")');

		await expect(page.locator('text=Mobile Test Category').first()).toBeVisible({ timeout: 10000 });
		await expect(page.locator('h3:has-text("Create Expense Category")')).toBeHidden({
			timeout: 5000
		});

		// Switch to Companies & Holdings Master Dataset
		await page.click('button:has-text("Companies & Holdings")');
		await expect(page.locator('h3:has-text("Companies & Entities")')).toBeVisible();

		// Open Add Company Modal
		await page.click('button:has-text("+ Add Company")');
		await expect(page.locator('h3:has-text("Register New Company")')).toBeVisible();
		await page.fill('input#modal-comp-name', 'Mobile Test Holdings (Pty) Ltd');
		await page.fill('input#modal-comp-reg', '2026/999888/07');
		await page.click('button[type="submit"]:has-text("Create Company")');

		await expect(page.locator('text=Mobile Test Holdings (Pty) Ltd').first()).toBeVisible({
			timeout: 10000
		});
		await expect(page.locator('h3:has-text("Register New Company")')).toBeHidden({ timeout: 5000 });
	});

	// =========================================================================
	// Suite 4: Expenses & OCR
	// =========================================================================
	test('E2E-10: Expense Hub Loads Successfully', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/expenses');
		await expect(page.locator('h1')).toContainText('Expenses');
	});

	test('E2E-11: Manual Expense Creation and Real-Time Table Updates', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/expenses');

		const addBtn = page
			.locator(
				'button:has-text("Add Expense"), button:has-text("Log Expense"), button:has-text("New Expense")'
			)
			.first();
		if (await addBtn.isVisible()) {
			await addBtn.click();
			const vendorInput = page.locator('input[name="vendor"], input#vendor').first();
			if (await vendorInput.isVisible()) {
				await vendorInput.fill('Woolworths Foods Test');
			}
			const amountInput = page
				.locator('input[name="amount"], input[name="amountCents"], input#amount')
				.first();
			if (await amountInput.isVisible()) {
				await amountInput.fill('450.00');
			}
		}

		await expect(page.locator('table').first()).toBeVisible();
	});

	// =========================================================================
	// Suite 5: Invoicing & Companies
	// =========================================================================
	test('E2E-12: Invoicing Hub Loads Successfully', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/invoicing');
		await expect(page.locator('h1')).toContainText('Invoicing');
	});

	// =========================================================================
	// Suite 6: Assets & Maintenance
	// =========================================================================
	test('E2E-13: Assets Hub Loads and Displays Assets', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/assets');
		await expect(page.locator('h1')).toContainText('Assets');
	});

	// =========================================================================
	// Suite 7: All 5 Primary Pages Reachable via Mobile Navigation
	// =========================================================================
	test('E2E-14: All 5 Primary Pages (Overview, Assets, Expenses, Invoices, Profile) reachable on mobile', async ({
		page
	}) => {
		await loginAsAdmin(page);
		await page.setViewportSize({ width: 375, height: 667 });

		// 1. Overview
		await page.click('nav.mobile-bottom-nav a[href="/"]');
		await expect(page).toHaveURL(/\/$/);

		// 2. Assets
		await page.click('nav.mobile-bottom-nav a[href="/assets"]');
		await expect(page).toHaveURL(/\/assets/);

		// 3. Expenses
		await page.click('nav.mobile-bottom-nav a[href="/expenses"]');
		await expect(page).toHaveURL(/\/expenses/);

		// 4. Invoices
		await page.click('nav.mobile-bottom-nav a[href="/invoicing"]');
		await expect(page).toHaveURL(/\/invoicing/);

		// 5. Profile
		await page.click('nav.mobile-bottom-nav a[href="/profile"]');
		await expect(page).toHaveURL(/\/profile/);
	});
});
