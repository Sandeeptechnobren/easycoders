'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminComingSoon } from '@/components/admin/AdminSection';

export default function TypingContentAdmin() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Typing Content"
        description="Manage the pool of code snippets that the typing-speed game serves up to students."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Typing Content' },
        ]}
      >
        <AdminComingSoon
          whatItWillDo="The typing-speed game currently pulls random snippets from a fixed pool. This module will let admins curate that pool — add new language-specific snippets, retire outdated ones and balance difficulty levels."
          capabilities={[
            'Add code snippets per language (JS, Python, Java, etc.)',
            'Tag snippets by difficulty (easy / medium / hard)',
            'Preview how each snippet renders in the game UI',
            'Toggle active / archived state without deleting',
          ]}
          backHref="/admin/easy-assess"
          backLabel="Back to Easy Assess"
        />
      </AdminSection>
    </RoleGuard>
  );
}
