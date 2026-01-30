'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
type Props = {
  allowedRoles: number[];
  children: React.ReactNode;
};
export default function RoleGuard({ allowedRoles, children }: Props) {
  const { role, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (!role || !allowedRoles.includes(role)) {
        router.replace('/login');
      }
    }
  }, [role, loading, allowedRoles, router]);

  if (loading) return null;

  return <>{children}</>;
}
