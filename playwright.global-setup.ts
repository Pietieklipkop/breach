import { request } from '@playwright/test';

async function globalSetup() {
	const requestContext = await request.newContext();
	try {
		console.log('Seeding D1 database for E2E tests...');
		let seeded = false;
		for (let i = 0; i < 15; i++) {
			try {
				const response = await requestContext.post('http://localhost:8787/api/seed');
				if (response.ok()) {
					console.log('Database seeded successfully:', await response.json());
					seeded = true;
					break;
				} else {
					console.warn(
						`Failed to seed, status: ${response.status()}, body: ${await response.text()}`
					);
				}
			} catch {
				// Dev server might still be booting up, wait and retry
				await new Promise((r) => setTimeout(r, 1000));
			}
		}
		if (!seeded) {
			console.warn('E2E database seeding skipped or non-existent for fresh setup.');
		}
	} finally {
		await requestContext.dispose();
	}
}

export default globalSetup;
