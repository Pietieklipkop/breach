<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		UserPlus,
		Mail,
		Lock,
		User,
		AlertCircle,
		ArrowRight,
		Key,
		Home as HomeIcon
	} from '@lucide/svelte';

	interface Props {
		data: {
			inviteToken?: string;
			inviteData?: {
				name: string;
				email: string;
				householdName: string;
				role: string;
			} | null;
		};
		form?: {
			message?: string;
		} | null;
	}

	let { data, form }: Props = $props();

	let firstName = $state('');
	let surname = $state('');
	let email = $state('');
	let householdName = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);

	$effect(() => {
		if (data.inviteData) {
			if (data.inviteData.name) {
				const parts = data.inviteData.name.trim().split(' ');
				firstName = parts[0] || '';
				surname = parts.slice(1).join(' ') || '';
			}
			if (data.inviteData.email) email = data.inviteData.email;
			if (data.inviteData.householdName) householdName = data.inviteData.householdName;
		}
	});
</script>

<svelte:head>
	<title>Register Account - Breach Household Intelligence</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-[var(--color-dark-bg)] p-4 text-[var(--color-text-main)]"
>
	<div class="w-full max-w-lg space-y-8">
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

		<!-- Register Container Card -->
		<div
			class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-8 shadow-2xl"
		>
			<div class="border-b border-[var(--color-dark-border)] pb-4">
				<h2 class="flex items-center gap-2 font-serif text-2xl font-bold text-white">
					<UserPlus class="text-[var(--color-coral)]" size={20} />
					<span>Create an Account</span>
				</h2>
				<p class="mt-1 text-xs text-[var(--color-text-muted)]">
					Register your details and household name to access your asset dashboard.
				</p>
			</div>

			{#if data.inviteData}
				<div
					class="sharp-corners space-y-1 border border-[var(--color-coral)] bg-[var(--color-coral-light)] p-3.5 text-xs text-white"
				>
					<p class="flex items-center gap-1 font-bold text-[var(--color-coral)]">
						<HomeIcon size={14} />
						<span>Household Invitation</span>
					</p>
					<p class="text-[var(--color-text-main)]">
						You've been invited to join <strong>{data.inviteData.householdName}</strong> as a {data
							.inviteData.role}.
					</p>
				</div>
			{/if}

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
				action="?/register"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						isLoading = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				{#if data.inviteToken}
					<input type="hidden" name="inviteToken" value={data.inviteToken} />
				{/if}

				<!-- Name & Surname Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label
							for="firstName"
							class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Name *
						</label>
						<div class="relative">
							<User
								size={16}
								class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
							/>
							<input
								id="firstName"
								name="firstName"
								type="text"
								required
								bind:value={firstName}
								placeholder="First Name"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div>
						<label
							for="surname"
							class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Surname *
						</label>
						<div class="relative">
							<User
								size={16}
								class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
							/>
							<input
								id="surname"
								name="surname"
								type="text"
								required
								bind:value={surname}
								placeholder="Surname"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				<!-- Email Address -->
				<div>
					<label
						for="email"
						class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Email Address *
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
							placeholder="user@example.com"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<!-- Household Name -->
				<div>
					<label
						for="householdName"
						class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Household Name *
					</label>
					<div class="relative">
						<HomeIcon
							size={16}
							class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
						/>
						<input
							id="householdName"
							name="householdName"
							type="text"
							required={!data.inviteToken}
							bind:value={householdName}
							placeholder="e.g. The Smith Residence"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<!-- Password Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label
							for="password"
							class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Password *
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
								placeholder="Enter password"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div>
						<label
							for="confirmPassword"
							class="mb-1.5 block text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Confirm Password *
						</label>
						<div class="relative">
							<Lock
								size={16}
								class="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-subtle)]"
							/>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								bind:value={confirmPassword}
								placeholder="Re-enter password"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 pr-4 pl-10 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="sharp-corners mt-2 flex w-full items-center justify-center gap-2 bg-[var(--color-coral)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
				>
					{#if isLoading}
						<span>Creating Account...</span>
					{:else}
						<span>Complete Registration</span>
						<ArrowRight size={16} />
					{/if}
				</button>
			</form>

			<!-- Login Link Footer -->
			<div class="border-t border-[var(--color-dark-border)] pt-4 text-center text-xs">
				<span class="text-[var(--color-text-muted)]">Already registered?</span>
				<a
					href="/login"
					class="ml-1 inline-flex items-center gap-1 font-bold text-coral hover:underline"
				>
					<Key size={13} />
					<span>Sign In to Existing Account</span>
				</a>
			</div>
		</div>
	</div>
</div>
