CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "role" TEXT DEFAULT 'user',
  "disabled" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expires_at" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" INTEGER,
  "refresh_token_expires_at" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "user_invite" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "expires_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "user_id" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "phone" TEXT,
  "address" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "household_name" TEXT DEFAULT 'My Household',
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "households" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "created_by_user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "household_members" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "household_id" TEXT NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'member',
  "is_main" INTEGER NOT NULL DEFAULT 0,
  "joined_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "household_invites" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "household_id" TEXT NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
  "invited_by_user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "assets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "household_id" TEXT REFERENCES "households"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'vehicle',
  "name" TEXT NOT NULL,
  "make" TEXT,
  "model" TEXT,
  "year_model" INTEGER,
  "purchase_date" INTEGER,
  "purchase_price_cents" INTEGER NOT NULL DEFAULT 0,
  "current_valuation_cents" INTEGER NOT NULL DEFAULT 0,
  "purchase_km" INTEGER,
  "current_km" INTEGER,
  "document_url" TEXT,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "updated_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "asset_activities" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "asset_id" TEXT NOT NULL REFERENCES "assets"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'maintenance',
  "cost_cents" INTEGER NOT NULL DEFAULT 0,
  "vendor" TEXT,
  "date" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "mileage_km" INTEGER,
  "invoice_url" TEXT,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "household_id" TEXT REFERENCES "households"("id") ON DELETE CASCADE,
  "asset_id" TEXT REFERENCES "assets"("id") ON DELETE SET NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "vendor" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "date" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  "receipt_url" TEXT,
  "raw_ocr_data" TEXT,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS "receipt_documents" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "household_id" TEXT REFERENCES "households"("id") ON DELETE CASCADE,
  "file_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "status" TEXT DEFAULT 'processing',
  "parsed_data" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
