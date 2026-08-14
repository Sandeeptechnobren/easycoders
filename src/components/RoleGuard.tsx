'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/Loader';

type Props = {
  allowedRoles: number[];
  children: React.ReactNode;
};

export default function RoleGuard({ allowedRoles, children }: Props) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Convert role to number for comparison
      const roleNum = role ? parseInt(role, 10) : null;
      
      if (!roleNum) {
        router.replace('/login');
        return;
      }

      if (!allowedRoles.includes(roleNum)) {
        // Redirect users to their proper dashboard based on role
        if (roleNum === 3) {
          router.replace('/student-dashboard');
        } else if (roleNum === 1) {
          router.replace('/admin');
        } else if (roleNum === 2) {
          router.replace('/hr');
        } else if (roleNum === 4) {
          router.replace('/trainer');
        } else {
          router.replace('/');
        }
      }
    }
  }, [role, isLoading, allowedRoles, router]);

  // Show loading state while checking authentication.
  // This is the most-seen loader in the app — it renders on EVERY role-gated
  // page while the token is validated. It used to be a raw Bootstrap
  // `.spinner-border`, which lives in the CDN stylesheet and so could not be
  // themed or restyled; the shared Loader is token-driven and follows the
  // active theme.
  if (isLoading) {
    return <Loader fullscreen label="Checking your access…" />;
  }

  // Convert role to number for comparison
  const roleNum = role ? parseInt(role, 10) : null;

  // If user doesn't have the right role, return null (will redirect in useEffect)
  if (!roleNum || !allowedRoles.includes(roleNum)) {
    return null;
  }

  return <>{children}</>;
}
