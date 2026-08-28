import { defineConfig } from 'drizzle-kit';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'dummy-account';
const databaseId = process.env.CLOUDFLARE_DATABASE_ID || 'dummy-db';
const token = process.env.CLOUDFLARE_D1_TOKEN || 'dummy-token';

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId,
		databaseId,
		token
	},
	verbose: true,
	strict: true
});
