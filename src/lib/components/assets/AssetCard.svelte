<script lang="ts">
	import { Car, Home as HomeIcon, ArrowUpRight } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';
	import type { Asset } from '$lib/types';

	interface Props {
		asset: Asset;
		maintenanceSpend?: number;
	}

	let { asset, maintenanceSpend = 0 }: Props = $props();

	let totalCostOfOwnership = $derived(asset.purchasePriceCents + maintenanceSpend);
</script>

<div
	class="sharp-corners flex flex-col justify-between space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 transition-colors hover:border-[var(--color-coral)]"
>
	<div class="space-y-4">
		<!-- Card Badge Header -->
		<div class="flex items-center justify-between">
			<span
				class="sharp-corners flex items-center gap-1.5 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-2.5 py-1 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
			>
				{#if asset.type === 'vehicle'}
					<Car size={14} />
					<span>Vehicle</span>
				{:else}
					<HomeIcon size={14} />
					<span>Home Property</span>
				{/if}
			</span>

			{#if asset.yearModel}
				<span
					class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-2 py-0.5 font-mono text-xs text-[var(--color-text-muted)]"
				>
					Model Year {asset.yearModel}
				</span>
			{/if}
		</div>

		<!-- Title & Specs -->
		<div>
			<h2 class="font-serif text-2xl font-bold text-white">{asset.name}</h2>
			<p class="mt-0.5 text-sm font-semibold text-[var(--color-text-muted)]">
				{asset.make ? `${asset.make} • ${asset.model || ''}` : asset.model || 'Registered Asset'}
			</p>

			{#if asset.type === 'vehicle' && asset.purchaseKm}
				<div
					class="sharp-corners mt-3 grid grid-cols-2 gap-2 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3 text-xs text-[var(--color-text-muted)]"
				>
					<div>
						<span
							class="block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
						>
							Bought Mileage
						</span>
						<span class="font-mono text-sm font-bold text-white">
							{asset.purchaseKm.toLocaleString()} km
						</span>
					</div>
					<div>
						<span
							class="block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
						>
							Current Mileage
						</span>
						<span class="font-mono text-sm font-bold text-[var(--color-coral)]">
							{(asset.currentKm || asset.purchaseKm).toLocaleString()} km
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Financial Metrics -->
		<div class="grid grid-cols-2 gap-4 border-t border-[var(--color-dark-border)] pt-4">
			<div>
				<span
					class="block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					Purchase Price
				</span>
				<p class="font-mono text-base font-bold text-white">
					{formatCurrency(asset.purchasePriceCents)}
				</p>
			</div>

			<div>
				<span
					class="block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					Maintenance Spend
				</span>
				<p class="font-mono text-base font-bold text-amber-400">
					{formatCurrency(maintenanceSpend)}
				</p>
			</div>
		</div>

		<!-- Total Lifetime Spend -->
		<div
			class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3"
		>
			<span class="text-xs font-bold text-[var(--color-text-muted)]"> Total Lifetime Cost </span>
			<span class="font-mono text-base font-bold text-[var(--color-coral)]">
				{formatCurrency(totalCostOfOwnership)}
			</span>
		</div>
	</div>

	<!-- Bottom Action Link -->
	<a
		href="/assets/{asset.id}"
		class="sharp-corners flex items-center justify-center gap-2 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2.5 text-xs font-bold text-white transition-colors hover:border-[var(--color-coral)] hover:bg-[var(--color-coral)] hover:text-white"
	>
		<span>View Maintenance & Service Invoices</span>
		<ArrowUpRight size={14} />
	</a>
</div>
