'use client';

import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import StudentDetailManager from '@/components/StudentDetailManager';

/* /trainer/students/[id] — enrolled-student detail, read-only (trainer). */
export default function TrainerStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <RoleGuard allowedRoles={[4]}>
      <StudentDetailManager
        studentId={id}
        canManage={false}
        backHref="/trainer/students"
        crumbs={[
          { label: 'Trainer', href: '/trainer' },
          { label: 'Students', href: '/trainer/students' },
          { label: 'Details' },
        ]}
      />
    </RoleGuard>
  );
}
