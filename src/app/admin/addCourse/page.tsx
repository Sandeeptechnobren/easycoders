'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The bare add-course form was replaced by the full Course Management screen.
export default function AddCourseRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/courses'); }, [router]);
  return null;
}
