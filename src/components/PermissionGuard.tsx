'use client';

import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

type Props = {
  /** Single permission name or array. By default ANY one is enough. */
  requires: string | string[];
  /** Set to true to require ALL listed permissions (default: ANY). */
  requireAll?: boolean;
  /** What to render when the user lacks the permission(s). Defaults to nothing. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Gate a section of UI by the user's resolved permission set.
 *
 * Unlike <RoleGuard> which checks the numeric role only, <PermissionGuard>
 * checks the resolved permission array from AuthContext. A trainer who has
 * been granted `manage_queries` (whole-role grant via /admin/permissions OR
 * per-user override) will pass the gate; a trainer without it won't.
 *
 *   <PermissionGuard requires="manage_queries">
 *     <TicketQueue />
 *   </PermissionGuard>
 *
 *   <PermissionGuard requires={['manage_queries', 'respond_queries']}>
 *     <TicketRespondBox />
 *   </PermissionGuard>
 *
 * While the auth context is still loading (initial token validation),
 * children are NOT rendered — this avoids a flash of gated content before
 * the permission list arrives. Use fallback={...} for a placeholder.
 */
export default function PermissionGuard({
  requires,
  requireAll = false,
  fallback = null,
  children,
}: Props) {
  const { permissions, isLoading } = useAuth();

  if (isLoading) return null;

  const allowed = hasPermission(permissions, requires, { all: requireAll });
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
