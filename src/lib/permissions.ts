/**
 * Permission helpers — companion to AuthContext.
 *
 * The backend's /api/user endpoint returns the user's full resolved permission
 * set (Spatie role permissions ∪ per-user grants ∖ per-user revokes). It's
 * stored in AuthContext and read here.
 *
 * Usage:
 *
 *   const canManageQueries = useHasPermission('manage_queries');
 *   const canManageOrRespond = useHasPermission(['manage_queries', 'respond_queries']);  // any
 *   const canBoth = useHasPermission(['manage_queries', 'respond_queries'], { all: true });
 *
 * For non-React contexts:
 *
 *   if (hasPermission(authState.permissions, 'raise_query')) { ... }
 */

import { useAuth } from '@/context/AuthContext';

type RequireOpts = { all?: boolean };

export function hasPermission(
  permissions: string[] | null | undefined,
  required: string | string[],
  opts: RequireOpts = {},
): boolean {
  const haystack = Array.isArray(permissions) ? permissions : [];
  const needles  = Array.isArray(required) ? required : [required];
  if (needles.length === 0) return true;
  return opts.all
    ? needles.every((p) => haystack.includes(p))
    : needles.some((p)  => haystack.includes(p));
}

export function useHasPermission(
  required: string | string[],
  opts: RequireOpts = {},
): boolean {
  const { permissions } = useAuth();
  return hasPermission(permissions, required, opts);
}
