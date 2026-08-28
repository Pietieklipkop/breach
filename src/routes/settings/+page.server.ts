import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const currentUser = event.locals.user;
	if (!currentUser) {
		throw redirect(303, '/login');
	}

	throw redirect(303, '/profile?tab=settings');
};
