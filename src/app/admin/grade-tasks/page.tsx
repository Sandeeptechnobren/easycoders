'use client';

import RoleGuard from '@/components/RoleGuard';
import TaskGrading from '@/components/TaskGrading';

// Admin task grading — batch → student → tasks → mark (shared with HR).
export default function AdminGradeTasksPage() {
  return (
    <RoleGuard allowedRoles={[1]}>
      <TaskGrading eyebrow="Easy Coders · Admin" />
    </RoleGuard>
  );
}
