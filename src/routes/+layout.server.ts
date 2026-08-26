import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { households, householdMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
	const currentUser = event.locals.user ?? null;

	if (!currentUser) {
		return {
			user: null,
			userHouseholds: [],
			activeHousehold: null
		};
	}

	const platform = event.platform;
	const d1 = platform?.env?.DB;

	if (d1) {
		const db = getDb(d1);

		// Fetch user's households
		let memberRecords = await db
			.select({
				householdId: households.id,
				householdName: households.name,
				role: householdMembers.role,
				isMain: householdMembers.isMain
			})
			.from(householdMembers)
			.innerJoin(households, eq(householdMembers.householdId, households.id))
			.where(eq(householdMembers.userId, currentUser.id));

		// If user has no household record, auto-create default
		if (memberRecords.length === 0) {
			const [newH] = await db
				.insert(households)
				.values({
					name: `${currentUser.name}'s Household`,
					createdByUserId: currentUser.id
				})
				.returning();

			if (newH) {
				await db.insert(householdMembers).values({
					householdId: newH.id,
					userId: currentUser.id,
					role: 'owner',
					isMain: 1
				});

				memberRecords = [
					{
						householdId: newH.id,
						householdName: newH.name,
						role: 'owner',
						isMain: 1
					}
				];
			}
		}

		// Determine active household from verified tenant context or main preference
		const tenantHouseholdId = event.locals.tenant?.activeHouseholdId;
		let activeHousehold = memberRecords.find((h) => h.householdId === tenantHouseholdId);

		if (!activeHousehold) {
			activeHousehold = memberRecords.find((h) => h.isMain === 1) || memberRecords[0];
		}

		return {
			user: currentUser,
			userHouseholds: memberRecords,
			activeHousehold
		};
	}

	return {
		user: currentUser,
		userHouseholds: [],
		activeHousehold: null
	};
};
