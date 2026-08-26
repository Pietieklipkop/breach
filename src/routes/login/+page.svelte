<script lang="ts">
	import { enhance } from '$app/forms';
	import { Shield, Key, Mail, Lock, AlertCircle, ArrowRight, UserPlus } from '@lucide/svelte';

	let { form } = $props();

	let email = $state('admin@breach.co.za');
	let password = $state('password123');
	let isLoading = $state(false);
</script>

<svelte:head>
	<title>Sign In - Breach Household Intelligence</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-[var(--color-dark-bg)] p-4 text-[var(--color-text-main)]"
>
	<div class="w-full max-w-md space-y-8">
		<!-- Brand Header -->
		<div class="space-y-2 text-center">
			<div
				class="sharp-corners mb-2 inline-flex h-14 w-14 items-center justify-center bg-[var(--color-coral)] font-serif text-3xl font-bold text-white shadow-lg"
			>
				B
			</div>
			<h1 class="font-serif text-3xl font-bold tracking-tight text-white">BREACH</h1>
			<p class="text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
				Household Asset & Intelligence Platform
			</p>
		</div>

		<!-- Login Container Card -->
		<div
			class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-8 shadow-2xl"
		>
			<div class="border-b border-[var(--color-dark-border)] pb-4">
				<h2 class="flex items-center gap-2 font-serif text-2xl font-bold text-white">
					<Key class="text-[var(--color-coral)]" size={20} />
					<span>Account Login</span>
				</h2>
				<p class="mt-1 text-xs text-[var(--color-text-muted)]">
					Enter your credentials to access your household assets and expenses.
				</p>
			</div>

			<!-- Testing Credentials Banner (Generic) -->
			<div
				class="sharp-corners space-y-1 border border-l-4 border-[var(--color-dark-border)] border-l-[var(--color-coral)] bg-[var(--color-dark-card)] p-3.5 text-xs"
			>
				<div class="flex items-center gap-1.5 font-bold text-white">
					<Shield size={14} class="text-[var(--color-coral)]" />
					<span>Default Test Login Credentials</span>
				</div>
				<p class="font-mono text-[11px] text-[var(--color-text-muted)]">
					Email: <strong class="text-white">admin@breach.co.za</strong><br />
					Password: <strong class="text-white">password123</strong>
				</p>
			</div>

			{#if form?.message}
				<div
					class="alert-error sharp-corners flex items-center gap-2 border border-red-500 bg-red-500/10 p-3.5 text-xs text-red-400"
				>
					<AlertCircle size={16} class="shrink-0" />
					<span>{form.message}</span>
				</div>
			{/if}

			<!-- Form -->
			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						isLoading = false;
						await update();
					};
				}}
				class="space-y-5"
			>
				<div>
					<label
						for="email"
						class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Email Address
					</label>
					<div class="relative">
						<Mail
							size={16}
							class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
						/>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							placeholder="admin@breach.co.za"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<div>
					<label
						for="password"
						class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Password
					</label>
					<div class="relative">
						<Lock
							size={16}
							class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
						/>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							placeholder="••••••••"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="sharp-corners flex w-full items-center justify-center gap-2 bg-[var(--color-coral)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
				>
					{#if isLoading}
						<span>Authenticating...</span>
					{:else}
						<span>Sign In to Dashboard</span>
						<ArrowRight size={16} />
					{/if}
				</button>
			</form>

			<!-- Register Link Footer -->
			<div class="border-t border-[var(--color-dark-border)] pt-4 text-center text-xs">
				<span class="text-[var(--color-text-muted)]">Don't have a household account yet?</span>
				<a
					href="/register"
					class="ml-1 inline-flex items-center gap-1 font-bold text-coral hover:underline"
				>
					<UserPlus size={13} />
					<span>Register New Account</span>
				</a>
			</div>
		</div>
	</div>
</div>
