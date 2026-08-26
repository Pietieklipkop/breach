/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `breach-cache-${version}`;

const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(
					keys.map((key) => {
						if (key !== CACHE_NAME) {
							return caches.delete(key);
						}
					})
				);
			})
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Don't cache API worker endpoints or cross-origin requests
	if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse): Promise<Response> => {
			if (cachedResponse) {
				// Fetch background update for cache (stale-while-revalidate)
				fetch(event.request)
					.then((networkResponse) => {
						if (networkResponse && networkResponse.status === 200) {
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(event.request, networkResponse);
							});
						}
					})
					.catch(() => {
						/* Offline */
					});

				return Promise.resolve(cachedResponse);
			}

			return fetch(event.request)
				.then((networkResponse) => {
					if (networkResponse && networkResponse.status === 200) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return networkResponse;
				})
				.catch(() => {
					if (event.request.headers.get('accept')?.includes('text/html')) {
						return caches.match('/').then((rootRes) => {
							return rootRes || new Response('Offline', { status: 503, statusText: 'Offline' });
						});
					}
					return Promise.resolve(
						new Response('Network error', { status: 408, statusText: 'Network Timeout' })
					);
				});
		})
	);
});
