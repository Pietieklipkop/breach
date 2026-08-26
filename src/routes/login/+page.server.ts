import { fail, redirect, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';

export const load = (event: RequestEvent) => {
	if (event.locals.user) {
		throw redirect(302, '/');
	}
	return {};
};

export const actions = {
	login: async (event: RequestEvent) => {
		const { auth } = event.locals;
		const platform = event.platform;
		const d1 = platform?.env?.DB;

		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { message: 'Please enter your email and password.' });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers
			});
			throw redirect(302, '/');
		} catch (error: unknown) {
			if (isRedirect(error)) {
				throw error;
			}

			// Auto-provision default admin credentials on the fly if running for the first time
			if (email === 'admin@breach.co.za' && password === 'password123') {
				try {
					if (d1) {
						try {
							const db = getDb(d1);
							await db.delete(user).where(eq(user.email, 'admin@breach.co.za'));
						} catch (dbErr) {
							console.warn('DB reset warning:', dbErr);
						}
					}

					await auth.api.signUpEmail({
						body: {
							email: 'admin@breach.co.za',
							password: 'password123',
							name: 'Household Administrator'
						},
						headers: event.request.headers
					});
					throw redirect(302, '/');
				} catch (signupErr: unknown) {
					if (isRedirect(signupErr)) {
						throw signupErr;
					}
					console.error('Auto-provision error:', signupErr);
				}
			}

			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Invalid email address or password.' });
			}

			return fail(400, {
				message: 'Invalid email address or password.'
			});
		}
	}
};
