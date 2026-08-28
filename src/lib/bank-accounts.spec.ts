import { describe, it, expect } from 'vitest';
import type { Company, CompanyBankAccount, Expense, TenantContext } from './types';

describe('Company Bank Accounts & Expense Payment Linking Suite', () => {
	const householdTenant: TenantContext = {
		userId: 'usr_lead_family_01',
		activeHouseholdId: 'hh_fairtree_group_01',
		role: 'owner'
	};

	// Helper mock memory store for testing bank account operations & expense linking
	class MockCompanyBankManager {
		private companies: Map<string, Company> = new Map();
		private bankAccounts: Map<string, CompanyBankAccount> = new Map();
		private expenses: Map<string, Expense> = new Map();

		createCompany(companyData: Omit<Company, 'id' | 'documents' | 'bankAccounts'>): Company {
			const id = `comp_${Math.random().toString(36).substring(2, 9)}`;
			const company: Company = {
				id,
				...companyData,
				documents: [],
				bankAccounts: []
			};
			this.companies.set(id, company);
			return company;
		}

		addBankAccount(
			companyId: string,
			account: { bankName: string; accountAlias: string; accountNumber?: string; notes?: string }
		): CompanyBankAccount {
			const company = this.companies.get(companyId);
			if (!company) throw new Error('Company not found');

			if (!account.bankName.trim()) throw new Error('Bank name is required');
			if (!account.accountAlias.trim()) throw new Error('Account alias is required');

			const bankAccountId = `bank_${Math.random().toString(36).substring(2, 9)}`;
			const newAccount: CompanyBankAccount = {
				id: bankAccountId,
				companyId,
				bankName: account.bankName.trim(),
				accountAlias: account.accountAlias.trim(),
				accountNumber: account.accountNumber?.trim() || null,
				notes: account.notes?.trim() || null,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			this.bankAccounts.set(bankAccountId, newAccount);
			company.bankAccounts = [...(company.bankAccounts || []), newAccount];
			return newAccount;
		}

		getCompanyBankAccounts(companyId: string): CompanyBankAccount[] {
			const company = this.companies.get(companyId);
			return company?.bankAccounts || [];
		}

		deleteBankAccount(companyId: string, bankAccountId: string): boolean {
			const company = this.companies.get(companyId);
			if (!company) return false;

			const deleted = this.bankAccounts.delete(bankAccountId);
			if (deleted) {
				company.bankAccounts = (company.bankAccounts || []).filter((b) => b.id !== bankAccountId);
			}
			return deleted;
		}

		createExpense(expenseData: {
			vendor: string;
			amountCents: number;
			category?: string;
			date?: Date | string | number;
			notes?: string;
			paidFromBankAccountId?: string | null;
		}): Expense {
			const expenseId = `exp_${Math.random().toString(36).substring(2, 9)}`;
			const paidFromBankAccountId = expenseData.paidFromBankAccountId || null;

			let bank: CompanyBankAccount | null = null;
			let comp: Company | null = null;

			if (paidFromBankAccountId) {
				bank = this.bankAccounts.get(paidFromBankAccountId) || null;
				if (bank) {
					comp = this.companies.get(bank.companyId) || null;
				}
			}

			const parsedDate = expenseData.date
				? typeof expenseData.date === 'string' || typeof expenseData.date === 'number'
					? new Date(expenseData.date)
					: expenseData.date
				: new Date();

			const expense: Expense = {
				id: expenseId,
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				vendor: expenseData.vendor,
				amountCents: expenseData.amountCents,
				category: expenseData.category || 'general',
				currency: 'ZAR',
				date: parsedDate,
				notes: expenseData.notes || null,
				paidFromBankAccountId,
				paidFromBankAccount: bank,
				paidFromCompany: comp,
				createdAt: new Date()
			};

			this.expenses.set(expenseId, expense);
			return expense;
		}

		getAvailableHouseholdBankAccounts(tenant: TenantContext): Array<{
			company: Company;
			bankAccount: CompanyBankAccount;
		}> {
			const result: Array<{ company: Company; bankAccount: CompanyBankAccount }> = [];
			for (const company of this.companies.values()) {
				if (company.householdId === tenant.activeHouseholdId || company.userId === tenant.userId) {
					for (const bank of company.bankAccounts || []) {
						result.push({ company, bankAccount: bank });
					}
				}
			}
			return result;
		}

		getExpenseById(id: string): Expense | null {
			return this.expenses.get(id) || null;
		}
	}

	// --------------------------------------------------------------------------
	// 1. Single & Multiple Bank Accounts per Company
	// --------------------------------------------------------------------------
	describe('1. Single & Multiple Bank Accounts per Company', () => {
		it('should successfully create a single bank account for a company with alias, bank name, number, and notes', () => {
			const manager = new MockCompanyBankManager();

			const company = manager.createCompany({
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				name: 'Apex Holdings (Pty) Ltd',
				companyType: 'holding'
			});

			const bankAccount = manager.addBankAccount(company.id, {
				bankName: 'FNB',
				accountAlias: 'Primary Operating Account',
				accountNumber: '62819283746',
				notes: 'Main cheque account for daily transactions'
			});

			expect(bankAccount).toBeDefined();
			expect(bankAccount.id).toMatch(/^bank_/);
			expect(bankAccount.companyId).toBe(company.id);
			expect(bankAccount.bankName).toBe('FNB');
			expect(bankAccount.accountAlias).toBe('Primary Operating Account');
			expect(bankAccount.accountNumber).toBe('62819283746');
			expect(bankAccount.notes).toBe('Main cheque account for daily transactions');

			const companyAccounts = manager.getCompanyBankAccounts(company.id);
			expect(companyAccounts).toHaveLength(1);
			expect(companyAccounts[0].accountAlias).toBe('Primary Operating Account');
		});

		it('should support adding multiple bank accounts to a single company', () => {
			const manager = new MockCompanyBankManager();

			const company = manager.createCompany({
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				name: 'Breach Digital Solutions (Pty) Ltd',
				companyType: 'subsidiary'
			});

			// Add 3 different bank accounts to the same company
			const acc1 = manager.addBankAccount(company.id, {
				bankName: 'FNB',
				accountAlias: 'Operations Cheque',
				accountNumber: '62800112233',
				notes: 'Day-to-day operating expenses'
			});

			const acc2 = manager.addBankAccount(company.id, {
				bankName: 'Standard Bank',
				accountAlias: 'Payroll Account',
				accountNumber: '098765432',
				notes: 'Dedicated monthly staff salary disbursements'
			});

			const acc3 = manager.addBankAccount(company.id, {
				bankName: 'Absa',
				accountAlias: 'Corporate Tax Reserve',
				accountNumber: '4099887766',
				notes: 'Provisional VAT & SARS tax savings'
			});

			expect(acc1.id).not.toBe(acc2.id);
			expect(acc2.id).not.toBe(acc3.id);

			const accounts = manager.getCompanyBankAccounts(company.id);
			expect(accounts).toHaveLength(3);
			expect(accounts.map((a) => a.accountAlias)).toEqual([
				'Operations Cheque',
				'Payroll Account',
				'Corporate Tax Reserve'
			]);
			expect(accounts.map((a) => a.bankName)).toEqual(['FNB', 'Standard Bank', 'Absa']);
		});

		it('should allow deleting a bank account from a company', () => {
			const manager = new MockCompanyBankManager();

			const company = manager.createCompany({
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				name: 'Acme Investments',
				companyType: 'subsidiary'
			});

			const acc1 = manager.addBankAccount(company.id, {
				bankName: 'Nedbank',
				accountAlias: 'Old Account'
			});
			const acc2 = manager.addBankAccount(company.id, {
				bankName: 'Capitec',
				accountAlias: 'New Primary Account'
			});

			expect(manager.getCompanyBankAccounts(company.id)).toHaveLength(2);

			const deleted = manager.deleteBankAccount(company.id, acc1.id);
			expect(deleted).toBe(true);

			const remaining = manager.getCompanyBankAccounts(company.id);
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe(acc2.id);
			expect(remaining[0].accountAlias).toBe('New Primary Account');
		});
	});

	// --------------------------------------------------------------------------
	// 2. Linking Household Company Bank Accounts to Expenses
	// --------------------------------------------------------------------------
	describe('2. Linking Household Company Bank Accounts to Expenses', () => {
		it("should allow selecting a bank account linked to ANY company in the user's household for an expense", () => {
			const manager = new MockCompanyBankManager();

			// Create Company 1 (Holding) in household
			const holdingComp = manager.createCompany({
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				name: 'Apex Holdings (Pty) Ltd',
				companyType: 'holding'
			});

			// Create Company 2 (Subsidiary) in household
			const subComp = manager.createCompany({
				userId: householdTenant.userId,
				householdId: householdTenant.activeHouseholdId,
				name: 'Breach Digital Solutions (Pty) Ltd',
				companyType: 'subsidiary'
			});

			// Bank Accounts for Holding
			const holdingBank1 = manager.addBankAccount(holdingComp.id, {
				bankName: 'FNB',
				accountAlias: 'Apex Treasury Main',
				accountNumber: '6280001111'
			});
			const holdingBank2 = manager.addBankAccount(holdingComp.id, {
				bankName: 'Investec',
				accountAlias: 'Apex Private Reserve'
			});

			// Bank Accounts for Subsidiary
			const subBank1 = manager.addBankAccount(subComp.id, {
				bankName: 'Absa',
				accountAlias: 'Breach Operating Account',
				accountNumber: '4011223344'
			});

			// Verify all household bank accounts are discoverable for expense selection
			const availableAccounts = manager.getAvailableHouseholdBankAccounts(householdTenant);
			expect(availableAccounts).toHaveLength(3);
			expect(availableAccounts.map((a) => a.bankAccount.id)).toContain(holdingBank2.id);

			// Create Expense 1 linked to Holding's FNB Treasury Account
			const exp1 = manager.createExpense({
				vendor: 'AWS Cloud Infrastructure',
				amountCents: 145000, // R1,450.00
				category: 'services',
				paidFromBankAccountId: holdingBank1.id
			});

			// Create Expense 2 linked to Subsidiary's Absa Operating Account
			const exp2 = manager.createExpense({
				vendor: 'Woolworths Catering',
				amountCents: 32000, // R320.00
				category: 'supplies',
				paidFromBankAccountId: subBank1.id
			});

			// Create Expense 3 without bank account (Personal/Default)
			const exp3 = manager.createExpense({
				vendor: 'Uber Ride',
				amountCents: 15000,
				paidFromBankAccountId: null
			});

			// Assert Expense 1 resolution
			expect(exp1.paidFromBankAccountId).toBe(holdingBank1.id);
			expect(exp1.paidFromBankAccount).toBeDefined();
			expect(exp1.paidFromBankAccount?.accountAlias).toBe('Apex Treasury Main');
			expect(exp1.paidFromBankAccount?.bankName).toBe('FNB');
			expect(exp1.paidFromCompany).toBeDefined();
			expect(exp1.paidFromCompany?.name).toBe('Apex Holdings (Pty) Ltd');

			// Assert Expense 2 resolution
			expect(exp2.paidFromBankAccountId).toBe(subBank1.id);
			expect(exp2.paidFromBankAccount?.accountAlias).toBe('Breach Operating Account');
			expect(exp2.paidFromBankAccount?.bankName).toBe('Absa');
			expect(exp2.paidFromCompany?.name).toBe('Breach Digital Solutions (Pty) Ltd');

			// Assert Expense 3 (No bank account)
			expect(exp3.paidFromBankAccountId).toBeNull();
			expect(exp3.paidFromBankAccount).toBeNull();
			expect(exp3.paidFromCompany).toBeNull();
		});
	});
});
