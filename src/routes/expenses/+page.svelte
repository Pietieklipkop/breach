<script lang="ts">
	import { page } from '$app/state';
	import { SvelteMap } from 'svelte/reactivity';
	import { Sparkles, Receipt, CalendarDays, DollarSign } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';
	import type { Company, Expense, ExpenseCategory } from '$lib/types';
	import SpendingPieChart, {
		type SpendingCategoryItem
	} from '$lib/components/SpendingPieChart.svelte';
	import ExpenseFilterBar from '$lib/components/expenses/ExpenseFilterBar.svelte';
	import ExpenseTable from '$lib/components/expenses/ExpenseTable.svelte';
	import ExpenseFormModal from '$lib/components/expenses/ExpenseFormModal.svelte';

	interface PageData {
		expenses: Expense[];
		categories: ExpenseCategory[];
		companies?: Company[];
	}

	let { data }: { data: PageData } = $props();

	// All expenses, categories, and companies flow directly from SvelteKit load data
	let expensesList = $derived(data.expenses || []);
	let categoriesList = $derived(data.categories || []);
	let companiesList = $derived(data.companies || []);

	// Filter & View State
	let timeFilter = $state<'current_month' | 'all' | 'last_30'>('last_30');
	let selectedCategory = $state<string>('all');
	let searchQuery = $state('');
	let fromDate = $state('');
	let toDate = $state('');
	let minAmount = $state<string>('');
	let maxAmount = $state<string>('');

	// Modals State
	let isScanModalOpen = $state(false);

	// Auto-open modal if URL has ?action=scan
	$effect(() => {
		const action = page.url.searchParams.get('action');
		if (action === 'scan') {
			openScanModal();
		}
	});

	// Date Helpers
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();

	function isCurrentMonthDate(d: Date | number | string): boolean {
		const dateObj = new Date(d);
		return dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth;
	}

	function isLast30DaysDate(d: Date | number | string): boolean {
		const dateObj = new Date(d);
		if (isNaN(dateObj.getTime())) return false;
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - dateObj.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays <= 30;
	}

	function toISODateString(d: Date | string | number): string {
		const dateObj = new Date(d);
		if (isNaN(dateObj.getTime())) return '';
		return dateObj.toISOString().split('T')[0];
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		fromDate = '';
		toDate = '';
		minAmount = '';
		maxAmount = '';
		timeFilter = 'all';
	}

	// Filtered Expenses List based on active filters
	let filteredExpenses = $derived(
		expensesList.filter((exp) => {
			const matchesTime =
				timeFilter === 'all' ||
				(timeFilter === 'current_month' && isCurrentMonthDate(exp.date)) ||
				(timeFilter === 'last_30' && isLast30DaysDate(exp.date));
			const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;

			const q = searchQuery.trim().toLowerCase();
			const matchesSearch =
				q === '' ||
				exp.vendor.toLowerCase().includes(q) ||
				exp.category.toLowerCase().includes(q) ||
				(exp.notes && exp.notes.toLowerCase().includes(q));

			const expDateStr = toISODateString(exp.date);
			const matchesFromDate = !fromDate || expDateStr >= fromDate;
			const matchesToDate = !toDate || expDateStr <= toDate;

			const amountRand = exp.amountCents / 100;
			const matchesMinAmount =
				minAmount === '' || (!isNaN(parseFloat(minAmount)) && amountRand >= parseFloat(minAmount));
			const matchesMaxAmount =
				maxAmount === '' || (!isNaN(parseFloat(maxAmount)) && amountRand <= parseFloat(maxAmount));

			return (
				matchesTime &&
				matchesCategory &&
				matchesSearch &&
				matchesFromDate &&
				matchesToDate &&
				matchesMinAmount &&
				matchesMaxAmount
			);
		})
	);

	// Context Expenses for Pie Chart & Totals
	let filterContextExpenses = $derived(
		expensesList.filter((exp) => {
			const matchesTime =
				timeFilter === 'all' ||
				(timeFilter === 'current_month' && isCurrentMonthDate(exp.date)) ||
				(timeFilter === 'last_30' && isLast30DaysDate(exp.date));
			return matchesTime;
		})
	);

	// Breakdown for Donut Chart
	const CATEGORY_COLORS = [
		'#8b5cf6', // Indigo
		'#3b82f6', // Blue
		'#10b981', // Emerald Green
		'#f59e0b', // Amber / Orange
		'#ec4899', // Pink
		'#6366f1', // Violet
		'#14b8a6', // Teal
		'#84cc16' // Lime
	];

	function getCategoryColor(index: number, slug: string): string {
		const lower = slug.toLowerCase();
		if (lower.includes('veh') || lower.includes('fuel')) return '#f59e0b';
		if (lower.includes('groc') || lower.includes('food')) return '#10b981';
		if (lower.includes('util') || lower.includes('serv')) return '#3b82f6';
		if (lower.includes('maint')) return '#8b5cf6';
		return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
	}

	let categoryBreakdown = $derived.by<SpendingCategoryItem[]>(() => {
		const map = new SvelteMap<string, number>();
		let total = 0;
		for (const e of filterContextExpenses) {
			const curr = map.get(e.category) || 0;
			map.set(e.category, curr + e.amountCents);
			total += e.amountCents;
		}

		if (total === 0) return [];

		const items: SpendingCategoryItem[] = [];
		let idx = 0;
		for (const [slug, totalCents] of map.entries()) {
			const cat = categoriesList.find((c) => c.slug === slug);
			const name = cat?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
			const exactPercentage = (totalCents / total) * 100;
			const percentage = Math.round(exactPercentage);
			const color = getCategoryColor(idx, slug);
			items.push({
				slug,
				name,
				totalCents,
				percentage,
				exactPercentage,
				color
			});
			idx++;
		}

		return items.sort((a, b) => b.totalCents - a.totalCents);
	});

	// Spend Totals
	let totalSpendCents = $derived(expensesList.reduce((sum, e) => sum + e.amountCents, 0));
	let activeViewSpendCents = $derived(filteredExpenses.reduce((sum, e) => sum + e.amountCents, 0));

	function openScanModal() {
		isScanModalOpen = true;
	}

	function closeScanModal() {
		isScanModalOpen = false;
	}
