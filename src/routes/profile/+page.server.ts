import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import {
	households,
	householdMembers,
	householdInvites,
	userProfiles
} from '$lib/server/db/schema';
import { user } from '$lib/server/db/auth.schema';
import { eq, and } from 'drizzle-orm';

export const load = async (event: RequestEvent) => {
	const currentUser = event.locals.user;
	if (!currentUser) {
		throw redirect(302, '/login');
	}

	const platform = event.platform;
	const d1 = platform?.env?.DB;

	if (d1) {
		const db = getDb(d1);

		// 1. Fetch user profile
		const profiles = await db
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.userId, currentUser.id));
		const userProfile = profiles[0] || null;

		// 2. Fetch user's households
		let memberRecords = await db
			.select({
				memberId: householdMembers.id,
				householdId: householdMembers.householdId,
				role: householdMembers.role,
				isMain: householdMembers.isMain,
				householdName: households.name,
				createdByUserId: households.createdByUserId
			})
			.from(householdMembers)
			.innerJoin(households, eq(householdMembers.householdId, households.id))
			.where(eq(householdMembers.userId, currentUser.id));

		// If user has no households yet, create default
		if (memberRecords.length === 0) {
			const [newHousehold] = await db
				.insert(households)
				.values({
					name: userProfile?.householdName || `${currentUser.name}'s Household`,
					createdByUserId: currentUser.id
				})
				.returning();

			if (newHousehold) {
				await db.insert(householdMembers).values({
					householdId: newHousehold.id,
					userId: currentUser.id,
					role: 'owner',
					isMain: 1
				});

				memberRecords = [
					{
						memberId: 'm-1',
						householdId: newHousehold.id,
						role: 'owner',
						isMain: 1,
						householdName: newHousehold.name,
						createdByUserId: currentUser.id
					}
				];
			}
		}

		const cookieActiveId = event.cookies.get('active_household_id');
		const currentActiveMember =
			memberRecords.find((m) => m.householdId === cookieActiveId) ||
			memberRecords.find((m) => m.isMain === 1) ||
			memberRecords[0];

		const activeHouseholdId = currentActiveMember ? currentActiveMember.householdId : '';

		// 3. Fetch all members for active household
		let activeHouseholdMembers: Array<{
			id: string;
			name: string;
			email: string;
			role: string;
			isMain: boolean;
			joinedAt: Date | null;
		}> = [];

		if (activeHouseholdId) {
			const members = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: householdMembers.role,
					isMain: householdMembers.isMain,
					joinedAt: householdMembers.joinedAt
				})
				.from(householdMembers)
				.innerJoin(user, eq(householdMembers.userId, user.id))
				.where(eq(householdMembers.householdId, activeHouseholdId));

			activeHouseholdMembers = members.map((m) => ({
				...m,
				isMain: m.isMain === 1
			}));
		}

		// 4. Fetch pending invites for active household
		let pendingInvites: Array<{
			id: string;
			email: string;
			name: string;
			role: string;
			token: string;
			createdAt: Date;
		}> = [];

		if (activeHouseholdId) {
			const invites = await db
				.select({
					id: householdInvites.id,
					email: householdInvites.email,
					name: householdInvites.name,
					role: householdInvites.role,
					token: householdInvites.token,
					createdAt: householdInvites.createdAt
				})
				.from(householdInvites)
				.where(eq(householdInvites.householdId, activeHouseholdId));

			pendingInvites = invites;
		}

		return {
			profile: userProfile,
			householdsList: memberRecords,
			activeHouseholdId,
			activeHouseholdMembers,
			pendingInvites
		};
	}

	return {
		profile: null,
		householdsList: [],
		activeHouseholdId: '',
		activeHouseholdMembers: [],
		pendingInvites: []
	};
};

