import { fail, redirect, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { getDb } from '$lib/server/db';
import { householdInvites, householdMembers, households } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async (event: RequestEvent) => {
	if (event.locals.user) {
		throw redirect(302, '/');
	}

	const inviteToken =
		event.url.searchParams.get('invite') || event.url.searchParams.get('token') || '';
	let inviteData: { name: string; email: string; householdName: string; role: string } | null =
		null;

	const platform = event.platform;
	const d1 = platform?.env?.DB;

	if (inviteToken && d1) {
		const db = getDb(d1);

		const invites = await db
			.select({
				name: householdInvites.name,
				email: householdInvites.email,
				role: householdInvites.role,
				householdName: households.name
			})
			.from(householdInvites)
			.innerJoin(households, eq(householdInvites.householdId, households.id))
			.where(eq(householdInvites.token, inviteToken));

		if (invites.length > 0) {
			inviteData = invites[0];
		}
	}

	return {
		inviteToken,
		inviteData
	};
};

export const actions = {
	register: async (event: RequestEvent) => {
		const { auth } = event.locals;
		const platform = event.platform;
		const d1 = platform?.env?.DB;

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';
		const inviteToken = formData.get('inviteToken')?.toString() ?? '';

		if (!name || !email || !password) {
			return fail(400, { message: 'Please fill in all required fields.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		if (password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters long.' });
		}

		try {
			const res = await auth.api.signUpEmail({
				body: {
					name,
					email,
					password
				},
				headers: event.request.headers
			});

			// Process household invitation token if available
			if (inviteToken && d1 && res?.user?.id) {
				const db = getDb(d1);

				const inviteRecords = await db
					.select()
					.from(householdInvites)
					.where(eq(householdInvites.token, inviteToken));

				if (inviteRecords.length > 0) {
					const inv = inviteRecords[0];

					// Add user as member of the invited household
					await db.insert(householdMembers).values({
						householdId: inv.householdId,
						userId: res.user.id,
						role: inv.role as 'admin' | 'member',
						isMain: 1
					});

					// Delete consumed invite
					await db.delete(householdInvites).where(eq(householdInvites.token, inviteToken));
				}
			}

			throw redirect(302, '/');
		} catch (error: unknown) {
			if (isRedirect(error)) {
				throw error;
			}
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed.' });
			}
			return fail(500, { message: 'Unexpected error during account registration.' });
		}
	}
};
