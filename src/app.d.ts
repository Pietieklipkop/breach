import type { User, Session } from 'better-auth/minimal';
import { createAuth } from '$lib/server/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Env {
		TURNSTILE_SITE_KEY?: string;
		TURNSTILE_SECRET_KEY?: string;
	}

	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			user: (User & { role?: string; disabled?: boolean }) | null;
			session: Session | null;
			auth: ReturnType<typeof createAuth>;
			tenant: {
				userId: string;
				activeHouseholdId: string | null;
				role: 'owner' | 'admin' | 'member' | 'individual';
			} | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
