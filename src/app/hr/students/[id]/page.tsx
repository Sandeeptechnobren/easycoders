'use client';

import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import StudentDetailManager from '@/components/StudentDetailManager';

/* /hr/students/[id] — enrolled-student detail + full management (HR). */
export default function HrStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <RoleGuard allowedRoles={[2]}>
      <StudentDetailManager
        studentId={id}
        canManage
        backHref="/hr/students"
        crumbs={[
          { label: 'HR', href: '/hr' },
          { label: 'Students', href: '/hr/students' },
          { label: 'Details' },
        ]}
      />
    </RoleGuard>
  );
}
