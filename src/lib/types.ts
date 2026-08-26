export type AssetType = 'vehicle' | 'home' | 'other';
export type ActivityCategory =
	'maintenance' | 'upgrade' | 'repair' | 'renovation' | 'tax_insurance' | 'other';

export interface TenantContext {
	userId: string;
	activeHouseholdId: string | null;
	role?: 'owner' | 'admin' | 'member' | 'individual';
}

export interface Asset {
	id: string;
	userId: string;
	householdId?: string | null;
	type: AssetType;
	name: string;
	make?: string | null;
	model?: string | null;
	yearModel?: number | null;
	purchaseDate?: Date | number | null;
	purchasePriceCents: number;
	currentValuationCents: number;
	purchaseKm?: number | null;
	currentKm?: number | null;
	documentUrl?: string | null;
	notes?: string | null;
	createdAt?: Date | number;
	updatedAt?: Date | number;
}

export interface AssetActivity {
	id: string;
	assetId: string;
	title: string;
	category: ActivityCategory;
	costCents: number;
	vendor?: string | null;
	date: Date | number;
	mileageKm?: number | null;
	invoiceUrl?: string | null;
	notes?: string | null;
	createdAt?: Date | number;
}

export interface ExpenseCategory {
	id: string;
	userId?: string | null;
	householdId?: string | null;
	name: string;
	slug: string;
	icon?: string | null;
	color?: string | null;
	keywords?: string | null;
	isDefault: number;
	createdAt?: Date | number;
	updatedAt?: Date | number;
}

export interface Expense {
	id: string;
	userId: string;
	householdId?: string | null;
	assetId?: string | null;
	category: string;
	vendor: string;
	amountCents: number;
	currency: string;
	date: Date | number;
	receiptUrl?: string | null;
	rawOcrData?: string | null;
	notes?: string | null;
	createdAt?: Date | number;
}

export interface ParsedOcrResult {
	vendor?: string;
	date?: string; // Purchase date (YYYY-MM-DD)
	uploadDate?: string; // Date receipt was uploaded (YYYY-MM-DD)
	amountCents?: number;
	category?: string | null;
	categoryName?: string | null;
	make?: string;
	model?: string;
	yearModel?: number;
	purchaseKm?: number;
	items?: Array<{ description: string; priceCents: number }>;
	rawText?: string;
	notes?: string;
	activityTitle?: string;
	activityCategory?: string;
}

export type CompanyType = 'holding' | 'subsidiary' | 'client';

export interface CompanyDocument {
	id: string;
	companyId: string;
	title: string;
	documentType?: string | null;
	fileUrl: string;
	createdAt?: Date | number;
}

export interface Company {
	id: string;
	userId?: string | null;
	householdId?: string | null;
	name: string;
	regNumber?: string | null;
	taxNumber?: string | null;
	companyType: CompanyType;
	address?: string | null;
	email?: string | null;
	phone?: string | null;
	ownershipDetails?: string | null;
	logoUrl?: string | null;
	documents?: CompanyDocument[];
	createdAt?: Date | number;
	updatedAt?: Date | number;
}

export interface InvoiceItem {
	id: string;
	invoiceId: string;
	expenseId?: string | null;
	description: string;
	category?: string | null;
	amountCents: number;
	createdAt?: Date | number;
}

export interface Invoice {
	id: string;
	userId?: string | null;
	householdId?: string | null;
	invoiceNumber: string;
	fromCompanyId?: string | null;
	toCompanyId?: string | null;
	fromCompany?: Company | null;
	toCompany?: Company | null;
	issueDate: Date | number;
	dueDate: Date | number;
	status: 'draft' | 'issued' | 'paid';
	subtotalCents: number;
	vatCents: number;
	totalCents: number;
	notes?: string | null;
	items?: InvoiceItem[];
	createdAt?: Date | number;
}
