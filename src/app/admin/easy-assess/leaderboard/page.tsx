'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminComingSoon } from '@/components/admin/AdminSection';

export default function AssessmentLeaderboardAdmin() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Leaderboard"
        description="Live ranking of Easy Assess users by score, with filters and time-window controls."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Leaderboard' },
        ]}
      >
        <AdminComingSoon
          whatItWillDo="An admin view of the live leaderboard with the filtering and moderation controls students don't see — useful for spot-checking suspicious scores, recognising top performers and pulling cohorts for outreach."
          capabilities={[
            'Filter by assessment / language / time window',
            'Set a minimum-score threshold',
            'Flag or hide suspect attempts from the public leaderboard',
            'Export the top-N list as CSV',
            'See aggregate stats (avg score, attempts per day) at a glance',
          ]}
          backHref="/admin/easy-assess"
          backLabel="Back to Easy Assess"
        />
      </AdminSection>
    </RoleGuard>
  );
}
