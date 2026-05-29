'use client';

import RoleGuard from '@/components/RoleGuard';
import StudentDirectory from '@/components/StudentDirectory';

/* /hr/students — enrolled-students roster (real users, role 3). */
export default function HrStudentsPage() {
  return (
    <RoleGuard allowedRoles={[2]}>
      <StudentDirectory
        detailBase="/hr/students"
        crumbs={[
          { label: 'HR', href: '/hr' },
          { label: 'Students' },
        ]}
      />
    </RoleGuard>
  );
}
