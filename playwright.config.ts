import { defineConfig } from '@playwright/test';

export default defineConfig({
	workers: 1,
	globalSetup: './playwright.global-setup.ts',
	webServer: {
		command: 'npm run dev',
		port: 8787,
		reuseExistingServer: true,
		timeout: 120 * 1000
	},
	use: {
		baseURL: 'http://localhost:8787',
		channel: 'chrome',
		viewport: { width: 1280, height: 1080 }
	},
	testMatch: '**/*.e2e.{ts,js}'
});
