'use client';

import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import StudentDetailManager from '@/components/StudentDetailManager';

/* /admin/students/[id] — enrolled-student detail + full management (admin). */
export default function AdminStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <RoleGuard allowedRoles={[1]}>
      <StudentDetailManager
        studentId={id}
        canManage
        backHref="/admin/students"
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Students', href: '/admin/students' },
          { label: 'Details' },
        ]}
      />
    </RoleGuard>
  );
}
