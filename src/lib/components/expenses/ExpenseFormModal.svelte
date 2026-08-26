<script lang="ts">
	import { enhance } from '$app/forms';
	import { Sparkles, X, Upload, Check, RefreshCw, FileCheck } from '@lucide/svelte';
	import { autoCategorizeExpense } from '$lib/utils';
	import type { ExpenseCategory, ParsedOcrResult } from '$lib/types';

	interface Props {
		isOpen: boolean;
		categories: ExpenseCategory[];
		onclose: () => void;
		onsuccess?: () => void;
	}

	let { isOpen = $bindable(false), categories, onclose, onsuccess }: Props = $props();

	let isScanning = $state(false);
	let scanCompleted = $state(false);
	let receiptFileName = $state('');

	let expVendor = $state('');
	let expCategory = $state<string>('');
	let expAmountRand = $state<number | null>(null);
	let expDate = $state(new Date().toISOString().split('T')[0]);
	let expNotes = $state('');
	let expRawOcrData = $state('');

	$effect(() => {
		if (isOpen) {
			expVendor = '';
			expCategory = categories[0]?.slug || 'general';
			expAmountRand = null;
			expDate = new Date().toISOString().split('T')[0];
			expNotes = '';
			expRawOcrData = '';
			scanCompleted = false;
			isScanning = false;
			receiptFileName = '';
		}
	});

	async function handleReceiptUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isScanning = true;
		scanCompleted = false;
		receiptFileName = file.name;

		let rawText = '';
		try {
			const { extractTextFromImageFile } = await import('$lib/ocr-client');
			rawText = await extractTextFromImageFile(file);
		} catch (ocrErr) {
			console.warn('Client OCR notice:', ocrErr);
		}

		const body = new FormData();
		body.append('file', file);
		body.append('documentType', 'receipt');
		if (rawText) {
			body.append('rawText', rawText);
		}

		try {
			const res = await fetch('/api/scan-document', {
				method: 'POST',
				body
			});
			const data = (await res.json()) as { success?: boolean; parsedData?: ParsedOcrResult };
			if (data.parsedData) {
				if (data.parsedData.vendor) {
					expVendor = data.parsedData.vendor;
				}
				if (data.parsedData.amountCents) {
					expAmountRand = data.parsedData.amountCents / 100;
				}
				if (data.parsedData.date) {
					expDate = data.parsedData.date;
				}
				if (data.parsedData.category) {
					expCategory = data.parsedData.category;
				} else if (data.parsedData.vendor) {
					const matched = autoCategorizeExpense(
						data.parsedData.vendor,
						data.parsedData.rawText || '',
						categories
					);
					if (matched) expCategory = matched.slug;
				}
				if (data.parsedData.notes) {
					expNotes = data.parsedData.notes;
				}
				if (data.parsedData.rawText) {
					expRawOcrData = data.parsedData.rawText;
				}

				scanCompleted = true;
			}
		} catch (err) {
			console.error('Receipt scan error:', err);
		} finally {
			isScanning = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners max-h-[90vh] w-full max-w-xl space-y-6 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<div class="flex items-center gap-2">
					<Sparkles class="text-[var(--color-coral)]" size={20} />
					<h2 class="font-serif text-xl font-bold text-white">Add Expense / Scan Slip</h2>
				</div>
				<button
					onclick={onclose}
					class="text-[var(--color-text-muted)] hover:text-white"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- AI Auto-Scan Dropzone -->
			<div
				class="sharp-corners space-y-3 border border-dashed border-[var(--color-coral)] bg-[var(--color-dark-card)] p-4"
			>
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1.5 text-xs font-bold text-white">
						<Upload size={14} class="text-[var(--color-coral)]" />
						<span>AI Receipt OCR Scanner</span>
					</span>
					{#if scanCompleted}
						<span
							class="sharp-corners flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
						>
							<Check size={12} />
							Receipt Extracted!
						</span>
					{/if}
				</div>

				<label class="block cursor-pointer">
					<div
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-4 py-3 text-center text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						{#if isScanning}
							<span
								class="flex animate-pulse items-center justify-center gap-2 text-[var(--color-coral)]"
							>
								<RefreshCw size={16} class="animate-spin" />
								<span>Extracting Vendor, Total, Date & Category...</span>
							</span>
						{:else if scanCompleted}
							<span class="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
								<FileCheck size={16} />
								<span>{receiptFileName} (Click to re-scan new file)</span>
							</span>
						{:else}
							<span class="flex items-center justify-center gap-2">
								<Upload size={16} class="text-[var(--color-coral)]" />
								<span>Upload Till Slip or Invoice PDF/Image</span>
							</span>
						{/if}
					</div>
					<input type="file" accept="image/*,.pdf" class="hidden" onchange={handleReceiptUpload} />
				</label>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							onsuccess?.();
							onclose();
						}
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="rawOcrData" value={expRawOcrData} />

				<div>
					<label
						for="exp-vendor-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Vendor / Merchant Name *
					</label>
					<input
						id="exp-vendor-input"
						name="vendor"
						type="text"
						required
						bind:value={expVendor}
						placeholder="e.g. Woolworths, Shell, Checkers"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label
							for="exp-amount-rand"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Amount (ZAR R) *
						</label>
						<input
							id="exp-amount-rand"
							name="amount"
							type="number"
							step="0.01"
							required
							bind:value={expAmountRand}
							placeholder="450.00"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="exp-category-select"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Category
						</label>
						<select
							id="exp-category-select"
							name="category"
							bind:value={expCategory}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white capitalize focus:outline-hidden"
						>
							{#each categories as cat (cat.id || cat.slug)}
								<option value={cat.slug}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label
						for="exp-date-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Purchase Date *
					</label>
					<input
						id="exp-date-input"
						name="date"
						type="date"
						required
						bind:value={expDate}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="exp-notes-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Notes / Line Items
					</label>
					<textarea
						id="exp-notes-input"
						name="notes"
						bind:value={expNotes}
						rows="2"
						placeholder="Optional notes or items purchased"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					></textarea>
				</div>

				<div
					class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-3"
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
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
					>
						Save Expense
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
