import { and, eq, isNull, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { TenantContext } from '$lib/types';

/**
 * Returns a strict filter condition that guarantees scope isolation:
 * - In household mode (activeHouseholdId is set): strictly queries records belonging to that household.
 * - In personal mode (activeHouseholdId is null): strictly queries records where householdId IS NULL and userId matches.
 *
 * This prevents cross-context data leakage between personal records and household records.
 */
export function tenantFilter(
	userCol: SQLiteColumn,
	householdCol: SQLiteColumn,
	tenant: TenantContext | null | undefined
): SQL {
	if (!tenant || !tenant.userId) {
		throw new Error('Unauthenticated tenant context');
	}

	if (tenant.activeHouseholdId) {
		return eq(householdCol, tenant.activeHouseholdId);
	}

	return and(isNull(householdCol), eq(userCol, tenant.userId))!;
}
