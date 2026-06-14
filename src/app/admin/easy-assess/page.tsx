'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminCard, AdminCardGrid } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * Easy Assess Management — section dashboard
 *
 * Lists every Easy Assess admin tool. Only Assessments is wired up today;
 * the other five cards route to placeholder pages flagged as "Coming
 * soon" so the URL structure exists and the modules can be fleshed out
 * one at a time without re-touching this dashboard.
 * ────────────────────────────────────────────────────────────────────────── */

export default function EasyAssessAdminHome() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Admin"
        title="Easy Assess Management"
        description="Manage the public coding-assessment platform. Build assessment definitions, maintain the coding-question bank, review the leaderboard and audit issued certificates."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess' },
        ]}
      >
        <AdminCardGrid>
          <AdminCard
            href="/admin/assessments"
            title="Assessments"
            description="Create assessment papers, set duration / passing score, attach questions and toggle the published status."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 9h8M8 13h5M8 17h6" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/code-review"
            title="Code Review"
            description="Review and score coding answers — auto-graded results plus open / free-form submissions waiting for a trainer's mark."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="12" y1="2" x2="10" y2="22" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/coding-questions"
            status="coming-soon"
            title="Coding Questions"
            description="Maintain the bank of coding challenges that drive the practice editor and coding-section of each assessment."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/typing-content"
            status="coming-soon"
            title="Typing Content"
            description="Manage code snippets used by the typing-speed game so students can practice on real, language-appropriate text."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/users"
            title="Assessment Users"
            description="Browse registered Easy Assess accounts, view their interest status, completed attempts and contact details."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/leaderboard"
            status="coming-soon"
            title="Leaderboard"
            description="View the live ranking of assessment users — filter by track, time window and minimum score."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
                <path d="M17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/easy-assess/certificates"
            status="coming-soon"
            title="Certificate Log"
            description="Audit every certificate issued — who, when, which assessment, score, and the verifiable certificate code."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <circle cx="12" cy="11" r="3" />
                <path d="M9 15l-1 5 4-2 4 2-1-5" />
              </svg>
            }
          />
        </AdminCardGrid>
      </AdminSection>
    </RoleGuard>
  );
}
