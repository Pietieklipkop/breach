<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import {
		LayoutDashboard,
		Car,
		Receipt,
		User,
		Settings,
		FileText,
		LogOut,
		Palette
	} from '@lucide/svelte';

	interface LayoutProps {
		children: Snippet;
		data: {
			user?: {
				name?: string;
				email?: string;
			} | null;
		};
	}

	let { children, data }: LayoutProps = $props();
	let currentPath = $derived(page.url.pathname);

	const navItems = [
		{ label: 'Overview', href: '/', icon: LayoutDashboard },
		{ label: 'Assets', href: '/assets', icon: Car },
		{ label: 'Expenses', href: '/expenses', icon: Receipt },
		{ label: 'Invoices', href: '/invoicing', icon: FileText },
		{ label: 'Style Guide', href: '/style-guide', icon: Palette },
		{ label: 'Settings', href: '/settings', icon: Settings },
		{ label: 'Profile', href: '/profile', icon: User }
	];
</script>

{#if currentPath === '/login' || currentPath === '/register'}
	{@render children()}
{:else}
	<div
		class="flex min-h-screen flex-col bg-[#0b0c10] font-sans text-[#f8fafc] print:m-0 print:min-h-0 print:bg-white print:p-0 print:text-black"
	>
		<!-- Top Header Bar (Insighta AI Navigation) -->
		<header
			class="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[#262836] bg-[#14151b] px-4 py-3.5 md:px-8 print:hidden"
		>
			<!-- Left Brand Logo -->
			<div class="flex shrink-0 items-center gap-3">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-lg font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
				>
					B
				</div>
				<a
					href="/"
					class="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-white"
				>
					<span>Insighta</span>
					<span
						class="rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 font-sans text-[10px] font-bold tracking-wider text-purple-400 uppercase"
					>
						AI Overview
					</span>
				</a>
			</div>

			<!-- Center Pill Navigation Switcher (Desktop) -->
			<nav
				class="hidden items-center rounded-full border border-[#262836] bg-[#1c1d26] p-1 md:flex"
			>
				{#each navItems as item (item.href)}
					{@const isActive =
						currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))}
					<a
						href={item.href}
						class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all {isActive
							? 'bg-white font-bold text-slate-950 shadow-md'
							: 'text-slate-400 hover:bg-[#262836]/60 hover:text-white'}"
					>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<!-- Right Action Controls (User Profile Avatar & Sign Out) -->
			<div class="flex items-center gap-3">
				<!-- User Profile Avatar Pill -->
				<a
					href="/profile"
					class="flex cursor-pointer items-center gap-2 rounded-full border border-[#262836] bg-[#1c1d26] py-1 pr-3.5 pl-1.5 transition-all hover:border-purple-500/50"
				>
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-[10px] font-bold text-white"
					>
						{data.user?.name ? data.user.name.substring(0, 2).toUpperCase() : 'AI'}
					</div>
					<span class="hidden text-xs font-semibold text-slate-200 sm:inline"
						>{data.user?.name || 'Admin'}</span
					>
				</a>

				<a
					href="/logout"
					title="Sign Out"
					class="p-2 text-slate-400 transition-colors hover:text-red-400"
				>
					<LogOut size={16} />
				</a>
			</div>
		</header>

		<!-- Main Content Area -->
		<main
			class="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-24 md:p-8 md:pb-12 print:m-0 print:w-full print:max-w-none print:bg-white print:p-0"
		>
			{@render children()}
		</main>

		<!-- Mobile Bottom Navigation Bar (Pill Container) -->
		<nav
			class="fixed right-3 bottom-3 left-3 z-40 flex h-14 items-center justify-around rounded-full border border-[#262836] bg-[#14151b]/95 px-2 shadow-2xl backdrop-blur-md md:hidden print:hidden"
		>
			{#each navItems.slice(0, 5) as item (item.href)}
				{@const Icon = item.icon}
				{@const isActive =
					currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))}
				<a
					href={item.href}
					class="flex flex-col items-center justify-center rounded-full p-2 text-[10px] transition-colors {isActive
						? 'font-bold text-purple-400'
						: 'text-slate-400'}"
				>
					<Icon size={18} class={isActive ? 'text-purple-400' : 'text-slate-400'} />
					<span class="mt-0.5">{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>
{/if}
