<script lang="ts">
	import {
		Tag,
		Plus,
		Trash2,
		Edit3,
		Check,
		X,
		Sliders,
		Database,
		RefreshCw,
		Users,
		CreditCard,
		Building2,
		Globe,
		Bell,
		Save,
		FolderKanban,
		Paperclip
	} from '@lucide/svelte';
	import type { ExpenseCategory, Company, CompanyDocument, CompanyType } from '$lib/types';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	interface PageData {
		categories: ExpenseCategory[];
		companies?: Company[];
	}

	let { data }: { data: PageData } = $props();

	// Tab State: General Settings vs Master Data
	let activeTab = $state<'general' | 'master-data'>('general');

	// Master Data Selected Dataset
	let selectedMasterDataset = $state<string>('expense-categories');

	// Master Data Categories State
	let addedCategories = $state<ExpenseCategory[]>([]);
	let updatedCategories = new SvelteMap<string, ExpenseCategory>();
	let deletedCategoryIds = new SvelteSet<string>();

	let categoriesList = $derived(
		[...addedCategories, ...(data.categories || [])]
			.filter((c) => !deletedCategoryIds.has(c.id))
			.map((c) => updatedCategories.get(c.id) || c)
	);

	// Master Data Companies State
	let addedCompanies = $state<Company[]>([]);
	let updatedCompaniesMap = new SvelteMap<string, Company>();
	let deletedCompanyIds = new SvelteSet<string>();

	let companiesList = $derived(
		[...addedCompanies, ...(data.companies || [])]
			.filter((c) => !deletedCompanyIds.has(c.id))
			.map((c) => updatedCompaniesMap.get(c.id) || c)
	);

	// Category Modal State
	let isCategoryModalOpen = $state(false);
	let isEditingCategory = $state(false);
	let editingCategoryId = $state<string | null>(null);

	let formCatName = $state('');
	let formCatKeywords = $state('');
	let formCatColor = $state('coral');
	let formCatIcon = $state('Tag');
	let isSavingCategory = $state(false);

	// Company Modal State
	let isCompanyModalOpen = $state(false);
	let isEditingCompany = $state(false);
	let editingCompanyId = $state<string | null>(null);

	let compName = $state('');
	let compRegNumber = $state('');
	let compTaxNumber = $state('');
	let compType = $state<CompanyType>('subsidiary');
	let compAddress = $state('');
	let compEmail = $state('');
	let compPhone = $state('');
	let compOwnership = $state('');
	let compLogoUrl = $state('');
	let logoUploadError = $state<string | null>(null);
	let isUploadingLogo = $state(false);
	let isSavingCompany = $state(false);

	// Company Document Modal State
	let isDocumentModalOpen = $state(false);
	let documentCompanyId = $state<string | null>(null);
	let docTitle = $state('');
	let docType = $state('registration');
	let docFileUrl = $state('');
	let isSavingDoc = $state(false);

	let statusMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// General Settings Form State
	let generalHouseholdName = $state('Family Household');
	let generalCurrency = $state('ZAR');
	let generalDateFormat = $state('YYYY-MM-DD');
	let generalAutoCategorize = $state(true);
	let generalNotifications = $state(true);
	let isSavingGeneral = $state(false);

	const availableColors = [
		{ label: 'Coral', value: 'coral', bg: 'bg-[var(--color-coral)]' },
		{ label: 'Teal', value: 'teal', bg: 'bg-[var(--color-badge-teal)]' },
		{ label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
		{ label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
		{ label: 'Blue', value: 'blue', bg: 'bg-blue-500' },
		{ label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
		{ label: 'Rose', value: 'rose', bg: 'bg-rose-500' }
	];

	const masterDatasets = [
		{
			id: 'expense-categories',
			name: 'Expense Categories',
			description: 'Categories for auto-categorizing receipts and transaction outlays.',
			icon: Tag,
			active: true,
			countLabel: 'Dataset #1 (Active)'
		},
		{
			id: 'companies-holdings',
			name: 'Companies & Holdings',
			description: 'Holding companies, subsidiaries, ownership details & legal documents.',
			icon: Building2,
			active: true,
			countLabel: 'Dataset #2 (Active)'
		},
		{
			id: 'household-members',
			name: 'Household Members',
			description: 'Family members and dependents for expense allocation.',
			icon: Users,
			active: false,
			countLabel: 'Planned'
		},
		{
			id: 'payment-methods',
			name: 'Payment Methods',
			description: 'Credit cards, bank accounts, and cash wallets.',
			icon: CreditCard,
			active: false,
			countLabel: 'Planned'
		}
	];

	function openNewCategoryModal() {
		isEditingCategory = false;
		editingCategoryId = null;
		formCatName = '';
		formCatKeywords = '';
		formCatColor = 'coral';
		formCatIcon = 'Tag';
		isCategoryModalOpen = true;
	}

	function openEditCategoryModal(cat: ExpenseCategory) {
		isEditingCategory = true;
		editingCategoryId = cat.id;
		formCatName = cat.name;
		formCatKeywords = cat.keywords || '';
		formCatColor = cat.color || 'coral';
		formCatIcon = cat.icon || 'Tag';
		isCategoryModalOpen = true;
	}

	function closeCategoryModal() {
		isCategoryModalOpen = false;
		editingCategoryId = null;
	}

	function openNewCompanyModal() {
		isEditingCompany = false;
		editingCompanyId = null;
		compName = '';
		compRegNumber = '';
		compTaxNumber = '';
		compType = 'subsidiary';
		compAddress = '';
		compEmail = '';
		compPhone = '';
		compOwnership = '';
		compLogoUrl = '';
		logoUploadError = null;
		isCompanyModalOpen = true;
	}

	function openEditCompanyModal(company: Company) {
		isEditingCompany = true;
		editingCompanyId = company.id;
		compName = company.name;
		compRegNumber = company.regNumber || '';
		compTaxNumber = company.taxNumber || '';
		compType = company.companyType || 'subsidiary';
		compAddress = company.address || '';
		compEmail = company.email || '';
		compPhone = company.phone || '';
		compOwnership = company.ownershipDetails || '';
		compLogoUrl = company.logoUrl || '';
		logoUploadError = null;
		isCompanyModalOpen = true;
	}

	function closeCompanyModal() {
		isCompanyModalOpen = false;
		editingCompanyId = null;
		logoUploadError = null;
	}

	async function handleLogoFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		logoUploadError = null;

		// Validate format (JPG and PNG only)
		const ext = file.name.split('.').pop()?.toLowerCase();
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		const validExts = ['jpg', 'jpeg', 'png'];

		if (!validTypes.includes(file.type) && (!ext || !validExts.includes(ext))) {
			logoUploadError =
				'Invalid image format. Only JPG (.jpg, .jpeg) and PNG (.png) files are supported.';
			target.value = '';
			return;
		}

		// Upload to Cloudflare Storage Bucket (R2) API
		isUploadingLogo = true;
		try {
			const formData = new FormData();
			formData.append('logo', file);
			if (editingCompanyId) {
				formData.append('companyId', editingCompanyId);
			}

			const res = await fetch('/api/companies/upload-logo', {
				method: 'POST',
				body: formData
			});

			const result = (await res.json()) as { success?: boolean; logoUrl?: string; error?: string };
			if (result.success && result.logoUrl) {
				compLogoUrl = result.logoUrl;
				statusMessage = {
					type: 'success',
					text: 'Company logo uploaded and saved to Cloudflare Storage Bucket.'
				};
			} else {
				logoUploadError = result.error || 'Failed to upload logo to Cloudflare Storage Bucket.';
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Upload failed';
			logoUploadError = msg;
		} finally {
			isUploadingLogo = false;
		}
	}

	function openNewDocumentModal(companyId: string) {
		documentCompanyId = companyId;
		docTitle = '';
		docType = 'registration';
		docFileUrl = '';
		isDocumentModalOpen = true;
	}

	function closeDocumentModal() {
		isDocumentModalOpen = false;
		documentCompanyId = null;
	}

	async function handleSaveGeneralSettings(e: SubmitEvent) {
		e.preventDefault();
		isSavingGeneral = true;
		statusMessage = null;

		await new Promise((resolve) => setTimeout(resolve, 300));
		isSavingGeneral = false;
		statusMessage = { type: 'success', text: 'General settings updated successfully.' };
	}

	async function handleSaveCategory(e: SubmitEvent) {
		e.preventDefault();
		if (!formCatName.trim()) return;

		isSavingCategory = true;
		statusMessage = null;

		try {
			if (isEditingCategory && editingCategoryId) {
				const res = await fetch('/api/categories', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: editingCategoryId,
						name: formCatName.trim(),
						keywords: formCatKeywords.trim(),
						color: formCatColor,
						icon: formCatIcon
					})
				});

				const result = (await res.json()) as {
					success?: boolean;
					category?: ExpenseCategory;
					error?: string;
				};
				if (result.success && result.category) {
					const updatedMap = new SvelteMap(updatedCategories);
					updatedMap.set(editingCategoryId, result.category);
					updatedCategories = updatedMap;
					statusMessage = {
						type: 'success',
						text: `Category "${formCatName}" updated successfully.`
					};
					closeCategoryModal();
				} else {
					statusMessage = { type: 'error', text: result.error || 'Failed to update category.' };
				}
			} else {
				const res = await fetch('/api/categories', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formCatName.trim(),
						keywords: formCatKeywords.trim(),
						color: formCatColor,
						icon: formCatIcon
					})
				});

				const result = (await res.json()) as {
					success?: boolean;
					category?: ExpenseCategory;
					error?: string;
				};
				if (result.success && result.category) {
					addedCategories = [result.category, ...addedCategories];
					statusMessage = {
						type: 'success',
						text: `Category "${formCatName}" created successfully.`
					};
					closeCategoryModal();
				} else {
					statusMessage = { type: 'error', text: result.error || 'Failed to create category.' };
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Error communicating with server';
			statusMessage = { type: 'error', text: msg };
		} finally {
			isSavingCategory = false;
		}
	}

	async function handleDeleteCategory(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

		try {
			const res = await fetch('/api/categories', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = (await res.json()) as { success?: boolean; error?: string };
			if (result.success) {
				const nextDeleted = new SvelteSet(deletedCategoryIds);
				nextDeleted.add(id);
				deletedCategoryIds = nextDeleted;
				statusMessage = { type: 'success', text: `Category "${name}" removed.` };
			} else {
				statusMessage = { type: 'error', text: result.error || 'Failed to delete category.' };
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Error deleting category';
			statusMessage = { type: 'error', text: msg };
		}
	}

	async function handleSaveCompany(e: SubmitEvent) {
		e.preventDefault();
		if (!compName.trim()) return;

		isSavingCompany = true;
		statusMessage = null;

		try {
			if (isEditingCompany && editingCompanyId) {
				const res = await fetch('/api/companies', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: editingCompanyId,
						name: compName.trim(),
						regNumber: compRegNumber.trim(),
						taxNumber: compTaxNumber.trim(),
						companyType: compType,
						address: compAddress.trim(),
						email: compEmail.trim(),
						phone: compPhone.trim(),
						ownershipDetails: compOwnership.trim(),
						logoUrl: compLogoUrl.trim() || null
					})
				});

				const result = (await res.json()) as { success?: boolean; error?: string };
				if (result.success) {
					const existing = companiesList.find((c) => c.id === editingCompanyId);
					if (existing) {
						const updatedComp: Company = {
							...existing,
							name: compName.trim(),
							regNumber: compRegNumber.trim(),
							taxNumber: compTaxNumber.trim(),
							companyType: compType,
							address: compAddress.trim(),
							email: compEmail.trim(),
							phone: compPhone.trim(),
							ownershipDetails: compOwnership.trim(),
							logoUrl: compLogoUrl.trim() || null
						};
						const updatedMap = new SvelteMap(updatedCompaniesMap);
						updatedMap.set(editingCompanyId, updatedComp);
						updatedCompaniesMap = updatedMap;
					}
					statusMessage = { type: 'success', text: `Company "${compName}" updated successfully.` };
					closeCompanyModal();
				} else {
					statusMessage = { type: 'error', text: result.error || 'Failed to update company.' };
				}
			} else {
				const res = await fetch('/api/companies', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: compName.trim(),
						regNumber: compRegNumber.trim(),
						taxNumber: compTaxNumber.trim(),
						companyType: compType,
						address: compAddress.trim(),
						email: compEmail.trim(),
						phone: compPhone.trim(),
						ownershipDetails: compOwnership.trim(),
						logoUrl: compLogoUrl.trim() || null
					})
				});

				const result = (await res.json()) as {
					success?: boolean;
					company?: Company;
					error?: string;
				};
				if (result.success && result.company) {
					addedCompanies = [result.company, ...addedCompanies];
					statusMessage = { type: 'success', text: `Company "${compName}" created successfully.` };
					closeCompanyModal();
				} else {
					statusMessage = { type: 'error', text: result.error || 'Failed to create company.' };
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Error communicating with server';
			statusMessage = { type: 'error', text: msg };
		} finally {
			isSavingCompany = false;
		}
	}

	async function handleDeleteCompany(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete company record "${name}"?`)) return;

		try {
			const res = await fetch('/api/companies', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = (await res.json()) as { success?: boolean; error?: string };
			if (result.success) {
				const nextDeleted = new SvelteSet(deletedCompanyIds);
				nextDeleted.add(id);
				deletedCompanyIds = nextDeleted;
				statusMessage = { type: 'success', text: `Company record "${name}" removed.` };
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSaveDocument(e: SubmitEvent) {
		e.preventDefault();
		if (!documentCompanyId || !docTitle.trim()) return;

		isSavingDoc = true;
		try {
			const res = await fetch('/api/companies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'addDocument',
					companyId: documentCompanyId,
					title: docTitle.trim(),
					documentType: docType,
					fileUrl: docFileUrl.trim() || '/documents/sample-company-doc.pdf'
				})
			});

			const result = (await res.json()) as { success?: boolean; document?: CompanyDocument };
			if (result.success && result.document) {
				const targetCompany = companiesList.find((c) => c.id === documentCompanyId);
				if (targetCompany) {
					const updatedCompany: Company = {
						...targetCompany,
						documents: [...(targetCompany.documents || []), result.document]
					};
					const updatedMap = new SvelteMap(updatedCompaniesMap);
					updatedMap.set(documentCompanyId, updatedCompany);
					updatedCompaniesMap = updatedMap;
				}
				statusMessage = { type: 'success', text: `Document "${docTitle}" attached successfully.` };
				closeDocumentModal();
			}
		} catch (err) {
			console.error(err);
		} finally {
			isSavingDoc = false;
		}
	}
</script>

<div class="space-y-8">
	<!-- Page Header -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span
					class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
				>
					System Configuration
				</span>
			</div>
			<h1 class="font-serif text-3xl font-bold text-white md:text-4xl">Application Settings</h1>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Manage system configuration, general household defaults, and standardized master data sets.
			</p>
		</div>
	</div>

	<!-- Status Notification -->
	{#if statusMessage}
		<div
			class="sharp-corners flex items-center justify-between border p-4 text-sm font-semibold {statusMessage.type ===
			'success'
				? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
				: 'border-rose-500/50 bg-rose-950/40 text-rose-300'}"
		>
			<span>{statusMessage.text}</span>
			<button
				onclick={() => (statusMessage = null)}
				class="cursor-pointer text-white hover:opacity-80"
			>
				<X size={16} />
			</button>
		</div>
	{/if}

	<!-- Main Navigation Tabs -->
	<div class="flex items-center gap-2 border-b border-[var(--color-dark-border)] pb-2">
		<button
			onclick={() => (activeTab = 'general')}
			class="sharp-corners flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
			'general'
				? 'bg-[var(--color-coral)] text-white'
				: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
		>
			<Sliders size={16} />
			<span>General Settings</span>
		</button>

		<button
			onclick={() => (activeTab = 'master-data')}
			class="sharp-corners flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
			'master-data'
				? 'bg-[var(--color-coral)] text-white'
				: 'bg-[var(--color-dark-card)] text-[var(--color-text-muted)] hover:text-white'}"
		>
			<Database size={16} />
			<span>Master Data</span>
		</button>
	</div>

	{#if activeTab === 'general'}
		<!-- General Settings Section -->
		<div class="space-y-6">
			<form onsubmit={handleSaveGeneralSettings} class="space-y-6">
				<div
					class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
				>
					<div class="border-b border-[var(--color-dark-border)] pb-3">
						<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
							<Sliders class="text-[var(--color-coral)]" size={20} />
							<span>General System Preferences</span>
						</h2>
						<p class="mt-1 text-xs text-[var(--color-text-muted)]">
							Configure global defaults for currency, regional formats, and automation toggles.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div
							class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-5"
						>
							<div
								class="flex items-center gap-2 border-b border-[var(--color-dark-border)] pb-2 text-sm font-bold text-white"
							>
								<Globe size={16} class="text-[var(--color-coral)]" />
								<span>Household Configuration</span>
							</div>

							<div>
								<label
									for="gen-hname"
									class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
								>
									Household Name
								</label>
								<input
									id="gen-hname"
									type="text"
									bind:value={generalHouseholdName}
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
								/>
							</div>

							<div>
								<label
									for="gen-currency"
									class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
								>
									Primary Currency
								</label>
								<select
									id="gen-currency"
									bind:value={generalCurrency}
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
								>
									<option value="ZAR">South African Rand (ZAR - R)</option>
									<option value="USD">US Dollar (USD - $)</option>
									<option value="EUR">Euro (EUR - €)</option>
								</select>
							</div>

							<div>
								<label
									for="gen-dateformat"
									class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
								>
									Date Format
								</label>
								<select
									id="gen-dateformat"
									bind:value={generalDateFormat}
									class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
								>
									<option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
									<option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
								</select>
							</div>
						</div>

						<div
							class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-5"
						>
							<div
								class="flex items-center gap-2 border-b border-[var(--color-dark-border)] pb-2 text-sm font-bold text-white"
							>
								<Bell size={16} class="text-[var(--color-badge-teal)]" />
								<span>Automation & Application Behavior</span>
							</div>

							<div class="space-y-3">
								<label
									class="sharp-corners flex cursor-pointer items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2.5"
								>
									<div>
										<span class="block text-xs font-bold text-white">Auto-Categorize Receipts</span>
										<span class="block text-[11px] text-[var(--color-text-subtle)]"
											>Match scanned items against master category keywords</span
										>
									</div>
									<input
										type="checkbox"
										bind:checked={generalAutoCategorize}
										class="sharp-corners h-4 w-4 accent-[var(--color-coral)]"
									/>
								</label>

								<label
									class="sharp-corners flex cursor-pointer items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2.5"
								>
									<div>
										<span class="block text-xs font-bold text-white">Weekly Summary Digest</span>
										<span class="block text-[11px] text-[var(--color-text-subtle)]"
											>Send household spending summaries via notifications</span
										>
									</div>
									<input
										type="checkbox"
										bind:checked={generalNotifications}
										class="sharp-corners h-4 w-4 accent-[var(--color-coral)]"
									/>
								</label>
							</div>
						</div>
					</div>

					<div
						class="flex items-center justify-end border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="submit"
							disabled={isSavingGeneral}
							class="sharp-corners flex cursor-pointer items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
						>
							{#if isSavingGeneral}
								<RefreshCw size={16} class="animate-spin" />
								<span>Saving Settings...</span>
							{:else}
								<Save size={16} />
								<span>Save General Settings</span>
							{/if}
						</button>
					</div>
				</div>
			</form>
		</div>
	{:else if activeTab === 'master-data'}
		<!-- Master Data Section -->
		<div class="space-y-6">
			<div
				class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
			>
				<div
					class="flex flex-col justify-between gap-2 border-b border-[var(--color-dark-border)] pb-3 sm:flex-row sm:items-center"
				>
					<div>
						<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
							<Database class="text-[var(--color-coral)]" size={20} />
							<span>Master Datasets Repository</span>
						</h2>
						<p class="mt-1 text-xs text-[var(--color-text-muted)]">
							Select a standardized master data set to configure entries, ownership details, and
							rules across the platform.
						</p>
					</div>
					<span
						class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-2.5 py-1 text-xs font-bold text-[var(--color-coral)]"
					>
						2 of {masterDatasets.length} Datasets Active
					</span>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
					{#each masterDatasets as ds (ds.id)}
						{@const IconComp = ds.icon}
						<button
							type="button"
							onclick={() => (selectedMasterDataset = ds.id)}
							class="sharp-corners flex cursor-pointer flex-col justify-between space-y-3 border p-4 text-left transition-all {selectedMasterDataset ===
							ds.id
								? 'border-[var(--color-coral)] bg-[var(--color-dark-card)] ring-1 ring-[var(--color-coral)]'
								: 'border-[var(--color-dark-border)] bg-[var(--color-dark-card)]/60 hover:border-[var(--color-text-muted)]'}"
						>
							<div class="flex items-center justify-between">
								<div
									class="sharp-corners flex h-8 w-8 items-center justify-center {selectedMasterDataset ===
									ds.id
										? 'bg-[var(--color-coral)] text-white'
										: 'bg-[var(--color-dark-surface)] text-[var(--color-text-muted)]'}"
								>
									<IconComp size={18} />
								</div>
								<span
									class="sharp-corners px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase {ds.active
										? 'bg-emerald-500/20 text-emerald-400'
										: 'bg-amber-500/20 text-amber-400'}"
								>
									{ds.countLabel}
								</span>
							</div>
							<div>
								<h3 class="text-sm font-bold text-white">{ds.name}</h3>
								<p class="mt-0.5 text-[11px] leading-snug text-[var(--color-text-muted)]">
									{ds.description}
								</p>
							</div>
						</button>
					{/each}
				</div>
			</div>

			{#if selectedMasterDataset === 'expense-categories'}
				<!-- Expense Categories Dataset -->
				<div
					class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
				>
					<div
						class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
					>
						<div>
							<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
								<Tag class="text-[var(--color-coral)]" size={20} />
								<span>Master Data: Expense Categories ({categoriesList.length})</span>
							</h2>
							<p class="mt-1 text-xs text-[var(--color-text-muted)]">
								Standard categories used for expense tracking, receipt auto-categorization, and
								budget analytics.
							</p>
						</div>
						<button
							onclick={openNewCategoryModal}
							class="sharp-corners flex cursor-pointer items-center gap-1.5 bg-[var(--color-coral)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
						>
							<Plus size={16} />
							<span>Add Expense Category</span>
						</button>
					</div>

					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-left">
							<thead>
								<tr
									class="border-b border-[var(--color-dark-border)] bg-[var(--color-dark-card)] text-[10px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase"
								>
									<th class="p-3">Category Name & Code</th>
									<th class="p-3">Auto-Categorization Keywords</th>
									<th class="p-3 text-center">Type</th>
									<th class="p-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--color-dark-border)] text-sm">
								{#each categoriesList as cat (cat.id)}
									<tr class="transition-colors hover:bg-[var(--color-dark-card)]">
										<td class="p-3">
											<div class="flex items-center gap-2.5">
												<span
													class="sharp-corners h-3 w-3 shrink-0 {cat.color === 'emerald'
														? 'bg-emerald-500'
														: cat.color === 'amber'
															? 'bg-amber-500'
															: cat.color === 'blue'
																? 'bg-blue-500'
																: cat.color === 'purple'
																	? 'bg-purple-500'
																	: cat.color === 'rose'
																		? 'bg-rose-500'
																		: cat.color === 'teal'
																			? 'bg-[var(--color-badge-teal)]'
																			: 'bg-[var(--color-coral)]'}"
												></span>
												<div>
													<span class="text-sm font-bold text-white">{cat.name}</span>
													<span class="block font-mono text-[11px] text-[var(--color-text-subtle)]"
														>slug: {cat.slug}</span
													>
												</div>
											</div>
										</td>

										<td class="p-3">
											{#if cat.keywords}
												<div class="flex max-w-lg flex-wrap gap-1">
													{#each cat.keywords.split(',') as kw (kw)}
														{#if kw.trim()}
															<span
																class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]"
															>
																{kw.trim()}
															</span>
														{/if}
													{/each}
												</div>
											{:else}
												<span class="text-xs text-[var(--color-text-subtle)] italic"
													>No keywords configured</span
												>
											{/if}
										</td>

										<td class="p-3 text-center">
											{#if cat.isDefault}
												<span
													class="sharp-corners bg-[var(--color-badge-teal)]/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-badge-teal)] uppercase"
												>
													System Default
												</span>
											{:else}
												<span
													class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
												>
													Custom User
												</span>
											{/if}
										</td>

										<td class="p-3 text-right">
											<div class="flex items-center justify-end gap-2">
												<button
													onclick={() => openEditCategoryModal(cat)}
													class="sharp-corners flex cursor-pointer items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1.5 text-xs text-white hover:bg-[var(--color-dark-border)]"
												>
													<Edit3 size={14} />
													<span class="hidden sm:inline">Edit</span>
												</button>
												<button
													onclick={() => handleDeleteCategory(cat.id, cat.name)}
													class="sharp-corners flex cursor-pointer items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1.5 text-xs text-red-400 hover:border-red-500/50 hover:bg-red-950/60"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else if selectedMasterDataset === 'companies-holdings'}
				<!-- Companies & Holdings Dataset -->
				<div
					class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
				>
					<div
						class="flex flex-col justify-between gap-3 border-b border-[var(--color-dark-border)] pb-3 sm:flex-row sm:items-center"
					>
						<div>
							<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
								<Building2 class="text-[var(--color-coral)]" size={20} />
								<span>Master Data: Companies & Holdings ({companiesList.length})</span>
							</h2>
							<p class="mt-1 text-xs text-[var(--color-text-muted)]">
								Registered entity records, ownership structures, directors, and attached legal &
								CIPC documents.
							</p>
						</div>
						<button
							onclick={openNewCompanyModal}
							class="sharp-corners flex cursor-pointer items-center gap-1.5 self-start bg-[var(--color-coral)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] sm:self-auto"
						>
							<Plus size={16} />
							<span>Register New Entity</span>
						</button>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each companiesList as company (company.id)}
							<div
								class="sharp-corners flex flex-col justify-between space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-5"
							>
								<div class="space-y-3">
									<div
										class="flex items-start justify-between gap-2 border-b border-[var(--color-dark-border)] pb-2.5"
									>
										<div class="flex items-center gap-3">
											{#if company.logoUrl}
												<div
													class="sharp-corners flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden border border-[var(--color-dark-border)] bg-white p-1"
												>
													<img
														src={company.logoUrl}
														alt={`${company.name} logo`}
														class="max-h-full max-w-full object-contain"
													/>
												</div>
											{/if}
											<div>
												<h3 class="text-base font-bold text-white">{company.name}</h3>
												<div class="mt-1 flex items-center gap-2">
													<span
														class="sharp-corners px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase {company.companyType ===
														'holding'
															? 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
															: company.companyType === 'subsidiary'
																? 'bg-[var(--color-coral-light)] text-[var(--color-coral)]'
																: 'bg-blue-500/20 text-blue-400'}"
													>
														{company.companyType === 'holding'
															? 'Holding Company'
															: company.companyType === 'subsidiary'
																? 'Subsidiary'
																: 'External Client'}
													</span>
												</div>
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-1">
											<button
												onclick={() => openEditCompanyModal(company)}
												class="sharp-corners cursor-pointer border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1.5 text-xs text-white hover:bg-[var(--color-dark-border)]"
												title="Edit Company Details"
											>
												<Edit3 size={14} />
											</button>
											<button
												onclick={() => handleDeleteCompany(company.id, company.name)}
												class="sharp-corners cursor-pointer border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1.5 text-xs text-red-400 hover:bg-red-950/60"
												title="Delete Entity"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>

									<div class="space-y-1.5 font-mono text-xs text-[var(--color-text-muted)]">
										{#if company.regNumber}
											<p>
												<span
													class="font-sans text-[10px] text-[var(--color-text-subtle)] uppercase"
													>CIPC Reg:</span
												>
												{company.regNumber}
											</p>
										{/if}
										{#if company.taxNumber}
											<p>
												<span
													class="font-sans text-[10px] text-[var(--color-text-subtle)] uppercase"
													>Tax / VAT #:</span
												>
												{company.taxNumber}
											</p>
										{/if}
										{#if company.email}
											<p class="truncate">
												<span
													class="font-sans text-[10px] text-[var(--color-text-subtle)] uppercase"
													>Email:</span
												>
												{company.email}
											</p>
										{/if}
										{#if company.phone}
											<p>
												<span
													class="font-sans text-[10px] text-[var(--color-text-subtle)] uppercase"
													>Phone:</span
												>
												{company.phone}
											</p>
										{/if}
									</div>

									{#if company.ownershipDetails}
										<div
											class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2.5 text-xs"
										>
											<span
												class="mb-0.5 block text-[10px] font-bold text-[var(--color-coral)] uppercase"
												>Ownership Structure & Directors</span
											>
											<p class="text-[11px] leading-tight text-white">{company.ownershipDetails}</p>
										</div>
									{/if}
								</div>

								<!-- Documents Section -->
								<div class="space-y-2 border-t border-[var(--color-dark-border)] pt-3">
									<div class="flex items-center justify-between text-xs">
										<span class="flex items-center gap-1 text-[11px] font-bold text-white">
											<Paperclip size={12} class="text-[var(--color-coral)]" />
											<span>Legal Documents ({company.documents?.length || 0})</span>
										</span>
										<button
											onclick={() => openNewDocumentModal(company.id)}
											class="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-[var(--color-coral)] hover:underline"
										>
											<Plus size={10} />
											<span>Attach Doc</span>
										</button>
									</div>

									{#if company.documents && company.documents.length > 0}
										<div class="max-h-24 space-y-1 overflow-y-auto pr-1">
											{#each company.documents as doc (doc.id)}
												<a
													href={doc.fileUrl}
													target="_blank"
													class="sharp-corners block flex items-center justify-between truncate border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1.5 text-[11px] text-white hover:bg-[var(--color-dark-border)]"
												>
													<span class="truncate">{doc.title}</span>
													<span
														class="ml-1 shrink-0 font-mono text-[9px] text-[var(--color-badge-teal)] uppercase"
														>pdf</span
													>
												</a>
											{/each}
										</div>
									{:else}
										<p class="text-[11px] text-[var(--color-text-subtle)] italic">
											No legal documents attached yet.
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div
					class="sharp-corners space-y-3 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-8 text-center"
				>
					<FolderKanban size={36} class="mx-auto text-[var(--color-coral)]" />
					<h3 class="font-serif text-xl font-bold text-white">
						Master Data Set: {masterDatasets.find((d) => d.id === selectedMasterDataset)?.name}
					</h3>
					<p class="mx-auto max-w-md text-xs text-[var(--color-text-muted)]">
						This master dataset schema is being prepared. Expense Categories & Companies/Holdings
						are active as Datasets #1 and #2.
					</p>
					<button
						onclick={() => (selectedMasterDataset = 'expense-categories')}
						class="sharp-corners mt-2 inline-flex cursor-pointer items-center gap-1.5 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-4 py-2 text-xs font-bold text-[var(--color-coral)] hover:bg-[var(--color-dark-border)]"
					>
						<Tag size={14} />
						<span>Switch to Expense Categories Master Data</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Add / Edit Company Modal -->
	{#if isCompanyModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		>
			<div
				class="sharp-corners max-h-[90vh] w-full max-w-xl space-y-6 overflow-y-auto border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
				>
					<div class="flex items-center gap-2">
						<Building2 class="text-[var(--color-coral)]" size={20} />
						<h2 class="font-serif text-xl font-bold text-white">
							{isEditingCompany ? 'Edit Entity Details' : 'Register Master Company Entity'}
						</h2>
					</div>
					<button
						onclick={closeCompanyModal}
						class="cursor-pointer text-[var(--color-text-muted)] hover:text-white"
					>
						<X size={20} />
					</button>
				</div>

				<form onsubmit={handleSaveCompany} class="space-y-4">
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label
								for="comp-name"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Company Name *
							</label>
							<input
								id="comp-name"
								type="text"
								required
								bind:value={compName}
								placeholder="e.g. Apex Holdings (Pty) Ltd"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="comp-type"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Entity Role / Type *
							</label>
							<select
								id="comp-type"
								bind:value={compType}
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							>
								<option value="holding">Holding Company</option>
								<option value="subsidiary">Subsidiary / Operating Co</option>
								<option value="client">External Client / Partner</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label
								for="comp-reg"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								CIPC Registration Number
							</label>
							<input
								id="comp-reg"
								type="text"
								bind:value={compRegNumber}
								placeholder="2021/123456/07"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="comp-tax"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								SARS Tax / VAT Number
							</label>
							<input
								id="comp-tax"
								type="text"
								bind:value={compTaxNumber}
								placeholder="9182736450"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<label
								for="comp-email"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Contact Email
							</label>
							<input
								id="comp-email"
								type="email"
								bind:value={compEmail}
								placeholder="accounts@company.co.za"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="comp-phone"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Phone Number
							</label>
							<input
								id="comp-phone"
								type="text"
								bind:value={compPhone}
								placeholder="+27 11 555 0199"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div>
						<label
							for="comp-address"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Registered Address
						</label>
						<input
							id="comp-address"
							type="text"
							bind:value={compAddress}
							placeholder="e.g. 100 Fairtree Plaza, Sandton, Johannesburg"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<!-- Company Logo Upload Section -->
					<div
						class="sharp-corners space-y-2 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3"
					>
						<div class="flex flex-wrap items-center justify-between gap-1">
							<label
								for="comp-logo-file"
								class="block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Company Logo (JPG / PNG)
							</label>
							<span class="font-mono text-[10px] font-bold text-[var(--color-coral)]">
								Recommended: 300 × 100 px (3:1 aspect ratio)
							</span>
						</div>

						<p class="text-[11px] leading-tight text-[var(--color-text-muted)]">
							Upload an official logo to display on issued tax invoices. Supported formats: <strong
								>JPG (.jpg, .jpeg)</strong
							>
							and <strong>PNG (.png)</strong>. Stored in Cloudflare Storage Bucket (R2).
						</p>

						<div class="flex items-center gap-3 pt-1">
							{#if compLogoUrl}
								<div
									class="sharp-corners relative flex h-12 w-32 shrink-0 items-center justify-center overflow-hidden border border-[var(--color-dark-border)] bg-white p-1"
								>
									<img
										src={compLogoUrl}
										alt="Company Logo Preview"
										class="max-h-full max-w-full object-contain"
									/>
									<button
										type="button"
										onclick={() => (compLogoUrl = '')}
										class="sharp-corners absolute top-0 right-0 cursor-pointer bg-red-600 p-0.5 text-[9px] text-white hover:bg-red-700"
										title="Remove logo"
									>
										<X size={10} />
									</button>
								</div>
							{:else}
								<div
									class="sharp-corners flex h-12 w-32 shrink-0 flex-col items-center justify-center border border-dashed border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] text-[10px] text-[var(--color-text-subtle)]"
								>
									<span>No Logo Selected</span>
									<span class="font-mono text-[8px] text-[var(--color-coral)]">300 × 100 px</span>
								</div>
							{/if}

							<div class="flex-1 space-y-1">
								<input
									type="file"
									id="comp-logo-file"
									accept="image/jpeg,image/jpg,image/png"
									onchange={handleLogoFileSelect}
									class="hidden"
								/>
								<label
									for="comp-logo-file"
									class="sharp-corners inline-flex cursor-pointer items-center gap-1.5 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-dark-border)]"
								>
									{#if isUploadingLogo}
										<RefreshCw size={14} class="animate-spin text-[var(--color-coral)]" />
										<span>Saving to Cloudflare R2...</span>
									{:else}
										<Paperclip size={14} class="text-[var(--color-coral)]" />
										<span>{compLogoUrl ? 'Change Logo (JPG/PNG)' : 'Upload Logo (JPG/PNG)'}</span>
									{/if}
								</label>

								{#if logoUploadError}
									<p class="text-[11px] font-semibold text-red-400">{logoUploadError}</p>
								{/if}
							</div>
						</div>
					</div>

					<div>
						<label
							for="comp-ownership"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Ownership Structure & Director Details
						</label>
						<textarea
							id="comp-ownership"
							rows={3}
							bind:value={compOwnership}
							placeholder="e.g. 100% owned by Family Trust. Directors: J. Doe, S. Smith..."
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						></textarea>
					</div>

					<div
						class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="button"
							onclick={closeCompanyModal}
							class="sharp-corners cursor-pointer bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSavingCompany}
							class="sharp-corners flex cursor-pointer items-center gap-1.5 bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							{#if isSavingCompany}
								<RefreshCw size={14} class="animate-spin" />
								<span>Saving...</span>
							{:else}
								<span>{isEditingCompany ? 'Save Changes' : 'Register Entity'}</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Attach Document Modal -->
	{#if isDocumentModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		>
			<div
				class="sharp-corners w-full max-w-md space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
				>
					<div class="flex items-center gap-2">
						<Paperclip class="text-[var(--color-coral)]" size={20} />
						<h2 class="font-serif text-lg font-bold text-white">Attach Company Document</h2>
					</div>
					<button
						onclick={closeDocumentModal}
						class="cursor-pointer text-[var(--color-text-muted)] hover:text-white"
					>
						<X size={20} />
					</button>
				</div>

				<form onsubmit={handleSaveDocument} class="space-y-4">
					<div>
						<label
							for="doc-title"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Document Title *
						</label>
						<input
							id="doc-title"
							type="text"
							required
							bind:value={docTitle}
							placeholder="e.g. CIPC CoR14.3, Share Register"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="doc-type"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Document Type
						</label>
						<select
							id="doc-type"
							bind:value={docType}
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:outline-hidden"
						>
							<option value="registration">CIPC / Tax Registration</option>
							<option value="ownership">Shareholder / Ownership</option>
							<option value="contract">Agreement / Contract</option>
							<option value="general">General Attachment</option>
						</select>
					</div>

					<div>
						<label
							for="doc-url"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Document File URL / Reference
						</label>
						<input
							id="doc-url"
							type="text"
							bind:value={docFileUrl}
							placeholder="/documents/cipc_certificate.pdf"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div
						class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="button"
							onclick={closeDocumentModal}
							class="sharp-corners cursor-pointer bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSavingDoc}
							class="sharp-corners flex cursor-pointer items-center gap-1.5 bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							{#if isSavingDoc}
								<RefreshCw size={14} class="animate-spin" />
								<span>Attaching...</span>
							{:else}
								<span>Attach Document</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Add / Edit Category Modal -->
	{#if isCategoryModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		>
			<div
				class="sharp-corners w-full max-w-lg space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
				>
					<div class="flex items-center gap-2">
						<Tag class="text-[var(--color-coral)]" size={20} />
						<h2 class="font-serif text-xl font-bold text-white">
							{isEditingCategory ? 'Edit Expense Category' : 'Create Master Category'}
						</h2>
					</div>
					<button
						onclick={closeCategoryModal}
						class="cursor-pointer text-[var(--color-text-muted)] hover:text-white"
					>
						<X size={20} />
					</button>
				</div>

				<form onsubmit={handleSaveCategory} class="space-y-4">
					<div>
						<label
							for="cat-name"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Category Name *
						</label>
						<input
							id="cat-name"
							type="text"
							required
							bind:value={formCatName}
							placeholder="e.g. Pet Care, School Fees, Entertainment"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="cat-keywords"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							OCR Matching Keywords (Comma separated)
						</label>
						<textarea
							id="cat-keywords"
							rows={3}
							bind:value={formCatKeywords}
							placeholder="e.g. veterinary, vet, pet shop, absolute pets, dog food"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-xs text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						></textarea>
					</div>

					<div>
						<span
							class="mb-2 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Color Accent
						</span>
						<div class="flex items-center gap-3">
							{#each availableColors as col (col.value)}
								<button
									type="button"
									onclick={() => (formCatColor = col.value)}
									class="h-7 w-7 {col.bg} sharp-corners flex cursor-pointer items-center justify-center transition-transform {formCatColor ===
									col.value
										? 'scale-110 ring-2 ring-white'
										: 'opacity-70 hover:opacity-100'}"
									title={col.label}
								>
									{#if formCatColor === col.value}
										<Check size={14} class="text-white" />
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<div
						class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-4"
					>
						<button
							type="button"
							onclick={closeCategoryModal}
							class="sharp-corners cursor-pointer bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSavingCategory}
							class="sharp-corners flex cursor-pointer items-center gap-1.5 bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
						>
							{#if isSavingCategory}
								<RefreshCw size={14} class="animate-spin" />
								<span>Saving...</span>
							{:else}
								<span>{isEditingCategory ? 'Save Changes' : 'Create Category'}</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
