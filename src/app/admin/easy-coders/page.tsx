'use client';

import RoleGuard from '@/components/RoleGuard';
import { AdminSection, AdminCard, AdminCardGrid } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * Easy Coders Management — section dashboard
 *
 * Lists every admin tool for the training-company side of the platform.
 * All cards point at existing routes — file structure was deliberately
 * left alone so bookmarks keep working. Future Phase 3 (optional) can
 * relocate those files under /admin/easy-coders/* if desired.
 *
 * Permissions sits in this section because every role it manages
 * (admin / HR / trainer / student) is an Easy Coders role.
 * ────────────────────────────────────────────────────────────────────────── */

export default function EasyCodersAdminHome() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Admin"
        title="Easy Coders Management"
        description="Run the training company. Manage admissions, batches, students, trainers, fees, attendance, support tickets, courses and platform permissions all from one place."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders' },
        ]}
      >
        <AdminCardGrid>
          <AdminCard
            href="/admin/batches"
            title="Batches"
            description="Create training batches, assign trainers and track active learners across cohorts."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/students"
            title="Students"
            description="Browse the student roster and open individual profiles with fees, attendance and login credentials."
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
            href="/admin/admissions"
            title="Admit a Student"
            description="Register a student with full details, pick their program and course, set the fee plan, and issue dashboard login credentials in one step."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/certificates"
            title="Certificates"
            description="Generate an official Certificate of Completion for anyone — enter the name, technology and details — then download, re-download or revoke it. Verifiable via QR code."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/elite-cards"
            title="Elite Alumni Cards"
            description="Issue premium, verifiable Elite Alumni Cards to first-batch students and alumni — with lifetime perks, discounts and priority placement. Download or revoke anytime."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
                <path d="M6 15h4" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/enrollmentRequests"
            title="Enrollment Requests"
            description="Review enrollment requests submitted via the public registration popup and convert them to admissions."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
          />

          <AdminCard
            href="/hr/attendance"
            title="Attendance"
            description="View attendance records, mark or correct entries, and manage approved attendance-location IPs."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          />

          <AdminCard
            href="/hr/fee"
            title="Fees & Payments"
            description="Track fee installments, mark payments received, and reconcile dues across all enrolled students."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/trainerManagement"
            title="Trainers"
            description="Onboard new trainers, set their teaching tracks and grant them access to the trainer dashboard."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/tasks"
            title="Tasks"
            description="Browse all tasks assigned to students across batches; track submissions and grading status."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/tickets"
            title="Tickets"
            description="Triage support tickets raised by students, assign them to trainers and resolve threaded conversations."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/contactInquiries"
            title="Contact Inquiries"
            description="Read messages submitted via the public Contact Us form and follow up on prospect enquiries."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/courses"
            title="Courses"
            description="Manage course offerings — pricing, level, seats, thumbnail and publish status across the public site."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/categories"
            title="Categories"
            description="Create and edit course categories and their feature bullets (Summer Training, Internship, Job-Oriented Programs)."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/ads"
            title="Ad Settings"
            description="Manage the promos shown on the app login screen and review the leads captured when students tap an ad."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            }
          />

          <AdminCard
            href="/admin/permissions"
            title="Permissions"
            description="Set role defaults and per-user grant / revoke overrides across admin, HR, trainer and student roles."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />
        </AdminCardGrid>
      </AdminSection>
    </RoleGuard>
  );
}
