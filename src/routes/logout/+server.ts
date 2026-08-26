import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const handleLogout = async (event: RequestEvent) => {
	if (event.locals.auth) {
		try {
			await event.locals.auth.api.signOut({ headers: event.request.headers });
		} catch (e) {
			console.error('Logout error:', e);
		}
	}
	throw redirect(302, '/login');
};

export const POST: RequestHandler = handleLogout;
export const GET: RequestHandler = handleLogout;
