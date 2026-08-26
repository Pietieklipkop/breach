<script lang="ts">
	import { Search, Filter, RotateCcw, ChevronDown, ChevronUp } from '@lucide/svelte';
	import type { ExpenseCategory } from '$lib/types';

	interface Props {
		searchQuery: string;
		selectedCategory: string;
		timeFilter: 'current_month' | 'all' | 'last_30';
		fromDate: string;
		toDate: string;
		minAmount: string;
		maxAmount: string;
		categories: ExpenseCategory[];
		onclear: () => void;
	}

	let {
		searchQuery = $bindable(''),
		selectedCategory = $bindable('all'),
		timeFilter = $bindable('last_30'),
		fromDate = $bindable(''),
		toDate = $bindable(''),
		minAmount = $bindable(''),
		maxAmount = $bindable(''),
		categories,
		onclear
	}: Props = $props();

	let isFilterExpanded = $state(false);

	let isFiltered = $derived(
		searchQuery.trim() !== '' ||
			selectedCategory !== 'all' ||
			fromDate !== '' ||
			toDate !== '' ||
			minAmount !== '' ||
			maxAmount !== '' ||
			timeFilter !== 'all'
	);
</script>

<div class="space-y-3">
	<!-- Primary Filter Bar -->
	<div
		class="sharp-corners flex flex-col items-stretch justify-between gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4 md:flex-row md:items-center"
	>
		<!-- Time Scope Toggle Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
			<button
				type="button"
				onclick={() => (timeFilter = 'last_30')}
				class="sharp-corners px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors {timeFilter ===
				'last_30'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				Last 30 Days
			</button>
			<button
				type="button"
				onclick={() => (timeFilter = 'current_month')}
				class="sharp-corners px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors {timeFilter ===
				'current_month'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				This Month
			</button>
			<button
				type="button"
				onclick={() => (timeFilter = 'all')}
				class="sharp-corners px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors {timeFilter ===
				'all'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				All Time
			</button>
		</div>

		<!-- Category & Search Bar -->
		<div class="flex flex-1 items-center gap-2 md:max-w-md">
			<select
				bind:value={selectedCategory}
				class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-xs font-semibold text-white capitalize focus:outline-hidden"
			>
				<option value="all">All Categories</option>
				{#each categories as cat (cat.id || cat.slug)}
					<option value={cat.slug}>{cat.name}</option>
				{/each}
			</select>

			<div class="relative flex-1">
				<Search
					size={14}
					class="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-subtle)]"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search vendor, description..."
					class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-1.5 pr-3 pl-8 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
				/>
			</div>

			<button
				type="button"
				onclick={() => (isFilterExpanded = !isFilterExpanded)}
				class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-2.5 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-white"
			>
				<Filter size={14} />
				{#if isFilterExpanded}
					<ChevronUp size={14} />
				{:else}
					<ChevronDown size={14} />
				{/if}
			</button>

			{#if isFiltered}
				<button
					type="button"
					onclick={onclear}
					class="sharp-corners flex items-center gap-1 bg-red-500/20 px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/30"
					title="Reset all filters"
				>
					<RotateCcw size={14} />
				</button>
			{/if}
		</div>
	</div>

	<!-- Expanded Filter Controls (Date Range & Price Range) -->
	{#if isFilterExpanded}
		<div
			class="sharp-corners grid grid-cols-1 gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-4 sm:grid-cols-2 lg:grid-cols-4"
		>
			<div>
				<label
					for="from-date"
					class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					From Date
				</label>
				<input
					id="from-date"
					type="date"
					bind:value={fromDate}
					class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1.5 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
				/>
			</div>

			<div>
				<label
					for="to-date"
					class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					To Date
				</label>
				<input
					id="to-date"
					type="date"
					bind:value={toDate}
					class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1.5 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
				/>
			</div>

			<div>
				<label
					for="min-amount"
					class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					Min Amount (R)
				</label>
				<input
					id="min-amount"
					type="number"
					step="0.01"
					placeholder="0.00"
					bind:value={minAmount}
					class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
				/>
			</div>

			<div>
				<label
					for="max-amount"
					class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
				>
					Max Amount (R)
				</label>
				<input
					id="max-amount"
					type="number"
					step="0.01"
					placeholder="5000.00"
					bind:value={maxAmount}
					class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
				/>
			</div>
		</div>
	{/if}
</div>
