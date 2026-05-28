'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/studentManagement — DEPRECATED
 *
 * The old "add student" form generated a client-side Math.random() password
 * and POSTed to /register (no role guard, no validation, no profile data).
 * It has been superseded by /admin/admissions, which collects the full
 * student record and atomically creates the account with a server-issued
 * temporary password. This stub just forwards there so old bookmarks/links
 * keep working.
 * ────────────────────────────────────────────────────────────────────────── */

export default function StudentManagementRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/admissions');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F6FB',
        color: '#4A5568',
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        fontSize: 14,
        padding: 24,
      }}
    >
      Redirecting to the new admissions flow…
    </div>
  );
}