export const actions = {
	switchActiveHousehold: async (event: RequestEvent) => {
		const currentUser = event.locals.user;
		if (!currentUser) throw redirect(302, '/login');

		const formData = await event.request.formData();
		const targetHouseholdId = formData.get('householdId')?.toString() || '';
		const platform = event.platform;
		const d1 = platform?.env?.DB;

		if (targetHouseholdId && d1) {
			const db = getDb(d1);
			const membership = await db
				.select()
				.from(householdMembers)
				.where(
					and(
						eq(householdMembers.householdId, targetHouseholdId),
						eq(householdMembers.userId, currentUser.id)
					)
				)
				.get();

			if (!membership) {
				return fail(403, { message: 'You do not have access to this household.' });
			}

			event.cookies.set('active_household_id', targetHouseholdId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365
			});
		}

		return {
			success: true,
			message: 'Switched active household view successfully!'
		};
	},

	createInvite: async (event: RequestEvent) => {
		const currentUser = event.locals.user;
		if (!currentUser) throw redirect(302, '/login');

		const platform = event.platform;
		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { message: 'Database binding unavailable.' });

		const formData = await event.request.formData();
		const householdId = formData.get('householdId')?.toString() || '';
		const memberName = formData.get('memberName')?.toString().trim() || '';
		const memberEmail = formData.get('memberEmail')?.toString().trim().toLowerCase() || '';
		const memberRole = (formData.get('memberRole')?.toString() as 'admin' | 'member') || 'member';

		if (!memberName || !memberEmail || !householdId) {
			return fail(400, { message: 'Please provide member name, email, and household.' });
		}

		const db = getDb(d1);

		// Verify currentUser is member/owner of household
		const isMember = await db
			.select()
			.from(householdMembers)
			.where(
				and(
					eq(householdMembers.householdId, householdId),
					eq(householdMembers.userId, currentUser.id)
				)
			);

		if (isMember.length === 0) {
			return fail(403, { message: 'You are not authorized to invite members to this household.' });
		}

		const inviteToken = `inv_${crypto.randomUUID().replace(/-/g, '')}`;
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		await db.insert(householdInvites).values({
			householdId,
			invitedByUserId: currentUser.id,
			name: memberName,
			email: memberEmail,
			role: memberRole,
			token: inviteToken,
			expiresAt
		});

		const inviteUrl = `${event.url.origin}/register?invite=${inviteToken}`;

		return {
			success: true,
			message: 'Invitation link generated successfully!',
			inviteToken,
			inviteUrl
		};
	},

	setMainHousehold: async (event: RequestEvent) => {
		const currentUser = event.locals.user;
		if (!currentUser) throw redirect(302, '/login');

		const platform = event.platform;
		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { message: 'Database binding unavailable.' });

		const formData = await event.request.formData();
		const targetHouseholdId = formData.get('householdId')?.toString() || '';

		if (!targetHouseholdId) {
			return fail(400, { message: 'Household ID is required.' });
		}

		const db = getDb(d1);

		// Set all member records for currentUser to isMain = 0
		await db
			.update(householdMembers)
			.set({ isMain: 0 })
			.where(eq(householdMembers.userId, currentUser.id));

		// Set target household as isMain = 1
		await db
			.update(householdMembers)
			.set({ isMain: 1 })
			.where(
				and(
					eq(householdMembers.userId, currentUser.id),
					eq(householdMembers.householdId, targetHouseholdId)
				)
			);

		// Also update active household cookie to the main household
		event.cookies.set('active_household_id', targetHouseholdId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});

		return {
			success: true,
			message: 'Main notification household updated successfully!'
		};
	},

	createHousehold: async (event: RequestEvent) => {
		const currentUser = event.locals.user;
		if (!currentUser) throw redirect(302, '/login');

		const platform = event.platform;
		const d1 = platform?.env?.DB;
		if (!d1) return fail(500, { message: 'Database binding unavailable.' });

		const formData = await event.request.formData();
		const newHouseholdName = formData.get('householdName')?.toString().trim() || '';

		if (!newHouseholdName) {
			return fail(400, { message: 'Please enter a household name.' });
		}

		const db = getDb(d1);

		const [created] = await db
			.insert(households)
			.values({
				name: newHouseholdName,
				createdByUserId: currentUser.id
			})
			.returning();

		if (created) {
			await db.insert(householdMembers).values({
				householdId: created.id,
				userId: currentUser.id,
				role: 'owner',
				isMain: 0
			});

			// Switch active view to newly created household
			event.cookies.set('active_household_id', created.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365
			});
		}

		return {
			success: true,
			message: `Created and switched to new household "${newHouseholdName}"!`
		};
	}
};
