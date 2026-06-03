'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The bare add-category form was replaced by the full Category Management screen.
export default function AddCategoryRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/categories'); }, [router]);
  return null;
}
