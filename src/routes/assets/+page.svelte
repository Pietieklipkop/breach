<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { Car, Plus, Search } from '@lucide/svelte';
	import AssetCard from '$lib/components/assets/AssetCard.svelte';
	import AssetFormModal from '$lib/components/assets/AssetFormModal.svelte';

	let { data }: { data: PageData } = $props();

	// Assets State from loader
	let assetsList = $derived(data.assets || []);

	// Filters & State
	let selectedTab = $state<'all' | 'vehicle' | 'home'>('all');
	let searchQuery = $state('');
	let isAddModalOpen = $state(false);

	// Check URL query parameters for action
	$effect(() => {
		const action = page.url.searchParams.get('action');
		if (action === 'add') {
			openAddModal();
		}
	});

	// Filtered Assets
	let filteredAssets = $derived(
		assetsList.filter((a) => {
			const matchesTab = selectedTab === 'all' || a.type === selectedTab;
			const matchesSearch =
				searchQuery === '' ||
				a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(a.make && a.make.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(a.model && a.model.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesTab && matchesSearch;
		})
	);

	function openAddModal() {
		isAddModalOpen = true;
	}

	function closeAddModal() {
		isAddModalOpen = false;
	}
</script>

<svelte:head>
	<title>Household Assets - Breach</title>
</svelte:head>

<div class="space-y-8">
	<!-- Top Title & Action Bar -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span
					class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
				>
					Asset Management
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold text-white md:text-4xl">Household Assets</h1>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Manage vehicles and home properties, upload purchase invoices, and track lifetime costs.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={openAddModal}
				class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
			>
				<Plus size={16} />
				<span>Add Asset</span>
			</button>
		</div>
	</div>

	<!-- Filter & Search Controls -->
	<div
		class="sharp-corners flex flex-col items-stretch justify-between gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4 md:flex-row md:items-center"
	>
		<!-- Category Filter Tabs -->
		<div class="flex items-center gap-2">
			<button
				onclick={() => (selectedTab = 'all')}
				class="sharp-corners px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors {selectedTab ===
				'all'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				All Assets ({assetsList.length})
			</button>
			<button
				onclick={() => (selectedTab = 'vehicle')}
				class="sharp-corners px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors {selectedTab ===
				'vehicle'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				Vehicles ({assetsList.filter((a) => a.type === 'vehicle').length})
			</button>
			<button
				onclick={() => (selectedTab = 'home')}
				class="sharp-corners px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors {selectedTab ===
				'home'
					? 'bg-[var(--color-coral)] text-white'
					: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
			>
				Homes ({assetsList.filter((a) => a.type === 'home').length})
			</button>
		</div>

		<!-- Search Input -->
		<div class="relative w-full md:w-72">
			<Search
				size={16}
				class="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-subtle)]"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search make, model, name..."
				class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] py-2 pr-4 pl-9 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
			/>
		</div>
	</div>

	<!-- Assets Cards Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#each filteredAssets as asset (asset.id)}
			<AssetCard {asset} />
		{:else}
			<div
				class="sharp-corners col-span-full border border-dashed border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-12 text-center"
			>
				<Car class="mx-auto text-[var(--color-text-subtle)]" size={48} />
				<h3 class="mt-4 font-serif text-lg font-bold text-white">No Assets Found</h3>
				<p class="mt-1 text-xs text-[var(--color-text-muted)]">
					{#if searchQuery}
						No assets match your search query "{searchQuery}".
					{:else}
						Start tracking your household vehicles or properties to log maintenance and lifetime
						costs.
					{/if}
				</p>
				<button
					onclick={openAddModal}
					class="sharp-corners mt-6 inline-flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
				>
					<Plus size={14} />
					<span>Register First Asset</span>
				</button>
			</div>
		{/each}
	</div>

	<!-- Add Asset Modal Component -->
	<AssetFormModal isOpen={isAddModalOpen} onclose={closeAddModal} />
</div>
