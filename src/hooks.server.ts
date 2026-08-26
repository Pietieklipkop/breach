import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getDb } from '$lib/server/db';
import { householdMembers } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

const PUBLIC_ROUTES = ['/login', '/register', '/logout', '/api/seed'];

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	if (!event.platform?.env?.DB)
		throw new Error('D1 binding "DB" not found - are you running with wrangler?');

	event.locals.auth = createAuth(event.platform.env.DB);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		const user = session.user as NonNullable<App.Locals['user']>;
		if (user.disabled) {
			try {
				await auth.api.signOut({ headers: event.request.headers });
			} catch (e) {
				console.error('Error signing out disabled user:', e);
			}
			event.locals.session = null;
			event.locals.user = null;
		} else {
			event.locals.session = session.session;
			event.locals.user = user;
		}
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	if (event.locals.user && event.platform?.env?.DB) {
		const db = getDb(event.platform.env.DB);
		const requestedHouseholdId = event.cookies.get('active_household_id') || null;
		const userId = event.locals.user.id;
		let validHouseholdId: string | null = null;
		let userRole: 'owner' | 'admin' | 'member' | 'individual' = 'individual';

		if (requestedHouseholdId) {
			const [membership] = await db
				.select()
				.from(householdMembers)
				.where(
					and(
						eq(householdMembers.householdId, requestedHouseholdId),
						eq(householdMembers.userId, userId)
					)
				)
				.limit(1);

			if (membership) {
				validHouseholdId = membership.householdId;
				userRole = membership.role as 'owner' | 'admin' | 'member';
			}
		}

		// Fallback to primary household if cookie is invalid or missing
		if (!validHouseholdId) {
			const [primary] = await db
				.select()
				.from(householdMembers)
				.where(eq(householdMembers.userId, userId))
				.orderBy(desc(householdMembers.isMain))
				.limit(1);

			if (primary) {
				validHouseholdId = primary.householdId;
				userRole = primary.role as 'owner' | 'admin' | 'member';
			}
		}

		event.locals.tenant = {
			userId,
			activeHouseholdId: validHouseholdId,
			role: userRole
		};
	} else {
		event.locals.tenant = null;
	}

	const pathname = event.url.pathname;
	const isPublicRoute = PUBLIC_ROUTES.some(
		(p) => pathname === p || pathname.startsWith('/api/auth')
	);

	// Enforce login for all protected application routes
	if (!event.locals.user && !isPublicRoute) {
		throw redirect(302, '/login');
	}

	// Redirect logged-in users away from login / register pages
	if (event.locals.user && (pathname === '/login' || pathname === '/register')) {
		throw redirect(302, '/');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
