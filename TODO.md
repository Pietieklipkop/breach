# Breach — Implementation TODO List & Engineering Roadmap

> **Status:** Active Roadmap  
> **Architecture Principle:** Holistic Unified View (Single-pane dashboard displaying entity badges for Holding Company, Trust, and Personal assets/expenses without entity swapping). Telemetry and activity metrics integrated directly into the Dashboard.

---

## 🎯 Phase 1: Database Schema Extensions (`src/lib/server/db/schema.ts`)

- [ ] **1.1 Asset Entity & Ownership Fields**
  - [ ] Add `ownershipType` enum (`"holding_company" | "trust" | "personal"`) to `assets` table.
  - [ ] Add `holdingCompanyId` foreign key to `assets` table.
  - [ ] Add `sarsWriteOffYears` (integer) for SARS Section 11(e) wear-and-tear lifespan.
  - [ ] Add `businessUsePercentage` (integer 0-100) for dual-use asset allocation.

- [ ] **1.2 Expense Tax Allocation & SARS Optimization Fields**
  - [ ] Add `isCorporateDeductible` (integer 0/1) to `expenses` table.
  - [ ] Add `taxCategory` (`"s11a_trade" | "dual_apportioned" | "personal_living" | "directors_loan" | "capital_allowance"`) to `expenses`.
  - [ ] Add `corporateSplitPercentage` (integer 0-100) to `expenses`.
  - [ ] Add `vatRate` (e.g. 15, 0) and `vatClaimableCents` (integer) to `expenses`.
  - [ ] Create `expense_tax_allocations` table for detailed multi-category tax deductions and audit notes.

- [ ] **1.3 Director's Loan Account (DLA) & Section 7C Ledger**
  - [ ] Create `directors_loan_entries` table (`id`, `holdingCompanyId`, `userId`, `expenseId`, `type: "debit" | "credit"`, `amountCents`, `interestRate`, `description`, `date`, `createdAt`).
  - [ ] Create relations between `directors_loan_entries`, `holding_companies`, `expenses`, and `user`.

- [ ] **1.4 Company Banking & SARS Invoicing Fields**
  - [ ] Add banking details fields to `companies` table: `bankName`, `accountNumber`, `branchCode`, `accountType`, `swiftCode`, `paymentReferenceFormat`.
  - [ ] Add `sarsVatRegistered` (0/1) and `vatNumber` fields to `companies` and `clients`.

- [ ] **1.5 System Telemetry & Activity Audit Tables**
  - [ ] Create `activity_logs` table (`id`, `householdId`, `userId`, `action`, `resourceType`, `resourceId`, `entityBadge`, `metadata`, `createdAt`).
  - [ ] Create `telemetry_metrics` table (`id`, `metricType: "d1_query" | "r2_sync" | "ocr_scan" | "tax_calc"`, `durationMs`, `success: 0 | 1`, `metadata`, `createdAt`).

---

## 🏛️ Phase 2: South African Tax Law Optimization Engine

- [ ] **2.1 SARS Section 11(a) General Deduction Classifier**
  - [ ] Implement tax rule evaluator distinguishing valid holding company trade expenses from personal living expenses.
  - [ ] Auto-calculate corporate tax savings based on South African Corporate Income Tax (CIT) rate (27%).

- [ ] **2.2 Section 23(g) Dual-Use Apportionment Calculator**
  - [ ] **Home Office Apportionment:** Calculate office $m^2$ ratio against domestic utilities, fiber internet, rates, and insurance.
  - [ ] **Business Vehicle Travel Logbook:** Compute business $km$ vs. total $km$ ratio for vehicle maintenance and fuel deductions.

- [ ] **2.3 Section 11(e) Wear & Tear Capital Allowances**
  - [ ] Implement SARS Interpretation Note 47 write-off schedules (Laptops/IT: 3 yrs, Solar PV: 5 yrs, Cellphones: 2 yrs).
  - [ ] Compute annual tax deduction and remaining book value for all corporate/dual-use assets.

- [ ] **2.4 Director's Loan & Section 7C Deemed Interest Monitor**
  - [ ] Track running balance of company-paid domestic drawings.
  - [ ] Calculate deemed interest exposure against SARS official repo rate + 100 bps to alert directors before tax year-end.

- [ ] **2.5 VAT 201 Input Tax Claims**
  - [ ] Automated line-item 15% VAT claim calculator for valid tax invoice receipts.

---

## 🧾 Phase 3: Holding Company B2B Invoicing Engine

- [ ] **3.1 SARS Section 20(4) Compliant Invoicing**
  - [ ] Enforce prominent **"TAX INVOICE"** heading on generated invoices.
  - [ ] Mandate Holding Company & Client SARS VAT numbers, serialized invoice numbers, and issue dates.
  - [ ] Dynamic line-item calculation with quantity, unit rate, 15% VAT, and ZAR currency totals.

