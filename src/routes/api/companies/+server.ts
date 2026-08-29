import { json, type RequestHandler } from '@sveltejs/kit';
import { CompanyService } from '$lib/server/services';
import { createCompanySchema, updateCompanySchema, deleteCompanySchema } from '$lib/schemas';

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	const tenant = event.locals.tenant;
	if (!user || !tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = event.platform?.env?.DB;
	if (!d1) {
		return json({ companies: [] });
	}

	try {
		const companyService = new CompanyService(d1);
		const companies = await companyService.list(tenant);
		return json({ companies });
	} catch (err: unknown) {
		console.error('Error fetching companies:', err);
		return json({ companies: [] });
	}
};

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	const tenant = event.locals.tenant;
	if (!user || !tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = event.platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const rawBody = (await event.request.json()) as Record<string, unknown>;
		const companyService = new CompanyService(d1);

		if (rawBody.action === 'addDocument') {
			const { companyId, title, documentType, fileUrl } = rawBody as {
				companyId?: string;
				title?: string;
				documentType?: string;
				fileUrl?: string;
			};
			if (!companyId) {
				return json({ error: 'Company ID is required' }, { status: 400 });
			}

			const doc = await companyService.addDocument(tenant, companyId, {
				title: title || 'Document Attachment',
				documentType: documentType || 'general',
				fileUrl: fileUrl || '/documents/sample-attachment.pdf'
			});

			if (!doc) {
				return json({ error: 'Company not found or access denied' }, { status: 404 });
			}

			return json({ success: true, document: doc });
		}

		if (rawBody.action === 'addBankAccount') {
			const { companyId, bankName, accountAlias, accountNumber, notes } = rawBody as {
				companyId?: string;
				bankName?: string;
				accountAlias?: string;
				accountNumber?: string;
				notes?: string;
			};

			if (!companyId || !bankName || !accountAlias) {
				return json(
					{ error: 'Company ID, Bank Name, and Account Alias are required' },
					{ status: 400 }
				);
			}

			const bankAccount = await companyService.addBankAccount(tenant, companyId, {
				bankName: bankName.trim(),
				accountAlias: accountAlias.trim(),
				accountNumber: accountNumber ? accountNumber.trim() : undefined,
				notes: notes ? notes.trim() : undefined
			});

			if (!bankAccount) {
				return json({ error: 'Company not found or access denied' }, { status: 404 });
			}

			return json({ success: true, bankAccount });
		}

		const parsed = createCompanySchema.safeParse(rawBody);
		if (!parsed.success) {
			return json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
		}

		const created = await companyService.create(tenant, parsed.data);
		return json({ success: true, company: created });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Server error';
		return json({ error: message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	const tenant = event.locals.tenant;
	if (!user || !tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = event.platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const rawBody = await event.request.json();
		const parsed = updateCompanySchema.safeParse(rawBody);
		if (!parsed.success) {
			return json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
		}

		const { id, ...data } = parsed.data;
		const companyService = new CompanyService(d1);
		const updated = await companyService.update(tenant, id, data);

		if (!updated) {
			return json({ error: 'Company not found or access denied' }, { status: 404 });
		}

		return json({ success: true, company: updated });
	} catch {
		return json({ error: 'Failed to update company' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	const tenant = event.locals.tenant;
	if (!user || !tenant) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const d1 = event.platform?.env?.DB;
	if (!d1) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	try {
		const rawBody = (await event.request.json()) as Record<string, unknown>;
		const companyService = new CompanyService(d1);

		if (rawBody.action === 'deleteBankAccount') {
			const { companyId, bankAccountId } = rawBody as {
				companyId?: string;
				bankAccountId?: string;
			};
			if (!companyId || !bankAccountId) {
				return json({ error: 'Company ID and Bank Account ID are required' }, { status: 400 });
			}
			const deleted = await companyService.deleteBankAccount(tenant, companyId, bankAccountId);
			if (!deleted) {
				return json({ error: 'Bank account not found or access denied' }, { status: 404 });
			}
			return json({ success: true });
		}

		const parsed = deleteCompanySchema.safeParse(rawBody);
		if (!parsed.success) {
			return json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
		}

		const { id, docId } = parsed.data;

		if (docId) {
			// Find document's company or delete via docId
			const companyList = await companyService.list(tenant);
			let deletedDoc = false;
			for (const comp of companyList) {
				if (comp.documents?.some((d) => d.id === docId)) {
					deletedDoc = await companyService.deleteDocument(tenant, comp.id, docId);
					break;
				}
			}

			if (!deletedDoc) {
				return json({ error: 'Document not found or access denied' }, { status: 404 });
			}
			return json({ success: true });
		}

		if (id) {
			const force = Boolean(rawBody.force);
			const result = await companyService.delete(tenant, id, force);
			if (result.requiresConfirmation) {
				return json(
					{
						warning: true,
						requiresConfirmation: true,
						linked: result.linked,
						message:
							'This company has linked expenses, assets, or invoices. Permission required to delete the company and everything linked to it.'
					},
					{ status: 409 }
				);
			}
			if (!result.success) {
				return json({ error: 'Company not found or access denied' }, { status: 404 });
			}
			return json({ success: true });
		}

		return json({ error: 'No ID provided' }, { status: 400 });
	} catch {
		return json({ error: 'Failed to delete' }, { status: 500 });
	}
};
