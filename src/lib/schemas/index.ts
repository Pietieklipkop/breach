import { z } from 'zod';

// ==================== EXPENSE SCHEMAS ====================
export const createExpenseSchema = z.object({
	vendor: z.string().min(1, 'Vendor name is required'),
	amountCents: z.number().int().positive('Amount must be a positive integer in cents'),
	category: z.string().min(1).default('general'),
	currency: z.string().default('ZAR'),
	date: z.union([z.string(), z.number(), z.date()]).optional(),
	receiptUrl: z.string().nullable().optional(),
	rawOcrData: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	assetId: z.string().nullable().optional()
});

export const deleteExpenseSchema = z.object({
	id: z.string().min(1, 'Expense ID is required')
});

// ==================== INVOICE SCHEMAS ====================
export const invoiceItemSchema = z.object({
	description: z.string().min(1, 'Item description is required'),
	category: z.string().default('general'),
	amountCents: z.number().int().positive('Item amount must be positive'),
	expenseId: z.string().nullable().optional()
});

export const createInvoiceSchema = z.object({
	invoiceNumber: z.string().optional(),
	fromCompanyId: z.string().min(1, 'From Company is required'),
	toCompanyId: z.string().min(1, 'To Company is required'),
	issueDate: z.union([z.string(), z.number(), z.date()]).optional(),
	dueDate: z.union([z.string(), z.number(), z.date()]).optional(),
	status: z.enum(['draft', 'issued', 'paid']).default('issued'),
	subtotalCents: z.number().int().nonnegative().optional(),
	vatCents: z.number().int().nonnegative().optional(),
	totalCents: z.number().int().nonnegative().optional(),
	notes: z.string().nullable().optional(),
	items: z.array(invoiceItemSchema).optional()
});

export const deleteInvoiceSchema = z.object({
	id: z.string().min(1, 'Invoice ID is required')
});

// ==================== COMPANY SCHEMAS ====================
export const createCompanySchema = z.object({
	name: z.string().min(1, 'Company Name is required'),
	regNumber: z.string().nullable().optional(),
	taxNumber: z.string().nullable().optional(),
	companyType: z.enum(['holding', 'subsidiary', 'client']).default('subsidiary'),
	address: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	ownershipDetails: z.string().nullable().optional(),
	logoUrl: z.string().nullable().optional()
});

export const updateCompanySchema = z.object({
	id: z.string().min(1, 'Company ID is required'),
	name: z.string().min(1, 'Company Name is required'),
	regNumber: z.string().nullable().optional(),
	taxNumber: z.string().nullable().optional(),
	companyType: z.enum(['holding', 'subsidiary', 'client']).optional(),
	address: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	phone: z.string().nullable().optional(),
	ownershipDetails: z.string().nullable().optional(),
	logoUrl: z.string().nullable().optional()
});

export const deleteCompanySchema = z.object({
	id: z.string().optional(),
	docId: z.string().optional()
});

// ==================== ASSET SCHEMAS ====================
export const createAssetSchema = z.object({
	name: z.string().min(1, 'Asset name is required'),
	type: z.enum(['vehicle', 'home', 'other']).default('vehicle'),
	make: z.string().nullable().optional(),
	model: z.string().nullable().optional(),
	yearModel: z.number().int().nullable().optional(),
	purchaseDate: z.union([z.string(), z.number(), z.date()]).optional(),
	purchasePriceCents: z.number().int().nonnegative().default(0),
	currentValuationCents: z.number().int().nonnegative().optional(),
	purchaseKm: z.number().int().nullable().optional(),
	currentKm: z.number().int().nullable().optional(),
	documentUrl: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

export const updateAssetSchema = z.object({
	id: z.string().min(1, 'Asset ID is required'),
	name: z.string().min(1).optional(),
	type: z.enum(['vehicle', 'home', 'other']).optional(),
	make: z.string().nullable().optional(),
	model: z.string().nullable().optional(),
	yearModel: z.number().int().nullable().optional(),
	purchaseDate: z.union([z.string(), z.number(), z.date()]).optional(),
	purchasePriceCents: z.number().int().nonnegative().optional(),
	currentValuationCents: z.number().int().nonnegative().optional(),
	purchaseKm: z.number().int().nullable().optional(),
	currentKm: z.number().int().nullable().optional(),
	documentUrl: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

export const deleteAssetSchema = z.object({
	id: z.string().min(1, 'Asset ID is required')
});

// ==================== ASSET ACTIVITY SCHEMAS ====================
export const createActivitySchema = z.object({
	assetId: z.string().min(1, 'Asset ID is required'),
	title: z.string().min(1, 'Activity title is required'),
	category: z
		.enum(['maintenance', 'upgrade', 'repair', 'renovation', 'tax_insurance', 'other'])
		.default('maintenance'),
	costCents: z.number().int().nonnegative().default(0),
	vendor: z.string().nullable().optional(),
	date: z.union([z.string(), z.number(), z.date()]).optional(),
	mileageKm: z.number().int().nullable().optional(),
	invoiceUrl: z.string().nullable().optional(),
	notes: z.string().nullable().optional()
});

export const deleteActivitySchema = z.object({
	assetId: z.string().min(1, 'Asset ID is required'),
	activityId: z.string().min(1, 'Activity ID is required')
});

// ==================== CATEGORY SCHEMAS ====================
export const createCategorySchema = z.object({
	name: z.string().min(1, 'Category name is required'),
	slug: z.string().optional(),
	icon: z.string().optional(),
	color: z.string().optional(),
	keywords: z.string().optional()
});

export const updateCategorySchema = z.object({
	id: z.string().min(1, 'Category ID is required'),
	name: z.string().min(1, 'Category name is required'),
	keywords: z.string().optional(),
	color: z.string().optional(),
	icon: z.string().optional()
});

export const deleteCategorySchema = z.object({
	id: z.string().min(1, 'Category ID is required')
});
