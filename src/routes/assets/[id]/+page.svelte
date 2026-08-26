<script lang="ts">
	import {
		Car,
		Home as HomeIcon,
		ArrowLeft,
		Wrench,
		Plus,
		Receipt,
		ShieldCheck,
		Gauge,
		DollarSign,
		Upload,
		Sparkles,
		FileText
	} from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import ActivityFormModal from '$lib/components/assets/ActivityFormModal.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let currentAsset = $derived(data.asset);
	let activities = $derived(data.activities);

	// Modals & Forms
	let isAddActivityModalOpen = $state(false);
	let isInitialScan = $state(false);

	// Derived Financial Computations
	let totalMaintenanceSpend = $derived(activities.reduce((sum, act) => sum + act.costCents, 0));

	function openAddActivityModal(scan = false) {
		isInitialScan = scan;
		isAddActivityModalOpen = true;
	}

	function closeAddActivityModal() {
		isAddActivityModalOpen = false;
	}
</script>

<svelte:head>
	<title>{currentAsset.name} - Breach Asset Details</title>
</svelte:head>

<div class="space-y-8">
	<!-- Top Navigation & Title Header -->
	<div class="space-y-3 border-b border-[var(--color-dark-border)] pb-6">
		<a
			href="/assets"
			class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-white"
		>
			<ArrowLeft size={16} />
			<span>Back to All Household Assets</span>
		</a>

		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<div class="mb-1 flex items-center gap-2">
					<span
						class="sharp-corners flex items-center gap-1 bg-[var(--color-coral-light)] px-2.5 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
					>
						{#if currentAsset.type === 'vehicle'}
							<Car size={13} />
							<span>Vehicle Asset</span>
						{:else}
							<HomeIcon size={13} />
							<span>Home Property</span>
						{/if}
					</span>
					{#if currentAsset.yearModel}
						<span
							class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-muted)]"
						>
							Model Year {currentAsset.yearModel}
						</span>
					{/if}
				</div>
				<h1 class="font-serif text-3xl font-bold text-white md:text-5xl">{currentAsset.name}</h1>
				<p class="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
					{currentAsset.make
						? `${currentAsset.make} ${currentAsset.model || ''}`
						: currentAsset.model || 'Registered Asset'}
					{#if currentAsset.notes}
						<span class="ml-2 text-xs text-[var(--color-text-subtle)]">({currentAsset.notes})</span>
					{/if}
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<button
					onclick={() => openAddActivityModal(true)}
					class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
				>
					<Sparkles size={16} />
					<span>+ Scan Work Invoice / Activity</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Key Metrics Bar -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
		<!-- Total Spend on Buying Asset -->
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Total Spend on Buying Asset</span>
				<DollarSign size={14} class="text-[var(--color-coral)]" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(currentAsset.purchasePriceCents)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">
				Purchase date: {currentAsset.purchaseDate ? formatDate(currentAsset.purchaseDate) : 'N/A'}
			</p>
		</div>

		<!-- Maintenance Spend -->
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Total Maintenance Spend</span>
				<Wrench size={14} class="text-amber-400" />
			</div>
			<p class="font-mono text-xl font-bold text-amber-400">
				{formatCurrency(totalMaintenanceSpend)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">
				{activities.length} recorded services & invoices
			</p>
		</div>

		<!-- Total Lifetime Asset Cost -->
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Total Lifetime Asset Cost</span>
				<ShieldCheck size={14} class="text-sky-400" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(currentAsset.purchasePriceCents + totalMaintenanceSpend)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">Purchase price + Maintenance spend</p>
		</div>

		<!-- Mileage Tracker (Vehicles) -->
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Current Mileage</span>
				<Gauge size={14} class="text-emerald-400" />
			</div>
			{#if currentAsset.type === 'vehicle'}
				<p class="font-mono text-xl font-bold text-emerald-400">
					{(currentAsset.currentKm || currentAsset.purchaseKm || 0).toLocaleString()} km
				</p>
				<p class="text-[10px] text-[var(--color-text-subtle)]">
					Bought at: {(currentAsset.purchaseKm || 0).toLocaleString()} km
				</p>
			{:else}
				<p class="font-mono text-xl font-bold text-white">N/A</p>
				<p class="text-[10px] text-[var(--color-text-subtle)]">Property asset</p>
			{/if}
		</div>
	</div>

	<!-- Asset Lifetime Activity & Work Invoices Log -->
	<div
		class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
	>
		<div
			class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-4 sm:flex-row sm:items-center"
		>
			<div>
				<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
					<Wrench class="text-[var(--color-coral)]" size={20} />
					<span>Work Invoices & Activity History</span>
				</h2>
				<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
					Log repair jobs, new tyres, major services, or upgrades via automated invoice scan or
					manual entry.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={() => openAddActivityModal(true)}
					class="sharp-corners flex items-center gap-1.5 bg-[var(--color-coral)] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
				>
					<Sparkles size={14} />
					<span>Scan Invoice</span>
				</button>
				<button
					onclick={() => openAddActivityModal(false)}
					class="sharp-corners flex items-center gap-1.5 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-dark-border)]"
				>
					<Plus size={14} />
					<span>Manual Entry</span>
				</button>
			</div>
		</div>

		<!-- Quick Scan Dropzone Header Banner -->
		<div
			class="sharp-corners flex flex-col items-center justify-between gap-4 border border-dashed border-[var(--color-coral)]/60 bg-[var(--color-dark-card)] p-4 md:flex-row"
		>
			<div class="flex items-center gap-3">
				<div
					class="sharp-corners flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--color-coral-light)] text-[var(--color-coral)]"
				>
					<FileText size={20} />
				</div>
				<div>
					<h3 class="text-sm font-bold text-white">
						Got new tyres, serviced this asset, or had work done?
					</h3>
					<p class="text-xs text-[var(--color-text-muted)]">
						Upload the workshop or contractor invoice to auto-extract the activity, cost, vendor,
						date, and mileage.
					</p>
				</div>
			</div>
			<button
				onclick={() => openAddActivityModal(true)}
				class="sharp-corners flex shrink-0 items-center gap-1.5 bg-[var(--color-coral)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
			>
				<Upload size={14} />
				<span>Upload Work Invoice</span>
			</button>
		</div>

		<!-- Activities List -->
		<div class="space-y-4">
			{#each activities as act (act.id)}
				<div
					class="sharp-corners flex flex-col justify-between gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-4 transition-colors hover:border-[var(--color-coral)] md:flex-row md:items-center"
				>
					<div class="space-y-1.5">
						<div class="flex items-center gap-2">
							<span
								class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
							>
								{act.category}
							</span>
							<span class="font-mono text-xs text-[var(--color-text-muted)]"
								>{formatDate(act.date)}</span
							>
							{#if act.mileageKm}
								<span class="font-mono text-xs text-[var(--color-text-subtle)]"
									>• {act.mileageKm.toLocaleString()} km</span
								>
							{/if}
						</div>

						<h3 class="text-base font-semibold text-white">{act.title}</h3>
						{#if act.vendor}
							<p class="text-xs text-[var(--color-text-muted)]">
								Vendor / Workshop: <strong class="text-white">{act.vendor}</strong>
							</p>
						{/if}
						{#if act.notes}
							<p class="text-xs text-[var(--color-text-subtle)] italic">{act.notes}</p>
						{/if}
					</div>

					<div class="shrink-0 text-left md:text-right">
						<p class="font-mono text-lg font-bold text-[var(--color-coral)]">
							{formatCurrency(act.costCents)}
						</p>
						<span
							class="inline-flex items-center gap-1 text-[10px] tracking-wider text-[var(--color-text-subtle)] uppercase"
						>
							<Receipt size={12} />
							<span>Invoice Logged</span>
						</span>
					</div>
				</div>
			{:else}
				<div
					class="p-8 text-center bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] sharp-corners space-y-2"
				>
					<Wrench class="mx-auto text-[var(--color-text-subtle)]" size={32} />
					<p class="text-sm font-bold text-white">No maintenance activities recorded</p>
					<p class="text-xs text-[var(--color-text-muted)]">
						Click "Scan Invoice" to record services, tyre changes, or repairs for this asset.
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Add Activity / Scan Work Invoice Modal -->
	<ActivityFormModal
		isOpen={isAddActivityModalOpen}
		asset={currentAsset}
		initialScan={isInitialScan}
		onclose={closeAddActivityModal}
	/>
</div>
