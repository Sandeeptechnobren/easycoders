'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* Consolidated. Batch management now lives at /admin/batches (a single hub
   for admin + HR — RoleGuard allows roles 1 and 2). This page used to be a
   create-only form (with ~388 lines of dead commented code above it); it now
   redirects so old links keep working. */
export default function BatchManagementRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/batches'); }, [router]);
  return null;
}
