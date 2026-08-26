<script lang="ts">
	import { FileText, Plus, Building2, Receipt, Database, Check, RefreshCw } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';
	import type { Company, Expense, ExpenseCategory, Invoice } from '$lib/types';
	import InvoiceTable from '$lib/components/invoicing/InvoiceTable.svelte';
	import InvoiceFormModal from '$lib/components/invoicing/InvoiceFormModal.svelte';

	interface PageData {
		companies: Company[];
		expenses: Expense[];
		categories: ExpenseCategory[];
		invoices: Invoice[];
	}

	let { data }: { data: PageData } = $props();

	let invoicesList = $derived(data.invoices || []);
	let companiesList = $derived(data.companies || []);
	let expensesList = $derived(data.expenses || []);
	let categoriesList = $derived(data.categories || []);

	// Modals State
	let isCreateModalOpen = $state(false);
	let isSeeding = $state(false);
	let statusMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Derived metrics
	let totalInvoicedCents = $derived(invoicesList.reduce((sum, inv) => sum + inv.totalCents, 0));

	let totalVatCollectedCents = $derived(invoicesList.reduce((sum, inv) => sum + inv.vatCents, 0));

	async function handleSeedDatabase() {
		isSeeding = true;
		statusMessage = null;
		try {
			const res = await fetch('/api/seed', { method: 'POST' });
			const resData = (await res.json()) as { success?: boolean; message?: string; error?: string };
			if (resData.success) {
				statusMessage = {
					type: 'success',
					text: resData.message || 'Database successfully seeded!'
				};
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} else {
				statusMessage = {
					type: 'error',
					text: resData.error || 'Failed to seed database'
				};
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to seed sample data';
			statusMessage = {
				type: 'error',
				text: message
			};
		} finally {
			isSeeding = false;
		}
	}

	function openCreateModal() {
		isCreateModalOpen = true;
	}

	function closeCreateModal() {
		isCreateModalOpen = false;
	}
</script>

<svelte:head>
	<title>Inter-Company Invoicing & VAT Allocations - Breach</title>
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
					Inter-Company Billing
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold text-white md:text-4xl">
				Invoicing & Expense Allocations
			</h1>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Generate compliant South African tax invoices between registered entities, complete with 15%
				VAT calculations.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				onclick={handleSeedDatabase}
				disabled={isSeeding}
				class="sharp-corners flex items-center gap-2 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-dark-border)] disabled:opacity-50"
			>
				{#if isSeeding}
					<RefreshCw size={14} class="animate-spin text-[var(--color-coral)]" />
					<span>Seeding Sample Data...</span>
				{:else}
					<Database size={14} class="text-[var(--color-coral)]" />
					<span>Seed Demo Invoices & Companies</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={openCreateModal}
				class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
			>
				<Plus size={16} />
				<span>Create New Invoice</span>
			</button>
		</div>
	</div>

	<!-- Status Message Banner -->
	{#if statusMessage}
		<div
			class="sharp-corners flex items-center justify-between p-4 text-xs font-semibold {statusMessage.type ===
			'success'
				? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
				: 'border border-red-500/40 bg-red-500/10 text-red-400'}"
		>
			<div class="flex items-center gap-2">
				<Check size={16} />
				<span>{statusMessage.text}</span>
			</div>
			<button onclick={() => (statusMessage = null)} class="text-white hover:underline">
				Dismiss
			</button>
		</div>
	{/if}

	<!-- Metric Summary Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Total Invoiced Revenue</span>
				<FileText size={14} class="text-[var(--color-coral)]" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(totalInvoicedCents)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">
				{invoicesList.length} registered tax invoices
			</p>
		</div>

		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Total 15% VAT Collected</span>
				<Receipt size={14} class="text-amber-400" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{formatCurrency(totalVatCollectedCents)}
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">Output VAT for SARS tax return</p>
		</div>

		<div
			class="sharp-corners space-y-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-4"
		>
			<div
				class="flex items-center justify-between text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<span>Registered Entities</span>
				<Building2 size={14} class="text-sky-400" />
			</div>
			<p class="font-mono text-xl font-bold text-white">
				{companiesList.length} Companies
			</p>
			<p class="text-[10px] text-[var(--color-text-subtle)]">Holdings, subsidiaries & clients</p>
		</div>
	</div>

	<!-- Invoices Table Component -->
	<InvoiceTable invoices={invoicesList} />

	<!-- Create Invoice Modal Component -->
	<InvoiceFormModal
		isOpen={isCreateModalOpen}
		companies={companiesList}
		expenses={expensesList}
		categories={categoriesList}
		onclose={closeCreateModal}
	/>
</div>
