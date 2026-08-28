<script lang="ts">
	import { enhance } from '$app/forms';
	import { Receipt, Eye, Trash2, Tag, X, Landmark } from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { Expense, ExpenseCategory } from '$lib/types';

	interface Props {
		expenses: Expense[];
		categories: ExpenseCategory[];
	}

	let { expenses, categories }: Props = $props();

	let previewExpense = $state<Expense | null>(null);

	function getCategoryName(slug: string): string {
		const found = categories.find((c) => c.slug === slug);
		return found ? found.name : slug.charAt(0).toUpperCase() + slug.slice(1);
	}
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
					<th class="px-4 py-3">Vendor / Title</th>
					<th class="px-4 py-3">Category</th>
					<th class="px-4 py-3">Paid From</th>
					<th class="px-4 py-3">Date</th>
					<th class="px-4 py-3 text-right">Amount</th>
					<th class="px-4 py-3 text-center">Receipt</th>
					<th class="px-4 py-3 text-center">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-dark-border)]">
				{#each expenses as exp (exp.id)}
					<tr class="transition-colors hover:bg-[var(--color-dark-card)]">
						<td class="px-4 py-3">
							<div class="font-bold text-white">{exp.vendor}</div>
							{#if exp.notes}
								<div class="text-[11px] text-[var(--color-text-subtle)] italic">{exp.notes}</div>
							{/if}
						</td>
						<td class="px-4 py-3">
							<span
								class="sharp-corners inline-flex items-center gap-1 bg-[var(--color-dark-card)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-coral)]"
							>
								<Tag size={11} />
								<span>{getCategoryName(exp.category)}</span>
							</span>
						</td>
						<td class="px-4 py-3">
							{#if exp.paidFromBankAccount}
								<span
									class="sharp-corners inline-flex items-center gap-1 border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-300"
									title={exp.paidFromCompany?.name || 'Company Account'}
								>
									<Landmark size={11} class="text-purple-400" />
									<span>
										{#if exp.paidFromCompany}
											{exp.paidFromCompany.name} •
										{/if}
										{exp.paidFromBankAccount.accountAlias} ({exp.paidFromBankAccount.bankName})
									</span>
								</span>
							{:else}
								<span class="text-[11px] text-[var(--color-text-subtle)]">Personal / Default</span>
							{/if}
						</td>
						<td class="px-4 py-3 font-mono text-[var(--color-text-muted)]">
							{formatDate(exp.date)}
						</td>
						<td class="px-4 py-3 text-right font-mono font-bold text-white">
							{formatCurrency(exp.amountCents)}
						</td>
						<td class="px-4 py-3 text-center">
							{#if exp.receiptUrl}
								<button
									type="button"
									onclick={() => (previewExpense = exp)}
									class="inline-flex items-center gap-1 text-[11px] text-[var(--color-coral)] hover:underline"
								>
									<Receipt size={13} />
									<span>View Receipt</span>
								</button>
							{:else}
								<span class="text-[11px] text-[var(--color-text-subtle)]">Manual</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-center">
							<div class="flex items-center justify-center gap-2">
								{#if exp.rawOcrData || exp.receiptUrl}
									<button
										type="button"
										onclick={() => (previewExpense = exp)}
										class="text-[var(--color-text-muted)] hover:text-white"
										title="View Details"
									>
										<Eye size={15} />
									</button>
								{/if}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={exp.id} />
									<button
										type="submit"
										class="text-[var(--color-text-muted)] hover:text-red-400"
										title="Delete Expense"
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
							No expenses found matching the active criteria.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Receipt / Details Preview Modal -->
{#if previewExpense}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners max-h-[85vh] w-full max-w-lg space-y-4 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<div class="flex items-center gap-2">
					<Receipt class="text-[var(--color-coral)]" size={18} />
					<h3 class="font-serif text-lg font-bold text-white">{previewExpense.vendor}</h3>
				</div>
				<button
					onclick={() => (previewExpense = null)}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<div class="space-y-3 text-xs">
				<div class="flex justify-between border-b border-[var(--color-dark-border)] py-1.5">
					<span class="text-[var(--color-text-muted)]">Amount:</span>
					<span class="font-mono font-bold text-white"
						>{formatCurrency(previewExpense.amountCents)}</span
					>
				</div>
				<div class="flex justify-between border-b border-[var(--color-dark-border)] py-1.5">
					<span class="text-[var(--color-text-muted)]">Date:</span>
					<span class="font-mono text-white">{formatDate(previewExpense.date)}</span>
				</div>
				<div class="flex justify-between border-b border-[var(--color-dark-border)] py-1.5">
					<span class="text-[var(--color-text-muted)]">Category:</span>
					<span class="font-semibold text-[var(--color-coral)]"
						>{getCategoryName(previewExpense.category)}</span
					>
				</div>
				<div class="flex justify-between border-b border-[var(--color-dark-border)] py-1.5">
					<span class="text-[var(--color-text-muted)]">Paid From Account:</span>
					{#if previewExpense.paidFromBankAccount}
						<span class="font-semibold text-purple-300">
							{#if previewExpense.paidFromCompany}
								{previewExpense.paidFromCompany.name} -
							{/if}
							{previewExpense.paidFromBankAccount.accountAlias} ({previewExpense.paidFromBankAccount
								.bankName})
						</span>
					{:else}
						<span class="text-[var(--color-text-subtle)]">Personal / Unspecified</span>
					{/if}
				</div>
				{#if previewExpense.notes}
					<div class="space-y-1 py-1.5">
						<span class="text-[var(--color-text-muted)]">Notes:</span>
						<p class="rounded-none bg-[var(--color-dark-card)] p-2 text-white">
							{previewExpense.notes}
						</p>
					</div>
				{/if}
				{#if previewExpense.rawOcrData}
					<div class="space-y-1 py-1.5">
						<span class="text-[var(--color-text-muted)]">Extracted Receipt Text:</span>
						<pre
							class="max-h-40 overflow-y-auto rounded-none bg-[var(--color-dark-card)] p-2 font-mono text-[10px] whitespace-pre-wrap text-[var(--color-text-subtle)]">{previewExpense.rawOcrData}</pre>
					</div>
				{/if}
			</div>

			<div class="flex justify-end border-t border-[var(--color-dark-border)] pt-3">
				<button
					onclick={() => (previewExpense = null)}
					class="sharp-corners bg-[var(--color-coral)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
