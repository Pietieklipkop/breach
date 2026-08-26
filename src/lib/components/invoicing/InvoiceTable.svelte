<script lang="ts">
	import { enhance } from '$app/forms';
	import { Eye, Trash2, Building2, X } from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { Invoice } from '$lib/types';

	interface Props {
		invoices: Invoice[];
	}

	let { invoices }: Props = $props();

	let previewInvoice = $state<Invoice | null>(null);
</script>

<div
	class="sharp-corners overflow-hidden border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)]"
>
	<div class="overflow-x-auto">
		<table class="w-full text-left text-xs">
			<thead
				class="border-b border-[var(--color-dark-border)] bg-[var(--color-dark-card)] text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
			>
				<tr>
					<th class="px-4 py-3">Invoice Number</th>
					<th class="px-4 py-3">From Company</th>
					<th class="px-4 py-3">To Company</th>
					<th class="px-4 py-3">Issue / Due Date</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3 text-right">Total Amount</th>
					<th class="px-4 py-3 text-center">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-dark-border)]">
				{#each invoices as inv (inv.id)}
					<tr class="transition-colors hover:bg-[var(--color-dark-card)]">
						<td class="px-4 py-3 font-mono font-bold text-white">
							{inv.invoiceNumber}
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center gap-1 font-semibold text-white">
								<Building2 size={13} class="text-[var(--color-coral)]" />
								<span>{inv.fromCompany?.name || 'Unknown Entity'}</span>
							</div>
						</td>
						<td class="px-4 py-3">
							<span class="text-[var(--color-text-muted)]">
								{inv.toCompany?.name || 'Unknown Client'}
							</span>
						</td>
						<td class="px-4 py-3 font-mono text-[var(--color-text-muted)]">
							<div>{formatDate(inv.issueDate)}</div>
							<div class="text-[10px] text-[var(--color-text-subtle)]">
								Due: {formatDate(inv.dueDate)}
							</div>
						</td>
						<td class="px-4 py-3">
							<span
								class="sharp-corners px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {inv.status ===
								'paid'
									? 'bg-emerald-500/20 text-emerald-400'
									: inv.status === 'issued'
										? 'bg-[var(--color-coral-light)] text-[var(--color-coral)]'
										: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)]'}"
							>
								{inv.status}
							</span>
						</td>
						<td class="px-4 py-3 text-right font-mono font-bold text-white">
							{formatCurrency(inv.totalCents)}
						</td>
						<td class="px-4 py-3 text-center">
							<div class="flex items-center justify-center gap-2">
								<button
									type="button"
									onclick={() => (previewInvoice = inv)}
									class="text-[var(--color-text-muted)] hover:text-white"
									title="Preview Invoice"
								>
									<Eye size={15} />
								</button>
								<form method="POST" action="?/deleteInvoice" use:enhance>
									<input type="hidden" name="id" value={inv.id} />
									<button
										type="submit"
										class="text-[var(--color-text-muted)] hover:text-red-400"
										title="Delete Invoice"
									>
										<Trash2 size={15} />
									</button>
								</form>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">
							No invoices generated yet. Click "Create New Invoice" to start.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Invoice Preview Modal -->
{#if previewInvoice}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-8 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-4"
			>
				<div>
					<span
						class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
					>
						Tax Invoice
					</span>
					<h2 class="mt-1 font-mono text-xl font-bold text-white">
						{previewInvoice.invoiceNumber}
					</h2>
				</div>
				<button
					onclick={() => (previewInvoice = null)}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Company Info Header -->
			<div class="grid grid-cols-2 gap-6 text-xs">
				<div class="space-y-1">
					<span
						class="text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
						>From / Issuer</span
					>
					<p class="text-sm font-bold text-white">{previewInvoice.fromCompany?.name}</p>
					{#if previewInvoice.fromCompany?.regNumber}
						<p class="text-[var(--color-text-muted)]">
							Reg: {previewInvoice.fromCompany.regNumber}
						</p>
					{/if}
					{#if previewInvoice.fromCompany?.taxNumber}
						<p class="text-[var(--color-text-muted)]">
							VAT: {previewInvoice.fromCompany.taxNumber}
						</p>
					{/if}
					{#if previewInvoice.fromCompany?.address}
						<p class="text-[var(--color-text-muted)]">{previewInvoice.fromCompany.address}</p>
					{/if}
				</div>

				<div class="space-y-1">
					<span
						class="text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
						>To / Client</span
					>
					<p class="text-sm font-bold text-white">{previewInvoice.toCompany?.name}</p>
					{#if previewInvoice.toCompany?.regNumber}
						<p class="text-[var(--color-text-muted)]">
							Reg: {previewInvoice.toCompany.regNumber}
						</p>
					{/if}
					{#if previewInvoice.toCompany?.taxNumber}
						<p class="text-[var(--color-text-muted)]">
							VAT: {previewInvoice.toCompany.taxNumber}
						</p>
					{/if}
					{#if previewInvoice.toCompany?.address}
						<p class="text-[var(--color-text-muted)]">{previewInvoice.toCompany.address}</p>
					{/if}
				</div>
			</div>

			<!-- Invoice Items Breakdown -->
			<div class="border border-[var(--color-dark-border)] bg-[var(--color-dark-card)]">
				<table class="w-full text-left text-xs">
					<thead
						class="border-b border-[var(--color-dark-border)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase"
					>
						<tr>
							<th class="p-3">Description</th>
							<th class="p-3 text-right">Amount</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-dark-border)]">
						{#each previewInvoice.items || [] as item (item.id || item.description)}
							<tr>
								<td class="p-3 text-white">{item.description}</td>
								<td class="p-3 text-right font-mono text-white"
									>{formatCurrency(item.amountCents)}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Totals -->
			<div class="space-y-1 text-right text-xs">
				<div class="flex justify-end gap-8">
					<span class="text-[var(--color-text-muted)]">Subtotal:</span>
					<span class="font-mono font-semibold text-white"
						>{formatCurrency(previewInvoice.subtotalCents)}</span
					>
				</div>
				<div class="flex justify-end gap-8">
					<span class="text-[var(--color-text-muted)]">VAT (15%):</span>
					<span class="font-mono font-semibold text-white"
						>{formatCurrency(previewInvoice.vatCents)}</span
					>
				</div>
				<div
					class="flex justify-end gap-8 border-t border-[var(--color-dark-border)] pt-2 text-sm font-bold"
				>
					<span class="text-[var(--color-coral)]">Total Due:</span>
					<span class="font-mono text-[var(--color-coral)]"
						>{formatCurrency(previewInvoice.totalCents)}</span
					>
				</div>
			</div>

			<div class="flex justify-end border-t border-[var(--color-dark-border)] pt-4">
				<button
					onclick={() => (previewInvoice = null)}
					class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
				>
					Close Preview
				</button>
			</div>
		</div>
	</div>
{/if}
