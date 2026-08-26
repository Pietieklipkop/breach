import { redirect, error, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { householdMembers } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const formData = await event.request.formData();
	const targetHouseholdId = formData.get('householdId')?.toString();
	const d1 = event.platform?.env?.DB;

	if (targetHouseholdId && d1) {
		const db = getDb(d1);
		// Verify user is actually a member of this household
		const membership = await db
			.select()
			.from(householdMembers)
			.where(
				and(
					eq(householdMembers.householdId, targetHouseholdId),
					eq(householdMembers.userId, user.id)
				)
			)
			.get();

		if (!membership) {
			throw error(403, 'You do not have access to this household');
		}

		event.cookies.set('active_household_id', targetHouseholdId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	throw redirect(303, event.request.headers.get('referer') || '/');
};
