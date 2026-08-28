<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import {
		User,
		Home as HomeIcon,
		Check,
		UserPlus,
		Copy,
		Star,
		Bell,
		Plus,
		Link,
		CheckCircle2,
		Users,
		Sliders,
		Tag,
		Building2,
		Trash2,
		Edit3,
		X,
		Paperclip,
		Save,
		Landmark
	} from '@lucide/svelte';
	import type {
		ExpenseCategory,
		Company,
		CompanyDocument,
		CompanyBankAccount,
		CompanyType
	} from '$lib/types';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	interface Props {
		data: {
			user: {
				name: string;
				email: string;
				phone?: string;
			};
			householdsList: Array<{
				memberId: string;
				householdId: string;
				role: string;
				isMain: number;
				householdName: string;
				createdByUserId: string;
			}>;
			activeHouseholdId: string;
			activeHouseholdMembers: Array<{
				id: string;
				name: string;
				email: string;
				role: string;
				isMain: boolean;
				joinedAt: Date | null;
			}>;
			pendingInvites: Array<{
				id: string;
				email: string;
				name: string;
				role: string;
				token: string;
				createdAt: Date;
			}>;
			categories: ExpenseCategory[];
			companies: Company[];
		};
		form?: {
			success?: boolean;
			message?: string;
			inviteToken?: string;
			inviteUrl?: string;
		} | null;
	}

	let { data, form }: Props = $props();

	// Primary Tab Navigation: 'profile' | 'household' | 'settings'
	let initialTab = page.url.searchParams.get('tab') as 'profile' | 'household' | 'settings' | null;
	let activeTab = $state<'profile' | 'household' | 'settings'>(initialTab || 'profile');

	// --- Tab 1: Profile (Personal Details) State ---
	let isSavingProfile = $state(false);

	// --- Tab 2: Household State ---
	let inviteName = $state('');
	let inviteEmail = $state('');
	let inviteRole = $state<'admin' | 'member'>('member');
	let inviteHouseholdId = $derived(
		data.activeHouseholdId || data.householdsList[0]?.householdId || ''
	);
	let copiedToken = $state<string | null>(null);
	let newHouseholdNameInput = $state('');
	let showNewHouseholdModal = $state(false);

	function copyToClipboard(url: string, token: string) {
		navigator.clipboard.writeText(url);
		copiedToken = token;
		setTimeout(() => {
			copiedToken = null;
		}, 3000);
	}

	// --- Tab 3: Settings (Master Data) State ---
	let selectedMasterDataset = $state<'expense-categories' | 'companies-holdings'>(
		'expense-categories'
	);

	// Master Categories State
	let addedCategories = $state<ExpenseCategory[]>([]);
	let updatedCategories = new SvelteMap<string, ExpenseCategory>();
	let deletedCategoryIds = new SvelteSet<string>();

	let categoriesList = $derived(
		[...addedCategories, ...(data.categories || [])]
			.filter((c) => !deletedCategoryIds.has(c.id))
			.map((c) => updatedCategories.get(c.id) || c)
	);

	// Master Companies State
	let addedCompanies = $state<Company[]>([]);
	let updatedCompaniesMap = new SvelteMap<string, Company>();
	let deletedCompanyIds = new SvelteSet<string>();

	let companiesList = $derived(
		[...addedCompanies, ...(data.companies || [])]
			.filter((c) => !deletedCompanyIds.has(c.id))
			.map((c) => updatedCompaniesMap.get(c.id) || c)
	);

	// Category Modal
	let isCategoryModalOpen = $state(false);
	let isEditingCategory = $state(false);
	let editingCategoryId = $state<string | null>(null);
	let formCatName = $state('');
	let formCatKeywords = $state('');
	let formCatColor = $state('coral');
	let formCatIcon = $state('Tag');
	let isSavingCategory = $state(false);

	// Company Modal
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

	// Company Document Modal
	let isDocumentModalOpen = $state(false);
	let documentCompanyId = $state<string | null>(null);
	let docTitle = $state('');
	let docType = $state('registration');
	let docFileUrl = $state('');
	let isSavingDoc = $state(false);

	let masterDataStatus = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	const availableColors = [
		{ label: 'Coral', value: 'coral', bg: 'bg-[var(--color-coral)]' },
		{ label: 'Teal', value: 'teal', bg: 'bg-[var(--color-badge-teal)]' },
		{ label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
		{ label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
		{ label: 'Blue', value: 'blue', bg: 'bg-blue-500' },
		{ label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
		{ label: 'Rose', value: 'rose', bg: 'bg-rose-500' }
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

	async function handleSaveCategory() {
		if (!formCatName.trim()) return;
		isSavingCategory = true;
		masterDataStatus = null;

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
				if (!res.ok || !result.success || !result.category) {
					throw new Error(result.error || 'Failed to update category');
				}

				updatedCategories.set(editingCategoryId, result.category);
				masterDataStatus = {
					type: 'success',
					text: `Category "${result.category.name}" updated successfully!`
				};
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
				if (!res.ok || !result.success || !result.category) {
					throw new Error(result.error || 'Failed to create category');
				}

				addedCategories = [result.category, ...addedCategories];
				masterDataStatus = {
					type: 'success',
					text: `Category "${result.category.name}" created successfully!`
				};
			}

			closeCategoryModal();
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error processing category request'
			};
		} finally {
			isSavingCategory = false;
		}
	}

	async function handleDeleteCategory(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
		masterDataStatus = null;

		try {
			const res = await fetch('/api/categories', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			const result = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok || !result.success) {
				throw new Error(result.error || 'Failed to delete category');
			}

			deletedCategoryIds.add(id);
			masterDataStatus = { type: 'success', text: `Category "${name}" deleted.` };
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error deleting category'
			};
		}
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
		const ext = file.name.split('.').pop()?.toLowerCase();
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
		const validExts = ['jpg', 'jpeg', 'png'];

		if (!validTypes.includes(file.type) && (!ext || !validExts.includes(ext))) {
			logoUploadError =
				'Invalid image format. Only JPG (.jpg, .jpeg) and PNG (.png) files are supported.';
			target.value = '';
			return;
		}

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
			} else {
				throw new Error(result.error || 'Failed to upload logo.');
			}
		} catch (err: unknown) {
			logoUploadError = err instanceof Error ? err.message : 'Error uploading company logo';
		} finally {
			isUploadingLogo = false;
		}
	}

	async function handleSaveCompany() {
		if (!compName.trim()) return;
		isSavingCompany = true;
		masterDataStatus = null;

		const payload = {
			name: compName.trim(),
			regNumber: compRegNumber.trim() || undefined,
			taxNumber: compTaxNumber.trim() || undefined,
			companyType: compType,
			address: compAddress.trim() || undefined,
			email: compEmail.trim() || undefined,
			phone: compPhone.trim() || undefined,
			ownershipDetails: compOwnership.trim() || undefined,
			logoUrl: compLogoUrl || undefined
		};

		try {
			if (isEditingCompany && editingCompanyId) {
				const res = await fetch('/api/companies', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: editingCompanyId, ...payload })
				});

				const result = (await res.json()) as {
					success?: boolean;
					company?: Company;
					error?: string;
				};
				if (!res.ok || !result.success || !result.company) {
					throw new Error(result.error || 'Failed to update company');
				}

				updatedCompaniesMap.set(editingCompanyId, result.company);
				masterDataStatus = {
					type: 'success',
					text: `Company "${result.company.name}" updated successfully!`
				};
			} else {
				const res = await fetch('/api/companies', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});

				const result = (await res.json()) as {
					success?: boolean;
					company?: Company;
					error?: string;
				};
				if (!res.ok || !result.success || !result.company) {
					throw new Error(result.error || 'Failed to create company');
				}

				addedCompanies = [result.company, ...addedCompanies];
				masterDataStatus = {
					type: 'success',
					text: `Company "${result.company.name}" created successfully!`
				};
			}

			closeCompanyModal();
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error processing company request'
			};
		} finally {
			isSavingCompany = false;
		}
	}

	async function handleDeleteCompany(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete company "${name}"?`)) return;
		masterDataStatus = null;

		try {
			const res = await fetch('/api/companies', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			const result = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok || !result.success) {
				throw new Error(result.error || 'Failed to delete company');
			}

			deletedCompanyIds.add(id);
			masterDataStatus = { type: 'success', text: `Company "${name}" deleted.` };
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error deleting company'
			};
		}
	}

	function openAddDocumentModal(companyId: string) {
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

	async function handleSaveDocument() {
		if (!documentCompanyId || !docTitle.trim()) return;
		isSavingDoc = true;
		masterDataStatus = null;

		try {
			const res = await fetch('/api/companies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'addDocument',
					companyId: documentCompanyId,
					title: docTitle.trim(),
					documentType: docType,
					fileUrl: docFileUrl || '/documents/sample-attachment.pdf'
				})
			});

			const result = (await res.json()) as {
				success?: boolean;
				document?: CompanyDocument;
				error?: string;
			};
			if (!res.ok || !result.success || !result.document) {
				throw new Error(result.error || 'Failed to attach document');
			}

			const comp = companiesList.find((c) => c.id === documentCompanyId);
			if (comp) {
				const updated = {
					...comp,
					documents: [...(comp.documents || []), result.document]
				};
				updatedCompaniesMap.set(comp.id, updated);
			}

			masterDataStatus = {
				type: 'success',
				text: `Document "${result.document.title}" attached successfully!`
			};
			closeDocumentModal();
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error attaching document'
			};
		} finally {
			isSavingDoc = false;
		}
	}

	// Company Bank Account Modal State & Handlers
	let isBankAccountModalOpen = $state(false);
	let bankAccountCompanyId = $state<string | null>(null);
	let bankName = $state('FNB');
	let accountAlias = $state('');
	let accountNumber = $state('');
	let bankNotes = $state('');
	let isSavingBankAccount = $state(false);

	function openAddBankAccountModal(companyId: string) {
		bankAccountCompanyId = companyId;
		bankName = 'FNB';
		accountAlias = '';
		accountNumber = '';
		bankNotes = '';
		isBankAccountModalOpen = true;
	}

	function closeBankAccountModal() {
		isBankAccountModalOpen = false;
		bankAccountCompanyId = null;
	}

	async function handleSaveBankAccount() {
		if (!bankAccountCompanyId || !bankName.trim() || !accountAlias.trim()) return;
		isSavingBankAccount = true;
		masterDataStatus = null;

		try {
			const res = await fetch('/api/companies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'addBankAccount',
					companyId: bankAccountCompanyId,
					bankName: bankName.trim(),
					accountAlias: accountAlias.trim(),
					accountNumber: accountNumber.trim() || undefined,
					notes: bankNotes.trim() || undefined
				})
			});

			const result = (await res.json()) as {
				success?: boolean;
				bankAccount?: CompanyBankAccount;
				error?: string;
			};

			if (!res.ok || !result.success || !result.bankAccount) {
				throw new Error(result.error || 'Failed to add bank account');
			}

			const comp = companiesList.find((c) => c.id === bankAccountCompanyId);
			if (comp) {
				const updated = {
					...comp,
					bankAccounts: [...(comp.bankAccounts || []), result.bankAccount]
				};
				updatedCompaniesMap.set(comp.id, updated);
			}

			masterDataStatus = {
				type: 'success',
				text: `Bank account "${result.bankAccount.accountAlias}" added successfully!`
			};
			closeBankAccountModal();
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error adding bank account'
			};
		} finally {
			isSavingBankAccount = false;
		}
	}

	async function handleDeleteBankAccount(companyId: string, bankAccountId: string, alias: string) {
		if (!confirm(`Are you sure you want to delete bank account "${alias}"?`)) return;
		masterDataStatus = null;

		try {
			const res = await fetch('/api/companies', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'deleteBankAccount',
					companyId,
					bankAccountId
				})
			});

			const result = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok || !result.success) {
				throw new Error(result.error || 'Failed to delete bank account');
			}

			const comp = companiesList.find((c) => c.id === companyId);
			if (comp) {
				const updated = {
					...comp,
					bankAccounts: (comp.bankAccounts || []).filter((b) => b.id !== bankAccountId)
				};
				updatedCompaniesMap.set(comp.id, updated);
			}

			masterDataStatus = { type: 'success', text: `Bank account "${alias}" deleted.` };
		} catch (err: unknown) {
			masterDataStatus = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Error deleting bank account'
			};
		}
	}
</script>

<svelte:head>
	<title>Profile & Settings - Breach Platform</title>
</svelte:head>

<div class="max-w-5xl space-y-6">
	<!-- Top Main Header & Tab Navigation Bar -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[var(--color-dark-border)] pb-5 md:flex-row md:items-center"
	>
		<div>
			<div class="mb-1 flex items-center gap-2">
				<span
					class="sharp-corners bg-[var(--color-coral-light)] px-2 py-0.5 text-xs font-semibold tracking-wider text-[var(--color-coral)] uppercase"
				>
					Account Hub
				</span>
			</div>
			<h1 class="font-serif text-2xl font-bold text-white md:text-3xl">
				Profile & System Management
			</h1>
		</div>

		<!-- 3-Tab Selector Switcher -->
		<div
			class="sharp-corners flex items-center border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-1"
		>
			<button
				type="button"
				onclick={() => (activeTab = 'profile')}
				class="sharp-corners flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all {activeTab ===
				'profile'
					? 'bg-[var(--color-coral)] text-white shadow-md'
					: 'text-[var(--color-text-muted)] hover:text-white'}"
			>
				<User size={15} />
				<span>Profile</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'household')}
				class="sharp-corners flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all {activeTab ===
				'household'
					? 'bg-[var(--color-coral)] text-white shadow-md'
					: 'text-[var(--color-text-muted)] hover:text-white'}"
			>
				<HomeIcon size={15} />
				<span>Household</span>
			</button>

			<button
				type="button"
				onclick={() => (activeTab = 'settings')}
				class="sharp-corners flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all {activeTab ===
				'settings'
					? 'bg-[var(--color-coral)] text-white shadow-md'
					: 'text-[var(--color-text-muted)] hover:text-white'}"
			>
				<Sliders size={15} />
				<span>Settings</span>
			</button>
		</div>
	</div>

	<!-- Status Feedback Notifications -->
	{#if form?.message}
		<div
			class="sharp-corners flex items-center gap-2 border p-4 text-xs font-semibold {form.success
				? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
				: 'border-red-500 bg-red-500/20 text-red-400'}"
		>
			<CheckCircle2 size={18} />
			<span>{form.message}</span>
		</div>
	{/if}

	{#if masterDataStatus}
		<div
			class="sharp-corners flex items-center justify-between border p-4 text-xs font-semibold {masterDataStatus.type ===
			'success'
				? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
				: 'border-red-500 bg-red-500/20 text-red-400'}"
		>
			<div class="flex items-center gap-2">
				<CheckCircle2 size={18} />
				<span>{masterDataStatus.text}</span>
			</div>
			<button
				type="button"
				onclick={() => (masterDataStatus = null)}
				class="text-[var(--color-text-muted)] hover:text-white"
			>
				<X size={16} />
			</button>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- TAB 1: PROFILE (PERSONAL DETAILS) -->
	<!-- ========================================================================= -->
	{#if activeTab === 'profile'}
		<div class="space-y-6">
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					isSavingProfile = true;
					return async ({ update }) => {
						isSavingProfile = false;
						await update();
					};
				}}
				class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 md:p-8"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-4"
				>
					<div>
						<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
							<User class="text-[var(--color-coral)]" size={22} />
							<span>Personal Details</span>
						</h2>
						<p class="mt-1 text-xs text-[var(--color-text-muted)]">
							Manage your personal identity, contact email, and phone number.
						</p>
					</div>

					<div
						class="sharp-corners flex h-10 w-10 items-center justify-center bg-[var(--color-coral-light)] text-sm font-bold text-[var(--color-coral)]"
					>
						{data.user?.name ? data.user.name.substring(0, 2).toUpperCase() : 'ME'}
					</div>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div>
						<label
							for="profile-name"
							class="mb-2 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Full Name
						</label>
						<div class="relative">
							<input
								id="profile-name"
								name="name"
								type="text"
								required
								value={data.user?.name || ''}
								placeholder="e.g. John Doe"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2.5 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div>
						<label
							for="profile-email"
							class="mb-2 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Email Address
						</label>
						<div class="relative">
							<input
								id="profile-email"
								name="email"
								type="email"
								required
								value={data.user?.email || ''}
								placeholder="e.g. john@example.com"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2.5 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>

					<div>
						<label
							for="profile-phone"
							class="mb-2 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Phone Number
						</label>
						<div class="relative">
							<input
								id="profile-phone"
								name="phone"
								type="tel"
								value={data.user?.phone || ''}
								placeholder="e.g. +27 82 123 4567"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2.5 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-end border-t border-[var(--color-dark-border)] pt-4">
					<button
						type="submit"
						disabled={isSavingProfile}
						class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						<Save size={15} />
						<span>{isSavingProfile ? 'Saving Changes...' : 'Save Personal Details'}</span>
					</button>
				</div>
			</form>
		</div>

		<!-- ========================================================================= -->
		<!-- TAB 2: HOUSEHOLD (MULTI-HOUSEHOLDS, ADD PERSON & MEMBERS LIST) -->
		<!-- ========================================================================= -->
	{:else if activeTab === 'household'}
		<div class="space-y-8">
			<!-- Section 1: Multi-Household Selector & Main Household Preference -->
			<div
				class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
			>
				<div
					class="flex flex-col justify-between gap-3 border-b border-[var(--color-dark-border)] pb-3 md:flex-row md:items-center"
				>
					<div>
						<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
							<HomeIcon class="text-[var(--color-coral)]" size={20} />
							<span>My Households ({data.householdsList.length})</span>
						</h2>
						<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
							Swap between active household views or star your main household for notifications.
						</p>
					</div>

					<button
						type="button"
						onclick={() => (showNewHouseholdModal = true)}
						class="sharp-corners flex items-center gap-1.5 self-start bg-[var(--color-coral)] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] md:self-auto"
					>
						<Plus size={15} />
						<span>+ Create Household</span>
					</button>
				</div>

				<div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
					{#each data.householdsList as h (h.householdId)}
						{@const isMain = h.isMain === 1}
						{@const isActiveView = data.activeHouseholdId === h.householdId}
						<div
							class="sharp-corners flex h-full flex-col justify-between gap-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-5 {isMain
								? 'border-l-4 border-l-[var(--color-coral)]'
								: ''}"
						>
							<div class="space-y-2">
								<div class="flex items-start justify-between gap-2">
									<div>
										<h3 class="text-base leading-snug font-bold text-white">{h.householdName}</h3>
										<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
											Role: <strong class="font-mono text-[11px] text-white uppercase"
												>{h.role}</strong
											>
										</p>
									</div>

									<div class="flex shrink-0 flex-col items-end gap-1">
										{#if isMain}
											<span
												class="sharp-corners flex items-center gap-1 bg-[var(--color-coral-light)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-coral)] uppercase"
											>
												<Star size={10} class="fill-current" />
												<span>Main Household</span>
											</span>
										{/if}
									</div>
								</div>
							</div>

							<div
								class="flex items-center justify-between gap-2 border-t border-[var(--color-dark-border)] pt-3"
							>
								<!-- Active Household View Switcher -->
								{#if !isActiveView}
									<form method="POST" action="?/switchActiveHousehold" use:enhance class="flex-1">
										<input type="hidden" name="householdId" value={h.householdId} />
										<button
											type="submit"
											class="sharp-corners flex w-full items-center justify-center gap-1.5 bg-[var(--color-coral)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
										>
											<span>Switch to Active View</span>
										</button>
									</form>
								{:else}
									<div
										class="sharp-corners flex items-center gap-1.5 border border-emerald-500 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400"
									>
										<CheckCircle2 size={14} />
										<span>Currently Viewing</span>
									</div>
								{/if}

								<!-- Main Household Notification Toggle -->
								{#if !isMain}
									<form method="POST" action="?/setMainHousehold" use:enhance>
										<input type="hidden" name="householdId" value={h.householdId} />
										<button
											type="submit"
											title="Set as Main Household for notifications"
											class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-coral)] hover:bg-[var(--color-dark-border)] hover:text-white"
										>
											<Bell size={13} class="text-[var(--color-coral)]" />
											<span>Set Main</span>
										</button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Section 2: Add Person / Member to Household Form -->
			<div
				class="sharp-corners space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
			>
				<div class="border-b border-[var(--color-dark-border)] pb-3">
					<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
						<UserPlus class="text-[var(--color-coral)]" size={20} />
						<span>Add Person to Household</span>
					</h2>
					<p class="mt-1 text-xs text-[var(--color-text-muted)]">
						Enter the person's details to generate a registration link they can use to join your
						household.
					</p>
				</div>

				{#if form?.inviteUrl}
					<div
						class="sharp-corners space-y-3 border border-[var(--color-coral)] bg-[var(--color-dark-card)] p-4"
					>
						<div
							class="flex items-center justify-between text-xs font-bold text-[var(--color-coral)]"
						>
							<span class="flex items-center gap-1.5">
								<Link size={16} />
								<span>Invitation Link Generated! Share this link with the new member:</span>
							</span>
							{#if copiedToken === form.inviteToken}
								<span class="flex items-center gap-1 font-mono text-emerald-400">
									<Check size={14} /> Link Copied!
								</span>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<input
								type="text"
								readonly
								value={form.inviteUrl}
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-black/40 px-3 py-2 font-mono text-xs text-white select-all"
							/>
							<button
								type="button"
								onclick={() => copyToClipboard(form?.inviteUrl || '', form?.inviteToken || '')}
								class="sharp-corners flex shrink-0 items-center gap-1.5 bg-[var(--color-coral)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
							>
								<Copy size={14} />
								<span>Copy Link</span>
							</button>
						</div>
					</div>
				{/if}

				<form method="POST" action="?/createInvite" use:enhance class="space-y-4">
					<input type="hidden" name="householdId" value={inviteHouseholdId} />

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label
								for="invite-name"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Member Name
							</label>
							<input
								id="invite-name"
								name="memberName"
								type="text"
								required
								bind:value={inviteName}
								placeholder="e.g. Sarah Jenkins"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="invite-email"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Member Email
							</label>
							<input
								id="invite-email"
								name="memberEmail"
								type="email"
								required
								bind:value={inviteEmail}
								placeholder="sarah@breach.co.za"
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
							/>
						</div>

						<div>
							<label
								for="invite-role"
								class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								Household Role
							</label>
							<select
								id="invite-role"
								name="memberRole"
								bind:value={inviteRole}
								class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white focus:outline-hidden"
							>
								<option value="member">Member (Read & Create Assets)</option>
								<option value="admin">Admin (Full Household Control)</option>
							</select>
						</div>
					</div>

					<div class="flex justify-end pt-2">
						<button
							type="submit"
							class="sharp-corners flex items-center gap-2 bg-[var(--color-coral)] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)]"
						>
							<UserPlus size={16} />
							<span>Generate Registration Link</span>
						</button>
					</div>
				</form>
			</div>

			<!-- Section 3: Current Household Members & Pending Invites List -->
			<div
				class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
			>
				<div
					class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
				>
					<h2 class="flex items-center gap-2 font-serif text-xl font-bold text-white">
						<Users class="text-[var(--color-coral)]" size={20} />
						<span>Current Household Members</span>
					</h2>
					<span class="text-xs text-[var(--color-text-muted)]">
						{data.activeHouseholdMembers.length} Active Members
					</span>
				</div>

				<div class="space-y-2">
					{#each data.activeHouseholdMembers as member (member.id)}
						<div
							class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3.5"
						>
							<div class="flex items-center gap-3">
								<div
									class="sharp-corners flex h-8 w-8 items-center justify-center bg-[var(--color-coral-light)] text-xs font-bold text-[var(--color-coral)]"
								>
									{member.name.substring(0, 2).toUpperCase()}
								</div>
								<div>
									<p class="flex items-center gap-2 text-sm font-bold text-white">
										<span>{member.name}</span>
										{#if member.isMain}
											<span
												class="sharp-corners bg-[var(--color-coral-light)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-coral)] uppercase"
											>
												Main Household
											</span>
										{/if}
									</p>
									<p class="text-xs text-[var(--color-text-muted)]">{member.email}</p>
								</div>
							</div>
							<span
								class="sharp-corners border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase"
							>
								{member.role}
							</span>
						</div>
					{/each}
				</div>

				{#if data.pendingInvites.length > 0}
					<div class="space-y-3 border-t border-[var(--color-dark-border)] pt-4">
						<h3 class="text-xs font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
							Pending Invitations ({data.pendingInvites.length})
						</h3>
						<div class="space-y-2">
							{#each data.pendingInvites as inv (inv.id)}
								{@const invUrl =
									typeof window !== 'undefined'
										? `${window.location.origin}/register?invite=${inv.token}`
										: `/register?invite=${inv.token}`}
								<div
									class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3 text-xs"
								>
									<div>
										<p class="font-bold text-white">{inv.name} ({inv.email})</p>
										<p class="font-mono text-[10px] text-[var(--color-text-subtle)]">
											Token: {inv.token}
										</p>
									</div>
									<button
										type="button"
										onclick={() => copyToClipboard(invUrl, inv.token)}
										class="sharp-corners flex items-center gap-1 bg-[var(--color-dark-border)] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--color-coral)]"
									>
										<Copy size={12} />
										<span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- ========================================================================= -->
		<!-- TAB 3: SETTINGS (MASTER DATA: CATEGORIES & COMPANIES ONLY) -->
		<!-- ========================================================================= -->
	{:else if activeTab === 'settings'}
		<div class="space-y-6">
			<!-- Sub-Navigation for Master Datasets -->
			<div class="flex items-center gap-3 border-b border-[var(--color-dark-border)] pb-3">
				<button
					type="button"
					onclick={() => (selectedMasterDataset = 'expense-categories')}
					class="sharp-corners flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all {selectedMasterDataset ===
					'expense-categories'
						? 'border-b-2 border-[var(--color-coral)] text-white'
						: 'text-[var(--color-text-muted)] hover:text-white'}"
				>
					<Tag size={16} />
					<span>Expense Categories ({categoriesList.length})</span>
				</button>

				<button
					type="button"
					onclick={() => (selectedMasterDataset = 'companies-holdings')}
					class="sharp-corners flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all {selectedMasterDataset ===
					'companies-holdings'
						? 'border-b-2 border-[var(--color-coral)] text-white'
						: 'text-[var(--color-text-muted)] hover:text-white'}"
				>
					<Building2 size={16} />
					<span>Companies & Holdings ({companiesList.length})</span>
				</button>
			</div>

			<!-- Dataset 1: Expense Categories -->
			{#if selectedMasterDataset === 'expense-categories'}
				<div
					class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
				>
					<div
						class="flex flex-col justify-between gap-3 border-b border-[var(--color-dark-border)] pb-3 md:flex-row md:items-center"
					>
						<div>
							<h3 class="font-serif text-lg font-bold text-white">Expense Master Categories</h3>
							<p class="text-xs text-[var(--color-text-muted)]">
								Categories for auto-categorizing receipts and transaction outlays.
							</p>
						</div>

						<button
							type="button"
							onclick={openNewCategoryModal}
							class="sharp-corners flex items-center gap-1.5 self-start bg-[var(--color-coral)] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] md:self-auto"
						>
							<Plus size={15} />
							<span>+ Add Category</span>
						</button>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each categoriesList as cat (cat.id)}
							<div
								class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-3.5 transition-all hover:border-[var(--color-coral)]/40"
							>
								<div class="flex items-center gap-3">
									<div
										class="sharp-corners flex h-8 w-8 items-center justify-center bg-[var(--color-coral-light)] text-xs font-bold text-[var(--color-coral)]"
									>
										<Tag size={14} />
									</div>
									<div>
										<p class="text-xs font-bold text-white">{cat.name}</p>
										<p class="max-w-[140px] truncate text-[10px] text-[var(--color-text-muted)]">
											{cat.keywords || 'No keywords'}
										</p>
									</div>
								</div>

								<div class="flex items-center gap-1">
									<button
										type="button"
										onclick={() => openEditCategoryModal(cat)}
										title="Edit category"
										class="p-1.5 text-[var(--color-text-muted)] hover:text-white"
									>
										<Edit3 size={13} />
									</button>
									<button
										type="button"
										onclick={() => handleDeleteCategory(cat.id, cat.name)}
										title="Delete category"
										class="p-1.5 text-[var(--color-text-muted)] hover:text-red-400"
									>
										<Trash2 size={13} />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Dataset 2: Companies & Holdings -->
			{:else if selectedMasterDataset === 'companies-holdings'}
				<div
					class="sharp-corners space-y-4 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6"
				>
					<div
						class="flex flex-col justify-between gap-3 border-b border-[var(--color-dark-border)] pb-3 md:flex-row md:items-center"
					>
						<div>
							<h3 class="font-serif text-lg font-bold text-white">Companies & Entities</h3>
							<p class="text-xs text-[var(--color-text-muted)]">
								Holding companies, subsidiaries, ownership details & legal documents.
							</p>
						</div>

						<button
							type="button"
							onclick={openNewCompanyModal}
							class="sharp-corners flex items-center gap-1.5 self-start bg-[var(--color-coral)] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-coral-hover)] md:self-auto"
						>
							<Plus size={15} />
							<span>+ Add Company</span>
						</button>
					</div>

					<div class="space-y-3">
						{#if companiesList.length === 0}
							<div
								class="sharp-corners border border-dashed border-[var(--color-dark-border)] p-8 text-center"
							>
								<Building2 size={32} class="mx-auto mb-2 text-[var(--color-text-muted)]" />
								<p class="text-xs font-semibold text-[var(--color-text-muted)]">
									No companies registered yet. Click "+ Add Company" to create your first holding or
									subsidiary.
								</p>
							</div>
						{/if}

						{#each companiesList as comp (comp.id)}
							<div
								class="sharp-corners space-y-3 border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] p-4"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3">
										{#if comp.logoUrl}
											<img
												src={comp.logoUrl}
												alt="{comp.name} Logo"
												class="sharp-corners h-10 w-10 border border-[var(--color-dark-border)] bg-white/5 object-contain p-1"
											/>
										{:else}
											<div
												class="sharp-corners flex h-10 w-10 items-center justify-center bg-[var(--color-coral-light)] text-xs font-bold text-[var(--color-coral)]"
											>
												<Building2 size={18} />
											</div>
										{/if}
										<div>
											<h4 class="text-sm font-bold text-white">{comp.name}</h4>
											<p class="text-xs text-[var(--color-text-muted)]">
												Type: <span class="text-white capitalize">{comp.companyType}</span>
												{#if comp.regNumber}
													• Reg: <span class="font-mono text-white">{comp.regNumber}</span>
												{/if}
											</p>
										</div>
									</div>

									<div class="flex items-center gap-2">
										<button
											type="button"
											onclick={() => openAddBankAccountModal(comp.id)}
											class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-coral)] hover:text-white"
										>
											<Landmark size={12} class="text-[var(--color-coral)]" />
											<span>+ Bank Account</span>
										</button>
										<button
											type="button"
											onclick={() => openAddDocumentModal(comp.id)}
											class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-coral)] hover:text-white"
										>
											<Paperclip size={12} />
											<span>Attach Doc</span>
										</button>
										<button
											type="button"
											onclick={() => openEditCompanyModal(comp)}
											class="p-1.5 text-[var(--color-text-muted)] hover:text-white"
										>
											<Edit3 size={14} />
										</button>
										<button
											type="button"
											onclick={() => handleDeleteCompany(comp.id, comp.name)}
											class="p-1.5 text-[var(--color-text-muted)] hover:text-red-400"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>

								<!-- Bank Accounts List -->
								{#if comp.bankAccounts && comp.bankAccounts.length > 0}
									<div class="space-y-1.5 border-t border-[var(--color-dark-border)] pt-2">
										<span class="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">
											Bank Accounts ({comp.bankAccounts.length}):
										</span>
										<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
											{#each comp.bankAccounts as bank (bank.id)}
												<div
													class="sharp-corners flex items-center justify-between border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2.5 text-xs"
												>
													<div class="flex items-center gap-2">
														<Landmark size={14} class="shrink-0 text-[var(--color-coral)]" />
														<div>
															<p class="leading-tight font-bold text-white">
																{bank.accountAlias}
																<span class="text-[10px] font-normal text-[var(--color-text-muted)]"
																	>({bank.bankName})</span
																>
															</p>
															{#if bank.accountNumber}
																<p class="font-mono text-[10px] text-[var(--color-text-subtle)]">
																	Acc: {bank.accountNumber}
																</p>
															{/if}
															{#if bank.notes}
																<p class="text-[10px] text-[var(--color-text-subtle)] italic">
																	{bank.notes}
																</p>
															{/if}
														</div>
													</div>
													<button
														type="button"
														onclick={() =>
															handleDeleteBankAccount(comp.id, bank.id, bank.accountAlias)}
														class="p-1 text-[var(--color-text-muted)] hover:text-red-400"
														title="Delete bank account"
													>
														<Trash2 size={13} />
													</button>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Document Attachments List -->
								{#if comp.documents && comp.documents.length > 0}
									<div class="border-t border-[var(--color-dark-border)] pt-2">
										<span class="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">
											Attached Documents ({comp.documents.length}):
										</span>
										<div class="mt-1 flex flex-wrap gap-2">
											{#each comp.documents as doc (doc.id)}
												<span
													class="sharp-corners flex items-center gap-1 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] px-2 py-0.5 text-[10px] text-white"
												>
													<Paperclip size={10} class="text-[var(--color-coral)]" />
													<span>{doc.title}</span>
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- ========================================================================= -->
<!-- MODAL: CREATE NEW HOUSEHOLD -->
<!-- ========================================================================= -->
{#if showNewHouseholdModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners w-full max-w-md space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<h2 class="font-serif text-xl font-bold text-white">Create New Household</h2>
				<button
					type="button"
					onclick={() => (showNewHouseholdModal = false)}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					✕
				</button>
			</div>

			<form
				method="POST"
				action="?/createHousehold"
				use:enhance={() => {
					return async ({ update }) => {
						showNewHouseholdModal = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="new-household-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Household Name
					</label>
					<input
						id="new-household-name"
						name="householdName"
						type="text"
						required
						bind:value={newHouseholdNameInput}
						placeholder="e.g. Beach Cottage Villa"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div
					class="flex items-center justify-end gap-3 border-t border-[var(--color-dark-border)] pt-3"
				>
					<button
						type="button"
						onclick={() => (showNewHouseholdModal = false)}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)]"
					>
						Create Household
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: ADD / EDIT EXPENSE CATEGORY -->
<!-- ========================================================================= -->
{#if isCategoryModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners w-full max-w-md space-y-5 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<h3 class="font-serif text-lg font-bold text-white">
					{isEditingCategory ? 'Edit Category' : 'Create Expense Category'}
				</h3>
				<button
					type="button"
					onclick={closeCategoryModal}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSaveCategory();
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="modal-cat-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Category Name
					</label>
					<input
						id="modal-cat-name"
						type="text"
						required
						bind:value={formCatName}
						placeholder="e.g. Groceries & Essentials"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="modal-cat-keywords"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Keywords (Comma-separated)
					</label>
					<input
						id="modal-cat-keywords"
						type="text"
						bind:value={formCatKeywords}
						placeholder="e.g. woolworths, checkers, food"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<span
						class="mb-1.5 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Color Accent
					</span>
					<div class="flex flex-wrap gap-2">
						{#each availableColors as c (c.value)}
							<button
								type="button"
								onclick={() => (formCatColor = c.value)}
								class="sharp-corners flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-all {formCatColor ===
								c.value
									? 'border-white text-white'
									: 'border-[var(--color-dark-border)] text-[var(--color-text-muted)]'}"
							>
								<span class="h-2.5 w-2.5 rounded-full {c.bg}"></span>
								<span>{c.label}</span>
							</button>
						{/each}
					</div>
				</div>

				<div
					class="flex items-center justify-end gap-2 border-t border-[var(--color-dark-border)] pt-4"
				>
					<button
						type="button"
						onclick={closeCategoryModal}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSavingCategory}
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						{isSavingCategory
							? 'Saving...'
							: isEditingCategory
								? 'Save Changes'
								: 'Create Category'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: ADD / EDIT COMPANY -->
<!-- ========================================================================= -->
{#if isCompanyModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xs"
	>
		<div
			class="sharp-corners my-8 w-full max-w-lg space-y-5 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<h3 class="font-serif text-lg font-bold text-white">
					{isEditingCompany ? 'Edit Company' : 'Register New Company'}
				</h3>
				<button
					type="button"
					onclick={closeCompanyModal}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSaveCompany();
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="modal-comp-name"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Company Name
					</label>
					<input
						id="modal-comp-name"
						type="text"
						required
						bind:value={compName}
						placeholder="e.g. Fairtree Holdings (Pty) Ltd"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label
							for="modal-comp-reg"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Registration Number
						</label>
						<input
							id="modal-comp-reg"
							type="text"
							bind:value={compRegNumber}
							placeholder="2021/123456/07"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="modal-comp-tax"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Tax / VAT Number
						</label>
						<input
							id="modal-comp-tax"
							type="text"
							bind:value={compTaxNumber}
							placeholder="491029384"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<div>
					<label
						for="modal-comp-type"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Company Type
					</label>
					<select
						id="modal-comp-type"
						bind:value={compType}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white focus:outline-hidden"
					>
						<option value="holding">Holding Company</option>
						<option value="subsidiary">Subsidiary</option>
						<option value="trust">Family Trust</option>
						<option value="individual">Sole Proprietorship / Individual</option>
					</select>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label
							for="modal-comp-email"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Email
						</label>
						<input
							id="modal-comp-email"
							type="email"
							bind:value={compEmail}
							placeholder="info@fairtree.com"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>

					<div>
						<label
							for="modal-comp-phone"
							class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
						>
							Phone Number
						</label>
						<input
							id="modal-comp-phone"
							type="tel"
							bind:value={compPhone}
							placeholder="+27 21 123 4567"
							class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
						/>
					</div>
				</div>

				<div>
					<label
						for="modal-comp-logo"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Company Logo (JPG/PNG)
					</label>
					<input
						id="modal-comp-logo"
						type="file"
						accept=".jpg,.jpeg,.png,image/jpeg,image/png"
						onchange={handleLogoFileSelect}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-1.5 text-xs text-white"
					/>
					{#if isUploadingLogo}
						<p class="mt-1 text-xs text-[var(--color-coral)]">Uploading logo to cloud storage...</p>
					{/if}
					{#if logoUploadError}
						<p class="mt-1 text-xs text-red-400">{logoUploadError}</p>
					{/if}
					{#if compLogoUrl}
						<div class="mt-2 flex items-center gap-2">
							<img
								src={compLogoUrl}
								alt="Preview"
								class="h-8 w-8 border bg-white/5 object-contain p-0.5"
							/>
							<span class="text-[10px] text-emerald-400">Logo attached</span>
						</div>
					{/if}
				</div>

				<div
					class="flex items-center justify-end gap-2 border-t border-[var(--color-dark-border)] pt-4"
				>
					<button
						type="button"
						onclick={closeCompanyModal}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSavingCompany || isUploadingLogo}
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						{isSavingCompany ? 'Saving...' : isEditingCompany ? 'Save Changes' : 'Create Company'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: ATTACH COMPANY DOCUMENT -->
<!-- ========================================================================= -->
{#if isDocumentModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners w-full max-w-md space-y-5 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<h3 class="font-serif text-lg font-bold text-white">Attach Company Document</h3>
				<button
					type="button"
					onclick={closeDocumentModal}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSaveDocument();
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="modal-doc-title"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Document Title
					</label>
					<input
						id="modal-doc-title"
						type="text"
						required
						bind:value={docTitle}
						placeholder="e.g. CIPC Registration Certificate"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="modal-doc-type"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Document Type
					</label>
					<select
						id="modal-doc-type"
						bind:value={docType}
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3 py-2 text-sm text-white focus:outline-hidden"
					>
						<option value="registration">CIPC / Registration</option>
						<option value="tax_clearance">Tax Clearance Certificate</option>
						<option value="shareholding">Shareholder Certificate</option>
						<option value="general">General Contract / Agreement</option>
					</select>
				</div>

				<div
					class="flex items-center justify-end gap-2 border-t border-[var(--color-dark-border)] pt-4"
				>
					<button
						type="button"
						onclick={closeDocumentModal}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSavingDoc}
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						{isSavingDoc ? 'Attaching...' : 'Attach Document'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL: ADD COMPANY BANK ACCOUNT -->
<!-- ========================================================================= -->
{#if isBankAccountModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
		<div
			class="sharp-corners w-full max-w-md space-y-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-6 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-[var(--color-dark-border)] pb-3"
			>
				<div class="flex items-center gap-2">
					<Landmark class="text-[var(--color-coral)]" size={20} />
					<h2 class="font-serif text-xl font-bold text-white">Add Company Bank Account</h2>
				</div>
				<button
					type="button"
					onclick={closeBankAccountModal}
					class="text-[var(--color-text-muted)] hover:text-white"
				>
					<X size={18} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSaveBankAccount();
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="bank-name-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Bank Name *
					</label>
					<input
						id="bank-name-input"
						type="text"
						required
						bind:value={bankName}
						placeholder="e.g. FNB, Standard Bank, Absa, Nedbank, Capitec"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="account-alias-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Account Alias / Label *
					</label>
					<input
						id="account-alias-input"
						type="text"
						required
						bind:value={accountAlias}
						placeholder="e.g. Main Operating Account, Payroll, Corporate CC"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="account-number-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Account Number (Optional)
					</label>
					<input
						id="account-number-input"
						type="text"
						bind:value={accountNumber}
						placeholder="e.g. 62810023456"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 font-mono text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					/>
				</div>

				<div>
					<label
						for="bank-notes-input"
						class="mb-1 block text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase"
					>
						Notes / Purpose (Optional)
					</label>
					<textarea
						id="bank-notes-input"
						bind:value={bankNotes}
						rows="2"
						placeholder="Optional notes or details for this account"
						class="sharp-corners w-full border border-[var(--color-dark-border)] bg-[var(--color-dark-card)] px-3.5 py-2 text-sm text-white focus:border-[var(--color-coral)] focus:outline-hidden"
					></textarea>
				</div>

				<div
					class="flex items-center justify-end gap-2 border-t border-[var(--color-dark-border)] pt-4"
				>
					<button
						type="button"
						onclick={closeBankAccountModal}
						class="sharp-corners bg-[var(--color-dark-card)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-dark-border)]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSavingBankAccount}
						class="sharp-corners bg-[var(--color-coral)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--color-coral-hover)] disabled:opacity-50"
					>
						{isSavingBankAccount ? 'Saving...' : 'Add Bank Account'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
