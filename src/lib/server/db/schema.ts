import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './auth.schema';

// User Profiles Table
export const userProfiles = sqliteTable('user_profiles', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	phone: text('phone'),
	address: text('address'),
	currency: text('currency').notNull().default('ZAR'),
	householdName: text('household_name').default('My Household'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Households Table
export const households = sqliteTable('households', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	createdByUserId: text('created_by_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Household Members Table
export const householdMembers = sqliteTable('household_members', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	householdId: text('household_id')
		.notNull()
		.references(() => households.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	role: text('role', { enum: ['owner', 'admin', 'member'] })
		.notNull()
		.default('member'),
	isMain: integer('is_main').notNull().default(0),
	joinedAt: integer('joined_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Household Invites Table
export const householdInvites = sqliteTable('household_invites', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	householdId: text('household_id')
		.notNull()
		.references(() => households.id, { onDelete: 'cascade' }),
	invitedByUserId: text('invited_by_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	name: text('name').notNull(),
	role: text('role', { enum: ['admin', 'member'] })
		.notNull()
		.default('member'),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Assets Table (Vehicles, Homes, Household Assets)
export const assets = sqliteTable('assets', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	type: text('type', { enum: ['vehicle', 'home', 'other'] })
		.notNull()
		.default('vehicle'),
	name: text('name').notNull(),
	make: text('make'),
	model: text('model'),
	yearModel: integer('year_model'),
	purchaseDate: integer('purchase_date', { mode: 'timestamp_ms' }),
	purchasePriceCents: integer('purchase_price_cents').notNull().default(0),
	currentValuationCents: integer('current_valuation_cents').notNull().default(0),
	purchaseKm: integer('purchase_km'),
	currentKm: integer('current_km'),
	documentUrl: text('document_url'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Asset Activities / Maintenance Table
export const assetActivities = sqliteTable('asset_activities', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	assetId: text('asset_id')
		.notNull()
		.references(() => assets.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	category: text('category', {
		enum: ['maintenance', 'upgrade', 'repair', 'renovation', 'tax_insurance', 'other']
	})
		.notNull()
		.default('maintenance'),
	costCents: integer('cost_cents').notNull().default(0),
	vendor: text('vendor'),
	date: integer('date', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	mileageKm: integer('mileage_km'),
	invoiceUrl: text('invoice_url'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Expenses Table
export const expenses = sqliteTable('expenses', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	assetId: text('asset_id').references(() => assets.id, { onDelete: 'set null' }),
	category: text('category').notNull().default('general'),
	vendor: text('vendor').notNull(),
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull().default('ZAR'),
	date: integer('date', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	receiptUrl: text('receipt_url'),
	rawOcrData: text('raw_ocr_data'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Receipt & Invoice OCR Documents Log
export const receiptDocuments = sqliteTable('receipt_documents', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	fileName: text('file_name').notNull(),
	fileUrl: text('file_url').notNull(),
	mimeType: text('mime_type').notNull(),
	status: text('status', { enum: ['processing', 'completed', 'failed'] }).default('processing'),
	parsedData: text('parsed_data'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

// Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(user, {
		fields: [userProfiles.userId],
		references: [user.id]
	})
}));

export const householdsRelations = relations(households, ({ one, many }) => ({
	creator: one(user, {
		fields: [households.createdByUserId],
		references: [user.id]
	}),
	members: many(householdMembers),
	invites: many(householdInvites),
	assets: many(assets)
}));

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
	household: one(households, {
		fields: [householdMembers.householdId],
		references: [households.id]
	}),
	user: one(user, {
		fields: [householdMembers.userId],
		references: [user.id]
	})
}));

export const householdInvitesRelations = relations(householdInvites, ({ one }) => ({
	household: one(households, {
		fields: [householdInvites.householdId],
		references: [households.id]
	}),
	invitedBy: one(user, {
		fields: [householdInvites.invitedByUserId],
		references: [user.id]
	})
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
	user: one(user, {
		fields: [assets.userId],
		references: [user.id]
	}),
	household: one(households, {
		fields: [assets.householdId],
		references: [households.id]
	}),
	activities: many(assetActivities),
	expenses: many(expenses)
}));

export const assetActivitiesRelations = relations(assetActivities, ({ one }) => ({
	asset: one(assets, {
		fields: [assetActivities.assetId],
		references: [assets.id]
	})
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
	user: one(user, {
		fields: [expenses.userId],
		references: [user.id]
	}),
	household: one(households, {
		fields: [expenses.householdId],
		references: [households.id]
	}),
	asset: one(assets, {
		fields: [expenses.assetId],
		references: [assets.id]
	})
}));

// Expense Categories (Master Data) Table
export const expenseCategories = sqliteTable('expense_categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	icon: text('icon').default('Tag'),
	color: text('color').default('coral'),
	keywords: text('keywords').default(''),
	isDefault: integer('is_default').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const expenseCategoriesRelations = relations(expenseCategories, ({ one }) => ({
	user: one(user, {
		fields: [expenseCategories.userId],
		references: [user.id]
	}),
	household: one(households, {
		fields: [expenseCategories.householdId],
		references: [households.id]
	})
}));

// Companies (Master Data) Table
export const companies = sqliteTable('companies', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	regNumber: text('reg_number'),
	taxNumber: text('tax_number'),
	companyType: text('company_type', { enum: ['holding', 'subsidiary', 'client'] })
		.notNull()
		.default('subsidiary'),
	address: text('address'),
	email: text('email'),
	phone: text('phone'),
	ownershipDetails: text('ownership_details'),
	logoUrl: text('logo_url'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
	user: one(user, {
		fields: [companies.userId],
		references: [user.id]
	}),
	household: one(households, {
		fields: [companies.householdId],
		references: [households.id]
	}),
	documents: many(companyDocuments)
}));

// Company Documents Table
export const companyDocuments = sqliteTable('company_documents', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	companyId: text('company_id')
		.notNull()
		.references(() => companies.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	documentType: text('document_type').default('general'),
	fileUrl: text('file_url').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const companyDocumentsRelations = relations(companyDocuments, ({ one }) => ({
	company: one(companies, {
		fields: [companyDocuments.companyId],
		references: [companies.id]
	})
}));

// Invoices Table
export const invoices = sqliteTable('invoices', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	householdId: text('household_id').references(() => households.id, { onDelete: 'cascade' }),
	invoiceNumber: text('invoice_number').notNull(),
	fromCompanyId: text('from_company_id').references(() => companies.id, { onDelete: 'set null' }),
	toCompanyId: text('to_company_id').references(() => companies.id, { onDelete: 'set null' }),
	issueDate: integer('issue_date', { mode: 'timestamp_ms' }).notNull(),
	dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
	status: text('status', { enum: ['draft', 'issued', 'paid'] }).default('draft'),
	subtotalCents: integer('subtotal_cents').notNull().default(0),
	vatCents: integer('vat_cents').notNull().default(0),
	totalCents: integer('total_cents').notNull().default(0),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	user: one(user, {
		fields: [invoices.userId],
		references: [user.id]
	}),
	household: one(households, {
		fields: [invoices.householdId],
		references: [households.id]
	}),
	fromCompany: one(companies, {
		fields: [invoices.fromCompanyId],
		references: [companies.id]
	}),
	toCompany: one(companies, {
		fields: [invoices.toCompanyId],
		references: [companies.id]
	}),
	items: many(invoiceItems)
}));

// Invoice Items Table
export const invoiceItems = sqliteTable('invoice_items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	invoiceId: text('invoice_id')
		.notNull()
		.references(() => invoices.id, { onDelete: 'cascade' }),
	expenseId: text('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
	description: text('description').notNull(),
	category: text('category').default('general'),
	amountCents: integer('amount_cents').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
	expense: one(expenses, {
		fields: [invoiceItems.expenseId],
		references: [expenses.id]
	})
}));

export * from './auth.schema';
