<script lang="ts">
	import { enhance } from '$app/forms';
	import { Sparkles, X, Upload, Check, RefreshCw, FileCheck } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils';
	import type { Asset, ParsedOcrResult } from '$lib/types';

	interface Props {
		isOpen: boolean;
		asset: Asset;
		initialScan?: boolean;
		onclose: () => void;
		onsuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		asset,
		initialScan = false,
		onclose,
		onsuccess
	}: Props = $props();

	let isScanning = $state(false);
	let scanCompleted = $state(false);
	let invoiceFileName = $state('');

	let actTitle = $state('');
	let actCategory = $state('maintenance');
	let actCostRand = $state<number | null>(null);
	let actVendor = $state('');
	let actDate = $state(new Date().toISOString().split('T')[0]);
	let actMileageKm = $state<number | null>(null);
	let actNotes = $state('');

	$effect(() => {
		if (isOpen) {
			actTitle = '';
			actCategory = 'maintenance';
			actCostRand = null;
			actVendor = '';
			actDate = new Date().toISOString().split('T')[0];
			actMileageKm = asset.currentKm || null;
			actNotes = '';
			scanCompleted = false;
			isScanning = initialScan;
			invoiceFileName = '';
		}
	});

	async function handleInvoiceUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isScanning = true;
		scanCompleted = false;
		invoiceFileName = file.name;

		let rawText = '';
		try {
			const { extractTextFromImageFile } = await import('$lib/ocr-client');
			rawText = await extractTextFromImageFile(file);
		} catch (ocrErr) {
			console.warn('Client OCR notice:', ocrErr);
		}

		const body = new FormData();
		body.append('file', file);
		body.append('documentType', 'service_invoice');
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
				if (data.parsedData.activityTitle) {
					actTitle = data.parsedData.activityTitle;
				} else if (data.parsedData.notes) {
					actTitle = data.parsedData.notes.substring(0, 50);
				} else if (data.parsedData.vendor) {
					actTitle = `${data.parsedData.vendor} Service`;
				}

				if (data.parsedData.activityCategory) {
					actCategory = data.parsedData.activityCategory;
				}

				if (data.parsedData.vendor) {
					actVendor = data.parsedData.vendor;
				}

				if (data.parsedData.amountCents) {
					actCostRand = data.parsedData.amountCents / 100;
				}

				if (data.parsedData.date) {
					actDate = data.parsedData.date;
				}

				if (data.parsedData.purchaseKm) {
					actMileageKm = data.parsedData.purchaseKm;
				}

				if (data.parsedData.notes) {
					actNotes = data.parsedData.notes;
				}

				scanCompleted = true;
			}
		} catch (err) {
			console.error('Service invoice scan error:', err);
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
					<h2 class="font-serif text-xl font-bold text-white">Log Work Done / Service Invoice</h2>
				</div>
				<button
					onclick={onclose}
					class="text-[var(--color-text-muted)] hover:text-white"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Invoice Auto-Scan Dropzone -->
			<div
				class="sharp-corners space-y-3 border border-dashed border-[var(--color-coral)] bg-[var(--color-dark-card)] p-4"
			>
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1.5 text-xs font-bold text-white">
						<Upload size={14} class="text-[var(--color-coral)]" />
						<span>Upload Service / Workshop Invoice (AI Auto-Scan)</span>
					</span>
					{#if scanCompleted}
						<span
							class="sharp-corners flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
						>
							<Check size={12} />
							AI Auto-Extracted!
						</span>
					{/if}
				</div>

				<label class="block cursor-pointer">
					<div
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-4 py-3.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[var(--color-dark-border)]"
					>
						{#if isScanning}
							<span
								class="flex animate-pulse items-center justify-center gap-2 text-[var(--color-coral)]"
							>
								<RefreshCw size={16} class="animate-spin" />
								<span>Extracting Activity, Cost, Workshop, Date & Mileage...</span>
							</span>
						{:else if scanCompleted}
							<span class="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
								<FileCheck size={16} />
								<span>{invoiceFileName} (Click to re-upload new file)</span>
							</span>
						{:else}
							<span class="flex items-center justify-center gap-2">
								<Upload size={16} class="text-[var(--color-coral)]" />
								<span>Choose Invoice PDF or Image (e.g. Tiger Wheel, Service Job Card)</span>
							</span>
						{/if}
					</div>
					<input type="file" accept="image/*,.pdf" class="hidden" onchange={handleInvoiceUpload} />
				</label>

				{#if scanCompleted}
					<div
						class="sharp-corners flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400"
					>
						<Check size={16} class="shrink-0" />
						<div>
							<p class="font-bold">Invoice Auto-Scanned Successfully!</p>
							<p class="text-[11px] text-emerald-300">
								Activity: {actTitle} • Workshop: {actVendor || 'N/A'} • Cost: {actCostRand
									? formatCurrency(Math.round(actCostRand * 100))
									: 'N/A'}
								{actMileageKm ? `• Mileage: ${actMileageKm.toLocaleString()} km` : ''}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<form
				method="POST"
				action="?/addActivity"
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
				<div>
					<label
						for="act-title-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Activity Title / Work Done *
					</label>
					<input
						id="act-title-input"
						name="title"
						type="text"
						required
						bind:value={actTitle}
						placeholder="e.g. Installed 4 New Tyres & Alignment, 60,000km Major Service"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label
							for="act-category-select"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Category
						</label>
						<select
							id="act-category-select"
							name="category"
							bind:value={actCategory}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white capitalize focus:outline-hidden"
						>
							<option value="maintenance">Maintenance</option>
							<option value="upgrade">Upgrade</option>
							<option value="repair">Repair</option>
							<option value="renovation">Renovation</option>
							<option value="tax_insurance">Tax / Insurance</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label
							for="act-cost-rand"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Cost (ZAR R) *
						</label>
						<input
							id="act-cost-rand"
							name="costRand"
							type="number"
							step="0.01"
							required
							bind:value={actCostRand}
							placeholder="8450.00"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label
							for="act-vendor-input"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Vendor / Workshop / Contractor
						</label>
						<input
							id="act-vendor-input"
							name="vendor"
							type="text"
							bind:value={actVendor}
							placeholder="e.g. Tiger Wheel & Tyre, Bosch Service"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="act-date-input"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Date Work Performed *
						</label>
						<input
							id="act-date-input"
							name="date"
							type="date"
							required
							bind:value={actDate}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				{#if asset.type === 'vehicle'}
					<div>
						<label
							for="act-mileage-km"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Vehicle Mileage at Time (km)
						</label>
						<input
							id="act-mileage-km"
							name="mileageKm"
							type="number"
							bind:value={actMileageKm}
							placeholder="64200"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				{/if}

				<div>
					<label
						for="act-notes-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Work Description / Invoice Notes
					</label>
					<textarea
						id="act-notes-input"
						name="notes"
						bind:value={actNotes}
						rows="3"
						placeholder="e.g. Replaced 4x Continental SportContact Tyres with Computerized 3D Wheel Balancing and Front & Rear Alignment."
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
						Save Activity
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
