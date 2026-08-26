<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		User,
		Home as HomeIcon,
		Check,
		UserPlus,
		Copy,
		Star,
		Bell,
		Plus,
		Link,
		CheckCircle2,
		Users
	} from '@lucide/svelte';

	interface Props {
		data: {
			householdsList: Array<{
				memberId: string;
				householdId: string;
				role: string;
				isMain: number;
				householdName: string;
				createdByUserId: string;
			}>;
			activeHouseholdId: string;
			activeHouseholdMembers: Array<{
				id: string;
				name: string;
				email: string;
				role: string;
				isMain: boolean;
				joinedAt: Date | null;
			}>;
			pendingInvites: Array<{
				id: string;
				email: string;
				name: string;
				role: string;
				token: string;
				createdAt: Date;
			}>;
		};
		form?: {
			success?: boolean;
			message?: string;
			inviteToken?: string;
			inviteUrl?: string;
		} | null;
	}

	let { data, form }: Props = $props();

	let name = $state('Household Administrator');
	let email = $state('admin@breach.co.za');

	// Member Invitation Form State
	let inviteName = $state('');
	let inviteEmail = $state('');
	let inviteRole = $state<'admin' | 'member'>('member');
	let inviteHouseholdId = $derived(
		data.activeHouseholdId || data.householdsList[0]?.householdId || ''
	);

	// Copy Feedback
	let copiedToken = $state<string | null>(null);

	// New Household Form State
	let newHouseholdNameInput = $state('');
	let showNewHouseholdModal = $state(false);

	function copyToClipboard(url: string, token: string) {
		navigator.clipboard.writeText(url);
		copiedToken = token;
		setTimeout(() => {
			copiedToken = null;
		}, 3000);
	}
</script>

<svelte:head>
	<title>User Profile & Households - Breach Platform</title>
</svelte:head>

