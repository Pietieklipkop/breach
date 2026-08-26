<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		FileText,
		Plus,
		X,
		Trash2,
		CheckSquare,
		Square,
		ChevronDown,
		ChevronUp
	} from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { Company, Expense, ExpenseCategory } from '$lib/types';
	import { SvelteSet } from 'svelte/reactivity';

	export interface AddedInvoiceLine {
		id: string;
		description: string;
		category: string;
		amountCents: number;
		expenseIds: string[];
		expenseItems: Array<{ id: string; vendor: string; amountCents: number; date: Date | number }>;
		isCustom: boolean;
		expanded?: boolean;
	}

	interface Props {
		isOpen: boolean;
		companies: Company[];
		expenses: Expense[];
		categories: ExpenseCategory[];
		onclose: () => void;
		onsuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		companies,
		expenses,
		categories,
		onclose,
		onsuccess
	}: Props = $props();

	// Form State for Creating Invoice
	let fromCompanyId = $state<string>('');
	let toCompanyId = $state<string>('');
	let invoiceNumber = $state<string>('');
	let issueDate = $state<string>(new Date().toISOString().split('T')[0]);
	let dueDate = $state<string>(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
	let vatRatePercent = $state<number>(15); // 15% VAT standard in South Africa
	let invoiceNotes = $state<string>('Inter-company expense allocation & management fees.');

	// Invoice Lines Added Thus Far
	let invoiceLines = $state<AddedInvoiceLine[]>([]);

	// Line Builder State
	let activeTabMode = $state<'expense' | 'custom'>('expense');
	let expenseCategoryFilter = $state<string>('all');
	let combinedLineName = $state<string>('');
	let selectedExpenseIds = $state<Set<string>>(new Set());

	// Custom Line State
	let customLineDesc = $state<string>('Management Service Fee');
	let customLineCategory = $state<string>('services');
	let customLineAmountRand = $state<number | ''>(1500);

	$effect(() => {
		if (isOpen) {
			fromCompanyId = companies[0]?.id || '';
			toCompanyId = companies[1]?.id || companies[0]?.id || '';
			invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
			issueDate = new Date().toISOString().split('T')[0];
			dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
			vatRatePercent = 15;
			invoiceNotes = 'Inter-company expense allocation & management fees.';
			invoiceLines = [];
			selectedExpenseIds = new Set();
			combinedLineName = '';
			expenseCategoryFilter = 'all';
		}
	});

	let assignedExpenseIds = $derived.by(() => {
		const set = new SvelteSet<string>();
		for (const line of invoiceLines) {
			for (const id of line.expenseIds) {
				set.add(id);
			}
		}
		return set;
	});

	let availableExpenses = $derived(expenses.filter((e) => !assignedExpenseIds.has(e.id)));

	let matchingAvailableExpenses = $derived(
		availableExpenses.filter((e) =>
			expenseCategoryFilter === 'all'
				? true
				: e.category.toLowerCase() === expenseCategoryFilter.toLowerCase()
		)
	);

	let selectedExpensesList = $derived(
		availableExpenses.filter((e) => selectedExpenseIds.has(e.id))
	);

	let totalSelectedCents = $derived(
		selectedExpensesList.reduce((sum, e) => sum + e.amountCents, 0)
	);

	function toggleExpenseSelection(id: string) {
		const next = new SvelteSet(selectedExpenseIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedExpenseIds = next;
	}

	function toggleSelectAllMatching() {
		const allSelected =
			matchingAvailableExpenses.length > 0 &&
			matchingAvailableExpenses.every((e) => selectedExpenseIds.has(e.id));
		const next = new SvelteSet(selectedExpenseIds);
		if (allSelected) {
			for (const e of matchingAvailableExpenses) {
				next.delete(e.id);
			}
		} else {
			for (const e of matchingAvailableExpenses) {
				next.add(e.id);
			}
		}
		selectedExpenseIds = next;
	}

	function addCombinedExpenseLine() {
		if (selectedExpensesList.length === 0) return;

		const catObj = categories.find((c) => c.slug === expenseCategoryFilter);
		const defaultDesc =
			expenseCategoryFilter === 'all'
				? `Consolidated Business Expenses (${selectedExpensesList.length} items)`
				: `${catObj?.name || expenseCategoryFilter} Expenses (${selectedExpensesList.length} items)`;

		const desc = combinedLineName.trim() || defaultDesc;
		const cat =
			expenseCategoryFilter === 'all'
				? selectedExpensesList[0]?.category || 'general'
				: expenseCategoryFilter;

		const newLine: AddedInvoiceLine = {
			id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
			description: desc,
			category: cat,
			amountCents: totalSelectedCents,
			expenseIds: selectedExpensesList.map((e) => e.id),
			expenseItems: selectedExpensesList.map((e) => ({
				id: e.id,
				vendor: e.vendor,
				amountCents: e.amountCents,
				date: e.date
			})),
			isCustom: false,
			expanded: false
		};

		invoiceLines = [...invoiceLines, newLine];
		selectedExpenseIds = new Set();
		combinedLineName = '';
	}

	function addCustomLine() {
		const amt = Number(customLineAmountRand) || 0;
		if (!customLineDesc.trim() || amt <= 0) return;

		const newLine: AddedInvoiceLine = {
			id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
			description: customLineDesc.trim(),
			category: customLineCategory,
			amountCents: Math.round(amt * 100),
			expenseIds: [],
			expenseItems: [],
			isCustom: true,
			expanded: false
		};

		invoiceLines = [...invoiceLines, newLine];
		customLineDesc = 'Management Service Fee';
		customLineAmountRand = 1500;
	}

	function removeInvoiceLine(lineId: string) {
		invoiceLines = invoiceLines.filter((l) => l.id !== lineId);
	}

	function toggleLineExpansion(lineId: string) {
		invoiceLines = invoiceLines.map((l) => (l.id === lineId ? { ...l, expanded: !l.expanded } : l));
	}

	let calculatedSubtotalCents = $derived(
		invoiceLines.reduce((sum, line) => sum + line.amountCents, 0)
	);

	let calculatedVatCents = $derived(
		Math.round((calculatedSubtotalCents * (vatRatePercent || 0)) / 100)
	);

	let calculatedTotalCents = $derived(calculatedSubtotalCents + calculatedVatCents);

	let itemsPayloadJson = $derived(
		JSON.stringify(
			invoiceLines.map((l) => ({
				description: l.description,
				category: l.category,
				amountCents: l.amountCents
			}))
		)
	);
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners max-h-[95vh] w-full max-w-4xl space-y-6 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<div class="flex items-center gap-2">
					<FileText class="text-[var(--color-coral)]" size={20} />
					<h2 class="font-serif text-xl font-bold text-white">Create Inter-Company Tax Invoice</h2>
				</div>
				<button
					onclick={onclose}
					class="text-[var(--color-text-muted)] hover:text-white"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<form
				method="POST"
				action="?/createInvoice"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							onsuccess?.();
							onclose();
						}
					};
				}}
				class="space-y-6"
			>
				<input type="hidden" name="items" value={itemsPayloadJson} />
				<input type="hidden" name="issueDate" value={issueDate} />

				<!-- Header Metadata Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<label
							for="from-company-select"
							class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Issuing Entity (From) *
						</label>
						<select
							id="from-company-select"
							name="fromCompanyId"
							required
							bind:value={fromCompanyId}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-xs text-white focus:outline-hidden"
						>
							{#each companies as c (c.id)}
								<option value={c.id}>{c.name} ({c.companyType})</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="to-company-select"
							class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Recipient Entity (To) *
						</label>
						<select
							id="to-company-select"
							name="toCompanyId"
							required
							bind:value={toCompanyId}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-xs text-white focus:outline-hidden"
						>
							{#each companies as c (c.id)}
								<option value={c.id}>{c.name} ({c.companyType})</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="invoice-number-input"
							class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Invoice #
						</label>
						<input
							id="invoice-number-input"
							name="invoiceNumber"
							type="text"
							required
							bind:value={invoiceNumber}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 font-mono text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="due-date-input"
							class="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Due Date *
						</label>
						<input
							id="due-date-input"
							name="dueDate"
							type="date"
							required
							bind:value={dueDate}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<!-- Line Item Builder Box -->
				<div
					class="space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-4"
				>
					<div
						class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-2"
					>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => (activeTabMode = 'expense')}
								class="sharp-corners px-3 py-1 text-xs font-semibold uppercase {activeTabMode ===
								'expense'
									? 'bg-[var(--color-coral)] text-white'
									: 'bg-[var(--color-dark-surface)] text-[var(--color-text-muted)]'}"
							>
								Import Expenses ({availableExpenses.length})
							</button>
							<button
								type="button"
								onclick={() => (activeTabMode = 'custom')}
								class="sharp-corners px-3 py-1 text-xs font-semibold uppercase {activeTabMode ===
								'custom'
									? 'bg-[var(--color-coral)] text-white'
									: 'bg-[var(--color-dark-surface)] text-[var(--color-text-muted)]'}"
							>
								Custom Line Item
							</button>
						</div>
					</div>

					{#if activeTabMode === 'expense'}
						<!-- Expense Selection & Consolidation -->
						<div class="space-y-3">
							<div class="flex items-center justify-between gap-3">
								<select
									bind:value={expenseCategoryFilter}
									class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1.5 text-xs text-white capitalize focus:outline-hidden"
								>
									<option value="all">All Available Categories ({availableExpenses.length})</option>
									{#each categories as cat (cat.id || cat.slug)}
										<option value={cat.slug}>{cat.name}</option>
									{/each}
								</select>

								<button
									type="button"
									onclick={toggleSelectAllMatching}
									class="text-xs text-[var(--color-coral)] hover:underline"
								>
									Select All Matching ({matchingAvailableExpenses.length})
								</button>
							</div>

							<!-- Available Expenses Grid -->
							<div
								class="max-h-48 space-y-1.5 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2"
							>
								{#each matchingAvailableExpenses as exp (exp.id)}
									<button
										type="button"
										onclick={() => toggleExpenseSelection(exp.id)}
										class="flex w-full items-center justify-between p-1.5 text-left text-xs transition-colors hover:bg-[var(--color-dark-card)]"
									>
										<div class="flex items-center gap-2">
											{#if selectedExpenseIds.has(exp.id)}
												<CheckSquare size={14} class="text-[var(--color-coral)]" />
											{:else}
												<Square size={14} class="text-[var(--color-text-subtle)]" />
											{/if}
											<span class="font-medium text-white">{exp.vendor}</span>
											<span class="font-mono text-[10px] text-[var(--color-text-subtle)]"
												>({formatDate(exp.date)})</span
											>
										</div>
										<span class="font-mono font-bold text-[var(--color-coral)]"
											>{formatCurrency(exp.amountCents)}</span
										>
									</button>
								{:else}
									<p class="py-4 text-center text-xs text-[var(--color-text-muted)]">
										No available expenses found in this category.
									</p>
								{/each}
							</div>

							{#if selectedExpensesList.length > 0}
								<div class="flex items-center gap-2">
									<input
										type="text"
										bind:value={combinedLineName}
										placeholder="Consolidated Line Title (e.g. Q3 Software Retainers)"
										class="sharp-corners flex-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 text-xs text-white focus:outline-hidden"
									/>
									<button
										type="button"
										onclick={addCombinedExpenseLine}
										class="sharp-corners flex items-center gap-1.5 bg-[var(--color-coral)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
									>
										<Plus size={14} />
										<span>Add Line ({formatCurrency(totalSelectedCents)})</span>
									</button>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Custom Line Entry -->
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<input
								type="text"
								bind:value={customLineDesc}
								placeholder="Description (e.g. Accounting Retainer)"
								class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 text-xs text-white focus:outline-hidden sm:col-span-2"
							/>
							<div class="flex items-center gap-2">
								<input
									type="number"
									step="0.01"
									bind:value={customLineAmountRand}
									placeholder="Amount (R)"
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 font-mono text-xs text-white focus:outline-hidden"
								/>
								<button
									type="button"
									onclick={addCustomLine}
									class="sharp-corners flex shrink-0 items-center gap-1 bg-[var(--color-coral)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
								>
									<Plus size={14} />
									<span>Add</span>
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Added Lines Table -->
				<div class="space-y-2">
					<h3 class="text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
						Invoice Line Items ({invoiceLines.length})
					</h3>
					<div
						class="sharp-corners overflow-hidden border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)]"
					>
						<table class="w-full text-left text-xs">
							<thead
								class="border-b border-[var(--color-dark-border)] bg-[var(--color-dark-card)] text-[10px] font-bold text-[var(--color-text-muted)] uppercase"
							>
								<tr>
									<th class="p-2.5">Line Description</th>
									<th class="p-2.5">Type</th>
									<th class="p-2.5 text-right">Amount</th>
									<th class="p-2.5 text-center">Action</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--color-dark-border)]">
								{#each invoiceLines as line (line.id)}
									<tr>
										<td class="p-2.5 font-semibold text-white">
											<div class="flex items-center gap-1.5">
												{#if line.expenseItems.length > 0}
													<button
														type="button"
														onclick={() => toggleLineExpansion(line.id)}
														class="text-[var(--color-text-muted)] hover:text-white"
													>
														{#if line.expanded}
															<ChevronUp size={14} />
														{:else}
															<ChevronDown size={14} />
														{/if}
													</button>
												{/if}
												<span>{line.description}</span>
											</div>
											{#if line.expanded && line.expenseItems.length > 0}
												<div
													class="mt-1.5 space-y-1 pl-4 text-[11px] text-[var(--color-text-muted)]"
												>
													{#each line.expenseItems as it (it.id)}
														<div
															class="flex justify-between border-t border-[var(--color-dark-border)]/50 pt-0.5"
														>
															<span>{it.vendor} ({formatDate(it.date)})</span>
															<span class="font-mono">{formatCurrency(it.amountCents)}</span>
														</div>
													{/each}
												</div>
											{/if}
										</td>
										<td class="p-2.5">
											<span
												class="sharp-corners bg-[var(--color-dark-card)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
											>
												{line.isCustom ? 'Custom Fee' : `${line.expenseIds.length} Expenses`}
											</span>
										</td>
										<td class="p-2.5 text-right font-mono font-bold text-white">
											{formatCurrency(line.amountCents)}
										</td>
										<td class="p-2.5 text-center">
											<button
												type="button"
												onclick={() => removeInvoiceLine(line.id)}
												class="text-[var(--color-text-muted)] hover:text-red-400"
												title="Remove Line"
											>
												<Trash2 size={14} />
											</button>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="4" class="p-6 text-center text-xs text-[var(--color-text-muted)]">
											No line items added yet. Choose expenses above or add a custom fee.
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Financial Calculations & Summary -->
				<div
					class="flex flex-col items-end justify-between gap-4 border-t border-[var(--color-dark-border)] pt-4 sm:flex-row"
				>
					<div class="w-full space-y-2 sm:max-w-xs">
						<label
							for="invoice-notes-input"
							class="block text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Notes & Remittance Info
						</label>
						<textarea
							id="invoice-notes-input"
							name="notes"
							bind:value={invoiceNotes}
							rows="2"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-2 text-xs text-white focus:outline-hidden"
						></textarea>
					</div>

					<div class="w-full space-y-1.5 text-right text-xs sm:max-w-xs">
						<div class="flex justify-between">
							<span class="text-[var(--color-text-muted)]">Subtotal:</span>
							<span class="font-mono font-bold text-white"
								>{formatCurrency(calculatedSubtotalCents)}</span
							>
						</div>
						<div class="flex justify-between">
							<span class="text-[var(--color-text-muted)]">VAT ({vatRatePercent}%):</span>
							<span class="font-mono font-bold text-white"
								>{formatCurrency(calculatedVatCents)}</span
							>
						</div>
						<div
							class="flex justify-between border-t border-[var(--color-dark-border)] pt-1.5 text-sm font-bold"
						>
							<span class="text-[var(--color-coral)]">Total Due:</span>
							<span class="font-mono text-[var(--color-coral)]"
								>{formatCurrency(calculatedTotalCents)}</span
							>
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div
					class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-4"
				>
					<button
						type="button"
						onclick={onclose}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={invoiceLines.length === 0}
						class="sharp-corners flex items-center gap-1.5 bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						<Plus size={14} />
						<span>Issue Tax Invoice</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
