'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminComingSoon } from '@/components/admin/AdminSection';

export default function AssessmentCertificatesAdmin() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Certificate Log"
        description="Audit every certificate the platform has issued — who earned it, when, on which assessment, and the verifiable certificate code."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Certificates' },
        ]}
      >
        <AdminComingSoon
          whatItWillDo="Each certificate carries a stable EC… code that anyone can verify at /verifyCertificate. This module will be the admin's audit trail for the same data — a chronological log of who earned what."
          capabilities={[
            'Browse all issued certificates, newest first',
            'Search by certificate code / user / assessment',
            'Filter by date range and score',
            'Re-download a certificate PDF on demand',
            'Revoke a certificate (e.g. on suspected cheating)',
          ]}
          backHref="/admin/easy-assess"
          backLabel="Back to Easy Assess"
        />
      </AdminSection>
    </RoleGuard>
  );
}
