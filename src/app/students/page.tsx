'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* Deprecated. This was a mis-gated (admin-only) copy of /admin/students that
   also fetched the assessment-takers feed. The real enrolled-students
   directory lives at /admin/students (admin) and /hr/students (HR); students
   themselves land on /student-dashboard. Redirect to keep any stray link working. */
export default function DeprecatedStudentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/students');
  }, [router]);
  return null;
}