- [ ] **3.2 Banking Details & Payment Instructions**
  - [ ] Include Holding Company banking coordinates (Bank, Account #, Branch Code, SWIFT, Payment Ref) in footer.

- [ ] **3.3 PDF Generation & Client Export**
  - [ ] Clean, sharp-cornered printable and downloadable PDF generation matching Fairtree brand styling.

- [ ] **3.4 Recurring Retainer Schedules**
  - [ ] Enable monthly recurring invoice generation for ongoing B2B management/consulting contracts.

---

## 📊 Phase 4: Holistic Dashboard & Embedded Telemetry

- [ ] **4.1 Holistic Unified Overview (No Entity Swapping)**
  - [ ] Display all assets, expenses, and invoices in a single holistic view.
  - [ ] Add distinct visual entity badges to every item:
    - `[🏢 Holding Co: Fairtree Assets Pty Ltd]` (Teal badge)
    - `[🏠 Personal Household]` (Slate badge)
    - `[🏛️ Family Trust]` (Amber badge)

- [ ] **4.2 Executive Tax & Financial Metric Tiles**
  - [ ] **Total Asset Valuation:** Consolidated portfolio value with entity breakdown bar.
  - [ ] **Holding Co vs. Personal Spend Ratio:** Visual percentage breakdown of corporate lean expenses vs. household personal spend.
  - [ ] **Tax Shield (Saved):** Real-time ZAR savings calculated from approved 27% CIT deductions.
  - [ ] **Section 7C Loan Account Gauge:** Current Director's Loan balance with risk threshold indicator.
  - [ ] **Invoiced Revenue Pipeline:** Monthly B2B billing volume and payment collection status.

- [ ] **4.3 Embedded Telemetry & System Health Card**
  - [ ] Embedded telemetry widget directly inside Dashboard (no external nav link needed).
  - [ ] Display Cloudflare D1 query latency (ms).
  - [ ] Display Cloudflare R2 object storage sync status.
  - [ ] Display AI OCR document parsing duration and character recognition confidence (%).
  - [ ] Real-time activity feed showing the latest timestamped user operations with entity tags.

---

## 💎 Phase 5: Asset Management Enhancements

- [ ] **5.1 Asset Entity Tagging in UI**
  - [ ] Add Entity Assignment dropdown (`Holding Company` | `Trust` | `Personal`) to Asset creation and edit forms.
  - [ ] Render clear ownership badges on asset cards and asset tables.

- [ ] **5.2 Capital Asset Write-Off & Value Tracker**
  - [ ] Display SARS Section 11(e) annual depreciation progress bar on asset detail pages.
  - [ ] Add asset categories for Solar PV & Battery Inverters, Computing/IT, and Luxury Estate items.

- [ ] **5.3 Electronic Travel Logbook for Vehicles**
  - [ ] Log individual trips with Business vs. Private tags, starting/ending km, and purpose of travel for SARS logbook audits.

---

## 🎨 Phase 6: Top-Bar Navigation & Layout Polish

- [ ] **6.1 Maximized Viewport Top-Bar**
  - [ ] Top bar navigation across desktop and mobile to free up 100% canvas space.
  - [ ] Sharp-cornered navigation items (`border-radius: 0px`).
  - [ ] Navigation Links: `Overview (Dashboard)`, `Assets`, `Expenses`, `Tax Optimizer`, `Invoices`, `Settings`.
  - [ ] Quick Actions: `+ New Expense`, `+ New Asset`, `+ New Invoice`.

- [ ] **6.2 Responsive Mobile Drawer**
  - [ ] Mobile-optimized top bar with collapsible sharp-corner drawer for smaller viewports.

---

## 🧪 Phase 7: Quality Assurance & Testing

- [ ] **7.1 Vitest Unit Tests**
  - [ ] Test SARS Section 11(a) corporate deduction qualification logic.
  - [ ] Test Section 23(g) home office & vehicle apportionment formulas.
  - [ ] Test Section 7C deemed interest calculation matrices.
  - [ ] Test 15% VAT calculation and rounding accuracy.
  - [ ] Test Section 11(e) asset depreciation calculations.

- [ ] **7.2 Playwright End-to-End Tests**
  - [ ] Test full top-bar navigation flow on desktop (1920x1080) and mobile (390x844).
  - [ ] Test creating a holding-company owned asset with Section 11(e) write-off schedule.
  - [ ] Test issuing a SARS Section 20(4) compliant B2B tax invoice with 15% VAT.
  - [ ] Test logging an expense and verifying the holistic entity badge and dashboard telemetry update.
