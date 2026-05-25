'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminComingSoon } from '@/components/admin/AdminSection';

/* Stub placeholder — the actual Coding Questions admin UI is on the
 * roadmap. The URL structure exists today so the dashboard can link to
 * it; the page itself will be fleshed out in a follow-up. */
export default function CodingQuestionsAdmin() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Coding Questions"
        description="A central admin view for the coding-challenge bank used by the practice editor and coding-section of every assessment."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Coding Questions' },
        ]}
      >
        <AdminComingSoon
          whatItWillDo="Manage the bank of coding challenges that Easy Assess uses across its practice editor and the coding section of every assessment. Each question carries its description, starter code, language settings and grading test cases."
          capabilities={[
            'Create / edit / archive coding questions',
            'Tag questions by topic and difficulty',
            'Attach hidden + visible test cases',
            'Preview the editor experience exactly as students see it',
            'Bulk-import questions from a JSON / CSV file',
          ]}
          backHref="/admin/easy-assess"
          backLabel="Back to Easy Assess"
        />
      </AdminSection>
    </RoleGuard>
  );
}