<div class="max-w-4xl space-y-8">
	<!-- Header Title -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span
					class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
				>
					Household & Profile Settings
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold text-white md:text-4xl">
				User Profile & Household Management
			</h1>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Manage member invitations, swap between households, set main notification preference, and
				update user settings.
			</p>
		</div>

		<button
			onclick={() => (showNewHouseholdModal = true)}
			class="sharp-corners flex items-center gap-2 self-start bg-[var(--color-coral)] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] md:self-auto"
		>
			<Plus size={16} />
			<span>+ Create Household</span>
		</button>
	</div>

	{#if form?.message}
		<div
			class="sharp-corners flex items-center gap-2 border p-4 text-xs font-semibold ${form.success
				? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
				: 'border-red-500 bg-red-500/20 text-red-400'}"
		>
			<CheckCircle2 size={18} />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Section 1: Multi-Household Selector & Main Household Preference -->
	<div
		class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
	>
		<div class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3">
			<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
				<HomeIcon class="text-[var(--color-coral)]" size={20} />
				<span>My Households ({data.householdsList.length})</span>
			</h2>
			<span class="text-xs text-[var(--color-text-muted)]">
				Star ★ to select main household for notifications
			</span>
		</div>

		<div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
			{#each data.householdsList as h (h.householdId)}
				{@const isMain = h.isMain === 1}
				{@const isActiveView = data.activeHouseholdId === h.householdId}
				<div
					class="sharp-corners flex h-full flex-col justify-between gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-5 {isMain
						? 'border-l-4 border-l-[var(--color-coral)]'
						: ''}"
				>
					<div class="space-y-2">
						<div class="flex items-start justify-between gap-2">
							<div>
								<h3 class="text-base leading-snug font-bold text-white">{h.householdName}</h3>
								<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
									Role: <strong class="font-mono text-[11px] text-white uppercase">{h.role}</strong>
								</p>
							</div>

							<div class="flex shrink-0 flex-col items-end gap-1">
								{#if isMain}
									<span
										class="sharp-corners flex items-center gap-1 bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
									>
										<Star size={10} class="fill-current" />
										<span>Main Household</span>
									</span>
								{/if}
							</div>
						</div>
					</div>

					<div
						class="flex items-center justify-between gap-2 border-t border-[var(--color-dark-border)] pt-3"
					>
						<!-- Active Household View Switcher -->
						{#if !isActiveView}
							<form method="POST" action="?/switchActiveHousehold" use:enhance class="flex-1">
								<input type="hidden" name="householdId" value={h.householdId} />
								<button
									type="submit"
									class="sharp-corners flex w-full items-center justify-center gap-1.5 bg-[var(--color-coral)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
								>
									<span>Switch to Active View</span>
								</button>
							</form>
						{:else}
							<div
								class="sharp-corners flex items-center gap-1.5 border border-emerald-500 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400"
							>
								<CheckCircle2 size={14} />
								<span>Currently Viewing</span>
							</div>
						{/if}

						<!-- Main Household Notification Toggle -->
						{#if !isMain}
							<form method="POST" action="?/setMainHousehold" use:enhance>
								<input type="hidden" name="householdId" value={h.householdId} />
								<button
									type="submit"
									title="Set as Main Household for notifications"
									class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-coral)] hover:bg-[var(--color-dark-border)] hover:text-white"
								>
									<Bell size={13} class="text-[var(--color-coral)]" />
									<span>Set Main</span>
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Section 2: Add / Invite Member Form & Link Generator -->
	<div
		class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
	>
		<div class="border-b border-[var(--color-dark-border)] pb-3">
			<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
				<UserPlus class="text-[var(--color-coral)]" size={20} />
				<span>Add Member to Household</span>
			</h2>
			<p class="mt-1 text-xs text-[var(--color-text-muted)]">
				Enter the person's details to generate a registration link they can use to join your
				household.
			</p>
		</div>

		{#if form?.inviteUrl}
			<div
				class="sharp-corners space-y-3 border border-[var(--color-coral)] bg-[var(--color-dark-card)] p-4"
			>
				<div class="flex items-center justify-between text-xs font-bold text-[var(--color-coral)]">
					<span class="flex items-center gap-1.5">
						<Link size={16} />
						<span>Invitation Link Generated! Share this link with the new member:</span>
					</span>
					{#if copiedToken === form.inviteToken}
						<span class="flex items-center gap-1 font-mono text-emerald-400">
							<Check size={14} /> Link Copied!
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<input
						type="text"
						readonly
						value={form.inviteUrl}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-black/40 px-3 py-2 font-mono text-xs text-white select-all"
					/>
					<button
						type="button"
						onclick={() => copyToClipboard(form?.inviteUrl || '', form?.inviteToken || '')}
						class="sharp-corners flex shrink-0 items-center gap-1.5 bg-[var(--color-coral)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
					>
						<Copy size={14} />
						<span>Copy Link</span>
					</button>
				</div>
			</div>
		{/if}

		<form method="POST" action="?/createInvite" use:enhance class="space-y-4">
			<input type="hidden" name="householdId" value={inviteHouseholdId} />

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label
						for="invite-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Member Name
					</label>
					<input
						id="invite-name"
						name="memberName"
						type="text"
						required
						bind:value={inviteName}
						placeholder="e.g. Sarah Jenkins"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="invite-email"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Member Email
					</label>
					<input
						id="invite-email"
						name="memberEmail"
						type="email"
						required
						bind:value={inviteEmail}
						placeholder="sarah@breach.co.za"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="invite-role"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Household Role
					</label>
					<select
						id="invite-role"
						name="memberRole"
						bind:value={inviteRole}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white focus:outline-hidden"
					>
						<option value="member">Member (Read & Create Assets)</option>
						<option value="admin">Admin (Full Household Control)</option>
					</select>
				</div>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
				>
					<UserPlus size={16} />
					<span>Generate Registration Link</span>
				</button>
			</div>
		</form>
	</div>

	<!-- Section 3: Current Household Members & Pending Invites List -->
	<div
		class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
	>
		<div class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3">
			<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
				<Users class="text-[var(--color-coral)]" size={20} />
				<span>Current Household Members</span>
			</h2>
			<span class="text-xs text-[var(--color-text-muted)]">
				{data.activeHouseholdMembers.length} Active Members
			</span>
		</div>

		<div class="space-y-2">
			{#each data.activeHouseholdMembers as member (member.id)}
				<div
					class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3.5"
				>
					<div class="flex items-center gap-3">
						<div
							class="sharp-corners flex h-8 w-8 items-center justify-center bg-[var(--color-coral-light)] text-xs font-bold text-[var(--color-coral)]"
						>
							{member.name.substring(0, 2).toUpperCase()}
						</div>
						<div>
							<p class="flex items-center gap-2 text-sm font-bold text-white">
								<span>{member.name}</span>
								{#if member.isMain}
									<span
										class="sharp-corners bg-[var(--color-coral-light)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-coral)] uppercase"
									>
										Main Household
									</span>
								{/if}
							</p>
							<p class="text-xs text-[var(--color-text-muted)]">{member.email}</p>
						</div>
					</div>
					<span
						class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						{member.role}
					</span>
				</div>
			{/each}
		</div>

		{#if data.pendingInvites.length > 0}
			<div class="space-y-3 border-t border-[var(--color-dark-border)] pt-4">
				<h3 class="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
					Pending Invitations ({data.pendingInvites.length})
				</h3>
				<div class="space-y-2">
					{#each data.pendingInvites as inv (inv.id)}
						{@const invUrl =
							typeof window !== 'undefined'
								? `${window.location.origin}/register?invite=${inv.token}`
								: `/register?invite=${inv.token}`}
						<div
							class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3 text-xs"
						>
							<div>
								<p class="font-bold text-white">{inv.name} ({inv.email})</p>
								<p class="font-mono text-[10px] text-[var(--color-text-subtle)]">
									Token: {inv.token}
								</p>
							</div>
							<button
								type="button"
								onclick={() => copyToClipboard(invUrl, inv.token)}
								class="sharp-corners flex items-center gap-1 bg-[var(--color-dark-border)] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--color-coral)]"
							>
								<Copy size={12} />
								<span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Section 4: Personal Details Form -->
	<form class="space-y-6">
		<div
			class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
		>
			<h2
				class="flex items-center gap-2 border-b border-[var(--color-dark-border)] pb-3 font-serif text-xl font-bold text-white"
			>
				<User class="text-[var(--color-coral)]" size={20} />
				<span>Personal Details</span>
			</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label
						for="profile-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Full Name
					</label>
					<input
						id="profile-name"
						type="text"
						required
						bind:value={name}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="profile-email"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Email Address
					</label>
					<input
						id="profile-email"
						type="email"
						required
						bind:value={email}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>
			</div>
		</div>
	</form>
</div>

<!-- Modal: Create New Household -->
{#if showNewHouseholdModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners w-full max-w-md space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<h2 class="font-serif text-xl font-bold text-white">Create New Household</h2>
				<button
					onclick={() => (showNewHouseholdModal = false)}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					✕
				</button>
			</div>

			<form
				method="POST"
				action="?/createHousehold"
				use:enhance={() => {
					return async ({ update }) => {
						showNewHouseholdModal = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="new-household-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Household Name
					</label>
					<input
						id="new-household-name"
						name="householdName"
						type="text"
						required
						bind:value={newHouseholdNameInput}
						placeholder="e.g. Beach Cottage Villa"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div
					class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-3"
				>
					<button
						type="button"
						onclick={() => (showNewHouseholdModal = false)}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
					>
						Create Household
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
