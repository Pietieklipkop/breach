# Breach Application Specification

> **CRITICAL MAINTENANCE INSTRUCTION**  
> **This specification document (`specification.md`) and the UI Element Stylesheet ([`layout.css`](file:///home/user/dialogdev/breach/src/routes/layout.css)) MUST be updated every single time changes, enhancements, new UI elements, or architectural modifications are made to this application.**

---

## 1. Executive Summary & Overview

**Breach** is a high-end, premium Household Asset, Expense & Maintenance Management Web Application built for the Fairtree family office / household management system.

The platform provides a centralized, privacy-first solution for tracking high-value household assets (vehicles, luxury real estate, solar PV installations, electronics), managing vehicle mileage and service history, categorizing household expenses, and automatically extracting receipt and invoice data using AI-powered OCR capabilities.

---

## 2. Default Development & Testing Credentials

The following default user credentials are created and designated for development, manual testing, QA validation, and automated E2E tests (Playwright):

- **Primary Test Email**: `admin@breach.co.za`
- **Default Password**: `password123`
- **Role**: `Household Administrator`
- **Household Name**: `Breach Household`
- **Default Currency**: `ZAR` (South African Rand - R)

- **Initial Application State**: Clean state (zero dummy assets, activities, or expenses) prepared for testing fresh vehicle asset creation, mileage tracking, and maintenance records.

_Note: All application routes require authentication. Development testing uses the generic credentials above or newly registered accounts created via `/register`._

---

## 3. Brand & UI Design System Rules (Fairtree Brand Guidelines)

All interface components and pages MUST strictly conform to the Fairtree brand guidelines defined in [`layout.css`](file:///home/user/dialogdev/breach/src/routes/layout.css):

### 3.1 The Golden Rule (Zero Border-Radius)

- **Strict Sharp Corners**: All UI elements—including buttons, input fields, select dropdowns, cards, badges, modals, and data tables—MUST enforce sharp corners (`border-radius: 0px` or CSS utility `.sharp-corners`).
- Rounded corners (`rounded`, `rounded-md`, `rounded-lg`, etc.) are **strictly prohibited**.

### 3.2 Typography & Fonts

- **Serif Font**: `RecifeDisplay` / `Playfair Display` (used for page titles, section headings, numbers, and brand headers).
- **Sans-Serif Font**: `Raleway` (used for body text, form labels, buttons, navigation links, and small metadata).

### 3.3 Color Palette Tokens

| Token                  | Hex Value / Variable               | Purpose                                        |
| :--------------------- | :--------------------------------- | :--------------------------------------------- |
| **Dark Background**    | `#121215` (`--color-dark-bg`)      | Base application dark background               |
| **Dark Surface**       | `#1a1a1e` (`--color-dark-surface`) | Container panels, sidebar, header surfaces     |
| **Dark Card**          | `#222227` (`--color-dark-card`)    | Asset, expense, and metric cards               |
| **Border Dark**        | `#2e2e36` (`--color-dark-border`)  | Sharp structural borders                       |
| **Brand Coral Accent** | `#ff6f61` (`--color-coral`)        | Primary interactive buttons, highlights        |
| **Brand Coral Hover**  | `#e05a4c` (`--color-coral-hover`)  | Hover state for buttons and active items       |
| **Badge Teal**         | `#177f99` (`--color-badge-teal`)   | Category tags, vehicle mileage indicators      |
| **Text Main**          | `#f0f0f5` (`--color-text-main`)    | Primary body and head text                     |
| **Text Muted**         | `#9a9ab0` (`--color-text-muted`)   | Secondary descriptions, timestamps, subheaders |

### 3.4 UI Element Stylesheet (`src/routes/layout.css`)

All UI elements are centrally defined in [`layout.css`](file:///home/user/dialogdev/breach/src/routes/layout.css) and MUST be rendered using these registered CSS component classes:

| Element Category     | CSS Component Class                             | Visual Description                                               |
| :------------------- | :---------------------------------------------- | :--------------------------------------------------------------- |
| **Primary Button**   | `.btn-primary`                                  | Solid Coral background (`#ff6f61`), white text, sharp corners    |
| **Secondary Button** | `.btn-secondary`                                | Dark card surface (`#222227`), border (`#2e2e36`), sharp corners |
| **Outline Button**   | `.btn-outline`                                  | Coral border & text, transparent bg, sharp corners               |
| **Danger Button**    | `.btn-danger`                                   | Red border & text, translucent red bg, sharp corners             |
| **Icon Button**      | `.btn-icon`                                     | Transparent square button, subtle hover effect                   |
| **Form Input**       | `.form-input`                                   | Dark card bg, sharp border, coral focus outline                  |
| **Form Select**      | `.form-select`                                  | Dark card bg dropdown, sharp corners                             |
| **Form Textarea**    | `.form-textarea`                                | Multiline dark card input, sharp corners                         |
| **Form Checkbox**    | `.form-checkbox`                                | Sharp square box with coral accent color                         |
| **File Upload Zone** | `.upload-zone`                                  | Dashed sharp border, hover highlight zone                        |
| **Teal Badge**       | `.badge-teal`                                   | Solid Teal badge (`#177f99`), uppercase, sharp corners           |
| **Coral Badge**      | `.badge-coral`                                  | Soft coral background badge, uppercase, sharp corners            |
| **Success Badge**    | `.badge-success`                                | Soft emerald background badge, sharp corners                     |
| **Warning Badge**    | `.badge-warning`                                | Soft amber background badge, sharp corners                       |
| **Card Surface**     | `.card-surface`                                 | Dark surface container (`#1a1a1e`), sharp border                 |
| **Metric Card**      | `.card-metric`                                  | Dark card (`#222227`) with left coral border line                |
| **Asset Card**       | `.card-asset`                                   | Interactive asset card with hover border highlight               |
| **Data Table**       | `.table-sharp`                                  | Dark table structure with zero border-radius                     |
| **Modal Container**  | `.modal-container`                              | Floating dialog surface (`#1a1a1e`) with header/body/footer      |
| **Alert Banners**    | `.alert-success`, `.alert-error`, `.alert-info` | Status alert banners with sharp borders                          |

_RULE: If any new UI element or component variant is developed, [`layout.css`](file:///home/user/dialogdev/breach/src/routes/layout.css) and [`specification.md`](file:///home/user/dialogdev/breach/specification.md) MUST be updated immediately._

---

## 4. Technology Stack & Architecture

- **Frontend Framework**: Svelte 5 with SvelteKit (strictly using Svelte 5 Runes `$state`, `$derived`, and snippets).
- **Toolchain**: Vite+ unified CLI (`vp`), Oxlint, Oxfmt, Vitest, Playwright.
- **Styling**: TailwindCSS v4 with custom CSS custom properties defined in `src/routes/layout.css`.
- **Icons**: `@lucide/svelte` (never deprecated `lucide-svelte`).
- **Runtime Environment**: Cloudflare Workers (via SvelteKit Cloudflare Adapter `@sveltejs/adapter-cloudflare`).
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM.
- **Authentication**: Better Auth with Drizzle SQLite adapter (`better-auth`).
- **Object Storage**: Cloudflare R2 (`RECEIPTS_BUCKET`) for uploaded invoices and receipts.
- **AI & Document OCR**: Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`) with fallback heuristic document parser (`/api/scan-document`).

---

## 5. Database Schema & Data Models

### 5.1 User Profile (`user_profiles`)

Extends Better Auth `user` table with household-specific preferences.

- `user_id` (TEXT, PK, FK -> `user.id` CASCADE)
- `phone` (TEXT)
- `address` (TEXT)
- `currency` (TEXT, default `'ZAR'`)
- `household_name` (TEXT, default `'My Household'`)
- `created_at`, `updated_at` (INTEGER timestamp ms)

### 5.2 Household Assets (`assets`)

Stores primary high-value assets.

- `id` (TEXT, PK, UUID)
- `user_id` (TEXT, FK -> `user.id` CASCADE)
- `type` (TEXT, Enum: `'vehicle' | 'home' | 'other'`)
- `name` (TEXT)
- `make` (TEXT)
- `model` (TEXT)
- `year_model` (INTEGER)
- `purchase_date` (INTEGER timestamp ms)
- `purchase_price_cents` (INTEGER)
- `current_valuation_cents` (INTEGER)
- `purchase_km` (INTEGER)
- `current_km` (INTEGER)
- `document_url` (TEXT)
- `notes` (TEXT)
- `created_at`, `updated_at` (INTEGER timestamp ms)

### 5.3 Asset Activities & Maintenance (`asset_activities`)

Tracks services, repairs, upgrades, and renovations per asset.

- `id` (TEXT, PK, UUID)
- `asset_id` (TEXT, FK -> `assets.id` CASCADE)
- `title` (TEXT)
- `category` (TEXT, Enum: `'maintenance' | 'upgrade' | 'repair' | 'renovation' | 'tax_insurance' | 'other'`)
- `cost_cents` (INTEGER)
- `vendor` (TEXT)
- `date` (INTEGER timestamp ms)
- `mileage_km` (INTEGER)
- `invoice_url` (TEXT)
- `notes` (TEXT)
- `created_at` (INTEGER timestamp ms)

### 5.4 Household Expenses (`expenses`)

General and asset-linked expense entries.

- `id` (TEXT, PK, UUID)
- `user_id` (TEXT, FK -> `user.id` CASCADE)
- `asset_id` (TEXT, FK -> `assets.id` SET NULL)
- `category` (TEXT, default `'general'`)
- `vendor` (TEXT)
- `amount_cents` (INTEGER)
- `currency` (TEXT, default `'ZAR'`)
- `date` (INTEGER timestamp ms)
- `receipt_url` (TEXT)
- `raw_ocr_data` (TEXT)
- `notes` (TEXT)
- `created_at` (INTEGER timestamp ms)

### 5.5 Receipt Documents Log (`receipt_documents`)

Audit trail of scanned receipts/invoices.

- `id` (TEXT, PK, UUID)
- `user_id` (TEXT, FK -> `user.id` CASCADE)
- `file_name` (TEXT)
- `file_url` (TEXT)
- `mime_type` (TEXT)
- `status` (TEXT, Enum: `'processing' | 'completed' | 'failed'`)
- `parsed_data` (TEXT JSON)
- `created_at` (INTEGER timestamp ms)

### 5.6 Master Data Expense Categories (`expense_categories`)

User-defined master data categories for automated receipt classification and spending allocation.

- `id` (TEXT, PK, UUID)
- `user_id` (TEXT, FK -> `user.id` CASCADE)
- `household_id` (TEXT, FK -> `households.id` CASCADE)
- `name` (TEXT)
- `slug` (TEXT)
- `icon` (TEXT, default `'Tag'`)
- `color` (TEXT, default `'coral'`)
- `keywords` (TEXT comma-separated keyword matching triggers)
- `is_default` (INTEGER, 1 for default system category, 0 for custom)
- `created_at`, `updated_at` (INTEGER timestamp ms)

### 5.7 Households & Member Management (`households`, `household_members`, `household_invites`)

- **`households`**: `id` (PK), `name`, `created_by_user_id` (FK -> `user.id`), `created_at`, `updated_at`.
- **`household_members`**: Junction table supporting multi-household membership. `id` (PK), `household_id` (FK -> `households.id`), `user_id` (FK -> `user.id`), `role` (`'owner' | 'admin' | 'member'`), `is_main` (`INTEGER`, 1 for main notification household, 0 otherwise), `joined_at`.
- **`household_invites`**: Stores generated invitation tokens. `id` (PK), `household_id` (FK), `invited_by_user_id` (FK), `email`, `name`, `role`, `token` (TEXT UNIQUE), `expires_at`, `created_at`.

---

## 6. Functional Application Modules

### 6.1 Landing Page & Dashboard (`/`)

- **Streamlined Header**: Clean overview header layout focus on asset capital spend and maintenance.
- **Financial Outlay KPI Cards**: Summarizes **Total Spend on Buying Assets** (initial purchase capital) and **Total Maintenance Spend** (repairs, tyres, servicing & upgrades).
- **Asset Cards Grid**: Interactive listing of family vehicles (with mileage counter, purchase cost, maintenance spend, and total outlay) and property assets.
- **Maintenance Activity Log**: Recent services, repairs, and home upgrades sorted chronologically.

### 6.2 Expense Management & OCR Scanning (`/expenses`)

- **Current Month Spend View**: Dedicated KPI metric displaying total current month spending thus far with transaction count. Filter toggle between "This Month" and "All Time".
- **Category Breakdown Metrics**: Dynamic spending progress bars per master data category with percentage distribution and interactive category filtering.
- **Receipt OCR Modal**: Drag-and-drop file uploader supporting images & PDFs. Connects to `/api/scan-document` for automatic extraction of:
  1. Company / Merchant name
  2. Purchase date
  3. Upload date
  4. Total amount in ZAR
  5. Automatic category matching against user-defined master data.
- **Expense Data Table**: Displays Company, Category, Purchase Date, Date Uploaded, and Amount, with digital receipt preview and deletion.

### 6.3 Document Processing API Endpoint (`/api/scan-document`)

- Accepts `multipart/form-data` with `file` and `documentType`.
- Saves uploaded files to Cloudflare R2 bucket (`RECEIPTS_BUCKET`) when running in production/wrangler environment.
- Executes Cloudflare Workers AI or heuristic keyword rule matching against master data categories to auto-categorize transactions.
- Logs scanned receipt document audit trails to `receipt_documents` table.

### 6.4 Master Data & Application Settings (`/settings`)

- **Expense Category Management**: View, create, update, and delete custom expense categories.
- **OCR Keyword Matching Rules**: Configure comma-separated merchant and product keywords for real-time receipt auto-categorization.
- **Color Accents & System Presets**: Distinguish categories by visual color accents and inspect system default vs custom user categories.

### 6.5 Household Profile & Multi-Household Management (`/profile`)

- **Multi-Household Architecture**: View all households user belongs to, switch active household, or create new households.
- **Main Household Selection**: Star/toggle a primary household (`is_main = 1`); notifications are filtered exclusively to the user's main household.
- **Member Invitation Link Generator**: Form to invite someone by entering Name, Email, and Role. Generates a unique share link (`/register?invite=inv_...`) that pre-fills details and links the user directly upon registration.
- **Member Roster & Pending Invites**: Displays current active household members and pending shareable invite links.
- User details form (Name, Email, Phone, Role) and database engine health overview.

### 6.6 Mandatory Authentication & Route Protection (`/login`, `/register`, `/logout`, `hooks.server.ts`)

- Powered by Better Auth with email and password registration (`/register`) and sign in (`/login`).
- Strict route protection enforced in `hooks.server.ts`: All application routes (`/`, `/assets`, `/expenses`, `/settings`, `/profile`, `/style-guide`) require authentication. Unauthenticated requests are automatically redirected to `/login`.
- Generic test credentials (`admin@breach.co.za` / `password123`) auto-provision seamlessly on fresh D1 database environments.
- Sign out action (`/logout`) invalidates user session cookies and redirects to `/login`.

### 6.7 UI Stylesheet Live Showcase (`/style-guide`)

- Dedicated, secret unlisted interactive design system showcase rendering all UI elements from [`layout.css`](file:///home/user/dialogdev/breach/src/routes/layout.css).
- Access: Secret direct URL endpoint (`/style-guide`). Not displayed in the primary navigation menu.
- Allows live testing and visual verification of buttons, badges, inputs, upload zones, cards, data tables, modal dialogs, and alert banners when the app is running.

---

## 7. Developer & Maintenance Workflows

1. **Installing Dependencies**:
   ```bash
   vp install
   ```
2. **Running Local Development Server**:
   ```bash
   vp run dev
   ```
3. **Validation & Quality Checks** (Formatting, Linting, Type Checking & Unit Tests):
   ```bash
   vp check
   vp test
   ```
4. **Updating Specification & Stylesheet**:
   - Any architectural changes, database schema migrations, newly added routes, modified brand rules, or newly developed UI elements **MUST be immediately documented in both `specification.md` and `src/routes/layout.css`**.
