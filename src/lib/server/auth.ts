import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';

const parseBetterAuthUrl = (urlEnv: string | undefined) => {
	if (!urlEnv) return undefined;

	const urls = urlEnv
		.split(',')
		.map((u) => u.trim())
		.filter(Boolean);
	if (urls.length === 0) return undefined;

	const allowedHosts: string[] = [];
	const fallback = urls[0];

	for (const urlStr of urls) {
		let host = urlStr;
		if (host.includes('://')) {
			host = host.split('://')[1];
		}
		host = host.split('/')[0].split('?')[0];
		if (host) {
			allowedHosts.push(host);
		}
	}

	if (urls.length > 1 || allowedHosts.some((h) => h.includes('*'))) {
		return {
			allowedHosts,
			fallback,
			protocol: 'auto' as const
		};
	}

	return fallback;
};

const authConfig = {
	baseURL: (() => {
		const parsed = parseBetterAuthUrl(env.BETTER_AUTH_URL);
		if (!parsed) return 'http://localhost';
		if (typeof parsed === 'string') return parsed;
		return parsed.fallback;
	})(),
	secret:
		env.BETTER_AUTH_SECRET || 'a_very_long_dummy_secret_for_build_time_validation_placeholder',
	emailAndPassword: { enabled: true },
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'user',
				input: false
			},
			disabled: {
				type: 'boolean',
				required: false,
				defaultValue: false,
				input: false
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	],
	logger: {
		log(level, message, ...args) {
			if (level === 'error' && typeof message === 'string' && message.includes('User not found')) {
				console.warn(`[Better Auth]: User not found`, ...args);
				return;
			}
			if (level === 'error') {
				console.error(`[ERROR] [Better Auth]: ${message}`, ...args);
			} else if (level === 'warn') {
				console.warn(`[WARN] [Better Auth]: ${message}`, ...args);
			} else {
				console.info(`[${level.toUpperCase()}] [Better Auth]: ${message}`, ...args);
			}
		}
	}
} satisfies Omit<Parameters<typeof betterAuth>[0], 'database'>;

let cachedAuth: ReturnType<typeof betterAuth> | null = null;
let cachedD1: D1Database | null = null;

export const createAuth = (d1: D1Database) => {
	if (!d1) {
		return betterAuth({
			...authConfig,
			database: drizzleAdapter(getDb(d1), { provider: 'sqlite' })
		});
	}

	if (!cachedAuth || cachedD1 !== d1) {
		cachedD1 = d1;
		cachedAuth = betterAuth({
			...authConfig,
			database: drizzleAdapter(getDb(d1), { provider: 'sqlite' })
		});
	}
	return cachedAuth;
};

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation ONLY.
 * To access `auth` at runtime, use `event.locals.auth`.
 */
export const auth = createAuth(null!);