</script>

<svelte:head>
	<title>Expense Tracking & Analytics - Breach</title>
</svelte:head>

<div class="space-y-8">
	<!-- Title & Action Bar -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span
					class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
				>
					Financial Management
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold text-white md:text-4xl">Household Expenses</h1>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Scan paper receipts, track spending categories, and analyze monthly cashflow.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={openScanModal}
				class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
			>
				<Sparkles size={16} />
				<span>Scan / Add Expense</span>
			</button>
		</div>
	</div>

	<!-- Top Metric Summary Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Filtered View Spend</span>
				<DollarSign size={14} class="text-[var(--color-coral)]" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(activeViewSpendCents)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">
				{filteredExpenses.length} matching transactions
			</p>
		</div>

		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Lifetime Total Spend</span>
				<Receipt size={14} class="text-amber-400" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(totalSpendCents)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">
				{expensesList.length} total receipts recorded
			</p>
		</div>

		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Active Categories</span>
				<CalendarDays size={14} class="text-sky-400" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{categoriesList.length} Categories
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">Configured in Master Data</p>
		</div>
	</div>

	<!-- Pie Chart & Analytics Visualizer -->
	{#if categoryBreakdown.length > 0}
		<div
			class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
		>
			<SpendingPieChart
				{categoryBreakdown}
				totalSpendCents={activeViewSpendCents}
				{timeFilter}
				onTimeFilterChange={(tf) => (timeFilter = tf)}
				{selectedCategory}
				onSelectCategory={(cat) => (selectedCategory = cat)}
			/>
		</div>
	{/if}

	<!-- Filter Controls Component -->
	<ExpenseFilterBar
		bind:searchQuery
		bind:selectedCategory
		bind:timeFilter
		bind:fromDate
		bind:toDate
		bind:minAmount
		bind:maxAmount
		categories={categoriesList}
		onclear={clearFilters}
	/>

	<!-- Expenses Table Component -->
	<ExpenseTable expenses={filteredExpenses} categories={categoriesList} />

	<!-- Add Expense Modal Component -->
	<ExpenseFormModal
		isOpen={isScanModalOpen}
		categories={categoriesList}
		companies={companiesList}
		onclose={closeScanModal}
	/>
</div>
