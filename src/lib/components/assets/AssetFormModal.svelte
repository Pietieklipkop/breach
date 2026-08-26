<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Car,
		Home as HomeIcon,
		Plus,
		Upload,
		Sparkles,
		X,
		Check,
		TrendingUp,
		Briefcase,
		Landmark,
		Coins,
		Lightbulb,
		Truck,
		Tv,
		Anchor,
		Zap,
		Watch,
		ChevronRight,
		ChevronLeft,
		Lock
	} from '@lucide/svelte';
	import type { ParsedOcrResult } from '$lib/types';

	interface Props {
		isOpen: boolean;
		onclose: () => void;
		onsuccess?: () => void;
	}

	let { isOpen = $bindable(false), onclose, onsuccess }: Props = $props();

	// Multi-step Journey State
	let journeyStep = $state<1 | 2 | 3>(1);
	let selectedAssetTypeId = $state<string>('vehicle');

	// Form Fields
	let formType = $state<'vehicle' | 'home' | 'other'>('vehicle');
	let formName = $state('');
	let formMake = $state('');
	let formModel = $state('');
	let formYearModel = $state<number | null>(new Date().getFullYear());
	let formPurchaseDate = $state(new Date().toISOString().split('T')[0]);
	let formPurchasePriceRand = $state<number | null>(null);
	let formPurchaseKm = $state<number | null>(15000);
	let formCurrentKm = $state<number | null>(32000);
	let formNotes = $state('');

	// OCR Scan State
	let isScanning = $state(false);
	let scanSuccess = $state(false);

	interface AssetTypeOption {
		id: string;
		name: string;
		description: string;
		category: 'good' | 'bad';
		icon: typeof Car;
		enabled: boolean;
		typeKey: 'vehicle' | 'home' | 'other';
	}

	const goodAssetsOptions: AssetTypeOption[] = [
		{
			id: 'house',
			name: 'House / Real Estate',
			description: 'Primary residence, rental property or commercial estate',
			category: 'good',
			icon: HomeIcon,
			enabled: false,
			typeKey: 'home'
		},
		{
			id: 'capital_investment',
			name: 'Capital Investment',
			description: 'Equities, index funds & global stock portfolios',
			category: 'good',
			icon: TrendingUp,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'business_equity',
			name: 'Business Equity',
			description: 'Private company ownership & commercial ventures',
			category: 'good',
			icon: Briefcase,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'bonds_deposits',
			name: 'High-Yield Bonds',
			description: 'Fixed term deposits & government treasury bonds',
			category: 'good',
			icon: Landmark,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'precious_metals',
			name: 'Precious Metals',
			description: 'Physical gold bullion, silver & commodity reserves',
			category: 'good',
			icon: Coins,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'intellectual_property',
			name: 'Intellectual Property',
			description: 'Patents, software copyrights & license royalties',
			category: 'good',
			icon: Lightbulb,
			enabled: false,
			typeKey: 'other'
		}
	];

	const badAssetsOptions: AssetTypeOption[] = [
		{
			id: 'vehicle',
			name: 'Vehicle',
			description: 'Motor vehicles, family cars, SUVs & commercial fleet',
			category: 'bad',
			icon: Car,
			enabled: true,
			typeKey: 'vehicle'
		},
		{
			id: 'trailer',
			name: 'Trailer & Caravan',
			description: 'Utility trailers, camping caravans & heavy haulers',
			category: 'bad',
			icon: Truck,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'electronics',
			name: 'Electronics & Tech',
			description: 'High-end workstations, computing & audio gear',
			category: 'bad',
			icon: Tv,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'boat',
			name: 'Boat & Watercraft',
			description: 'Motorboats, yachts, speedboats & marine equipment',
			category: 'bad',
			icon: Anchor,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'jet_ski',
			name: 'Jet Ski & Power Toys',
			description: 'Personal watercraft, quad bikes & all-terrain vehicles',
			category: 'bad',
			icon: Zap,
			enabled: false,
			typeKey: 'other'
		},
		{
			id: 'luxury_goods',
			name: 'Luxury Goods & Watches',
			description: 'Timepieces, designer goods & high-value collectibles',
			category: 'bad',
			icon: Watch,
			enabled: false,
			typeKey: 'other'
		}
	];

	$effect(() => {
		if (isOpen) {
			journeyStep = 1;
			selectedAssetTypeId = 'vehicle';
			formType = 'vehicle';
			formName = '';
			formMake = '';
			formModel = '';
			formYearModel = 2023;
			formPurchasePriceRand = null;
			formPurchaseKm = null;
			formCurrentKm = null;
			formNotes = '';
			scanSuccess = false;
		}
	});

	function selectAssetType(option: AssetTypeOption) {
		if (!option.enabled) return;
		selectedAssetTypeId = option.id;
		if (option.typeKey === 'vehicle') {
			formType = 'vehicle';
		} else if (option.typeKey === 'home') {
			formType = 'home';
		} else {
			formType = 'other';
		}
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isScanning = true;
		scanSuccess = false;

		let rawText = '';
		try {
			const { extractTextFromImageFile } = await import('$lib/ocr-client');
			rawText = await extractTextFromImageFile(file);
		} catch (ocrErr) {
			console.warn('Client OCR notice:', ocrErr);
		}

		const body = new FormData();
		body.append('file', file);
		body.append('documentType', 'invoice');
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
				if (data.parsedData.make) formMake = data.parsedData.make;
				if (data.parsedData.model) formModel = data.parsedData.model;
				if (data.parsedData.yearModel) formYearModel = data.parsedData.yearModel;
				if (data.parsedData.date) formPurchaseDate = data.parsedData.date;
				if (data.parsedData.amountCents) {
					formPurchasePriceRand = data.parsedData.amountCents / 100;
				}
				if (data.parsedData.purchaseKm) {
					formPurchaseKm = data.parsedData.purchaseKm;
					formCurrentKm = data.parsedData.purchaseKm + 1500;
				}
				if (data.parsedData.notes) {
					formNotes = data.parsedData.notes;
				}
				if (data.parsedData.make || data.parsedData.model) {
					const yr = data.parsedData.yearModel ? ` (${data.parsedData.yearModel})` : '';
					formName =
						`${data.parsedData.make || ''} ${data.parsedData.model || 'Vehicle'}${yr}`.trim();
				} else if (data.parsedData.vendor) {
					formName = `${data.parsedData.vendor} Asset`;
				}

				scanSuccess = true;
			}
		} catch (e) {
			console.error('Scan error:', e);
		} finally {
			isScanning = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-4"
			>
				<div>
					<span
						class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
					>
						Step {journeyStep} of 3
					</span>
					<h2 class="mt-1 font-serif text-2xl font-bold text-white">
						{#if journeyStep === 1}
							Select Asset Classification
						{:else if journeyStep === 2}
							Scan or Upload Purchase Document
						{:else}
							Confirm Asset Details
						{/if}
					</h2>
				</div>
				<button
					onclick={onclose}
					class="text-[var(--color-text-muted)] hover:text-white"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Step 1: Classification -->
			{#if journeyStep === 1}
				<div class="space-y-6">
					<!-- Depreciating / Consumable Assets -->
					<div class="space-y-3">
						<h3 class="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
							Depreciating Assets & Vehicles
						</h3>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{#each badAssetsOptions as opt (opt.id)}
								<button
									type="button"
									disabled={!opt.enabled}
									onclick={() => selectAssetType(opt)}
									class="sharp-corners flex items-start gap-3 border p-3 text-left transition-colors {selectedAssetTypeId ===
									opt.id
										? 'border-[var(--color-coral)] bg-[var(--color-coral-light)]'
										: opt.enabled
											? 'border-[var(--color-dark-border)] bg-[var(--color-dark-card)] hover:border-[var(--color-text-subtle)]'
											: 'cursor-not-allowed border-[var(--color-dark-border)] bg-[var(--color-dark-card)] opacity-50'}"
								>
									<div
										class="sharp-corners flex h-8 w-8 shrink-0 items-center justify-center {selectedAssetTypeId ===
										opt.id
											? 'bg-[var(--color-coral)] text-white'
											: 'bg-[var(--color-dark-surface)] text-[var(--color-coral)]'}"
									>
										<opt.icon size={16} />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-white">{opt.name}</span>
											{#if !opt.enabled}
												<Lock size={12} class="text-[var(--color-text-subtle)]" />
											{/if}
										</div>
										<p class="text-[11px] text-[var(--color-text-muted)]">{opt.description}</p>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Appreciating / Capital Assets -->
					<div class="space-y-3">
						<h3 class="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
							Appreciating & Capital Assets (Coming Soon)
						</h3>
						<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{#each goodAssetsOptions as opt (opt.id)}
								<button
									type="button"
									disabled={!opt.enabled}
									onclick={() => selectAssetType(opt)}
									class="sharp-corners flex items-start gap-3 border p-3 text-left transition-colors {selectedAssetTypeId ===
									opt.id
										? 'border-[var(--color-coral)] bg-[var(--color-coral-light)]'
										: opt.enabled
											? 'border-[var(--color-dark-border)] bg-[var(--color-dark-card)] hover:border-[var(--color-text-subtle)]'
											: 'cursor-not-allowed border-[var(--color-dark-border)] bg-[var(--color-dark-card)] opacity-50'}"
								>
									<div
										class="sharp-corners flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--color-dark-surface)] text-[var(--color-coral)]"
									>
										<opt.icon size={16} />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-white">{opt.name}</span>
											<Lock size={12} class="text-[var(--color-text-subtle)]" />
										</div>
										<p class="text-[11px] text-[var(--color-text-muted)]">{opt.description}</p>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<div class="flex justify-end border-t border-[var(--color-dark-border)] pt-4">
						<button
							type="button"
							onclick={() => (journeyStep = 2)}
							class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							<span>Continue to Document Upload</span>
							<ChevronRight size={14} />
						</button>
					</div>
				</div>

				<!-- Step 2: Auto-Scan or Skip -->
			{:else if journeyStep === 2}
				<div class="space-y-6">
					<div
						class="sharp-corners space-y-4 border border-dashed border-[var(--color-coral)] bg-[var(--color-dark-card)] p-6 text-center"
					>
						<div
							class="sharp-corners mx-auto flex h-12 w-12 items-center justify-center bg-[var(--color-coral-light)] text-[var(--color-coral)]"
						>
							<Sparkles size={24} />
						</div>
						<div>
							<h3 class="text-base font-bold text-white">AI Document Scan (Optional)</h3>
							<p class="mt-1 text-xs text-[var(--color-text-muted)]">
								Upload the vehicle sales agreement, NATIS RC1 registration doc, or invoice. AI will
								auto-populate make, model, purchase price, date, and mileage.
							</p>
						</div>

						<label class="block cursor-pointer">
							<div
								class="sharp-corners mx-auto max-w-sm border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-4 py-3 text-xs font-bold text-white hover:bg-[var(--color-dark-border)]"
							>
								{#if isScanning}
									<span class="flex items-center justify-center gap-2 text-[var(--color-coral)]">
										<Sparkles size={14} class="animate-spin" />
										<span>Extracting Document Data...</span>
									</span>
								{:else if scanSuccess}
									<span class="flex items-center justify-center gap-1.5 text-emerald-400">
										<Check size={14} />
										<span>Document Extracted Successfully!</span>
									</span>
								{:else}
									<span class="flex items-center justify-center gap-2">
										<Upload size={14} class="text-[var(--color-coral)]" />
										<span>Choose Sales Invoice or Registration PDF/Image</span>
									</span>
								{/if}
							</div>
							<input type="file" accept="image/*,.pdf" class="hidden" onchange={handleFileUpload} />
						</label>
					</div>

					<div
						class="flex items-center justify-between border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="button"
							onclick={() => (journeyStep = 1)}
							class="sharp-corners flex items-center gap-1.5 bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
						>
							<ChevronLeft size={14} />
							<span>Back</span>
						</button>

						<button
							type="button"
							onclick={() => (journeyStep = 3)}
							class="sharp-corners flex items-center gap-1.5 bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							<span>{scanSuccess ? 'Review Extracted Fields' : 'Enter Details Manually'}</span>
							<ChevronRight size={14} />
						</button>
					</div>
				</div>

				<!-- Step 3: Final Form -->
			{:else}
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
					<input type="hidden" name="type" value={formType} />

					<div>
						<label
							for="form-name"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Asset Display Name *
						</label>
						<input
							id="form-name"
							name="name"
							type="text"
							required
							bind:value={formName}
							placeholder="e.g. 2022 Kia Carnival 2.2 CRDi"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div>
							<label
								for="form-make"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Make
							</label>
							<input
								id="form-make"
								name="make"
								type="text"
								bind:value={formMake}
								placeholder="e.g. Kia, Toyota"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="form-model"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Model
							</label>
							<input
								id="form-model"
								name="model"
								type="text"
								bind:value={formModel}
								placeholder="e.g. Carnival 2.2 EX+"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="form-year-model"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Year Model
							</label>
							<input
								id="form-year-model"
								name="yearModel"
								type="number"
								bind:value={formYearModel}
								placeholder="2022"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label
								for="form-purchase-price"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Purchase Price (Rand R)
							</label>
							<input
								id="form-purchase-price"
								name="purchasePriceRand"
								type="number"
								step="0.01"
								bind:value={formPurchasePriceRand}
								placeholder="520000.00"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="form-purchase-date"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Purchase Date
							</label>
							<input
								id="form-purchase-date"
								name="purchaseDate"
								type="date"
								bind:value={formPurchaseDate}
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					{#if formType === 'vehicle'}
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label
									for="form-purchase-km"
									class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
								>
									Purchase Odometer (km)
								</label>
								<input
									id="form-purchase-km"
									name="purchaseKm"
									type="number"
									bind:value={formPurchaseKm}
									placeholder="15000"
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
								/>
							</div>

							<div>
								<label
									for="form-current-km"
									class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
								>
									Current Odometer (km)
								</label>
								<input
									id="form-current-km"
									name="currentKm"
									type="number"
									bind:value={formCurrentKm}
									placeholder="32000"
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
								/>
							</div>
						</div>
					{/if}

					<div>
						<label
							for="form-notes"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Asset Notes / VIN / Registration
						</label>
						<textarea
							id="form-notes"
							name="notes"
							bind:value={formNotes}
							rows="2"
							placeholder="VIN: KNANC81BMN... | Engine: D4HEMH..."
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						></textarea>
					</div>

					<div
						class="flex items-center justify-between border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="button"
							onclick={() => (journeyStep = 2)}
							class="sharp-corners flex items-center gap-1.5 bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
						>
							<ChevronLeft size={14} />
							<span>Back</span>
						</button>

						<button
							type="submit"
							class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							<Plus size={14} />
							<span>Save Asset to Household</span>
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}
