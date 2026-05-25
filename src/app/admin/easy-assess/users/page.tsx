'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminComingSoon } from '@/components/admin/AdminSection';

export default function AssessmentUsersAdmin() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Assessment Users"
        description="Browse and manage registered Easy Assess accounts — the public, open self-assessment platform user base."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Users' },
        ]}
      >
        <AdminComingSoon
          whatItWillDo="The Easy Assess sub-app keeps its own user table (assement_users) separate from the main training-platform users. This module will surface that user base in an admin view."
          capabilities={[
            'Search assessment users by name / email / college',
            'View each user’s completed attempts and certificate codes',
            'Update interest status (Interested / Call Back / Not Set …)',
            'Export filtered lists as CSV for follow-up campaigns',
            'See last-login and engagement timestamps',
          ]}
          backHref="/admin/easy-assess"
          backLabel="Back to Easy Assess"
        />
      </AdminSection>
    </RoleGuard>
  );
}
