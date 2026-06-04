'use client';

import RoleGuard from '@/components/RoleGuard';
import TaskGrading from '@/components/TaskGrading';

// HR task grading — batch → student → tasks → mark (shared with admin).
export default function HrTasksPage() {
  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <TaskGrading eyebrow="Easy Coders · HR" />
    </RoleGuard>
  );
}
