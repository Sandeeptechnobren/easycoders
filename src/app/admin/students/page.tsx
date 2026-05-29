'use client';

import RoleGuard from '@/components/RoleGuard';
import StudentDirectory from '@/components/StudentDirectory';

/* /admin/students — enrolled-students roster (real users, role 3). */
export default function AdminStudentsPage() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <StudentDirectory
        showAdmit
        detailBase="/admin/students"
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Students' },
        ]}
      />
    </RoleGuard>
  );
}
