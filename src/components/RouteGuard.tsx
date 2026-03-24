'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: number[];
  requireAuth?: boolean;
}

export default function RouteGuard({ children, allowedRoles, requireAuth = false }: RouteGuardProps) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If still loading, don't do anything yet
    if (isLoading) return;

    // Convert role to number for comparison
    const roleNum = role ? parseInt(role, 10) : null;

    // If authentication is required but user is not logged in
    if (requireAuth && !role) {
      router.replace('/');
      return;
    }

    // If specific roles are required and user doesn't have the right role
    if (allowedRoles && allowedRoles.length > 0 && (!roleNum || !allowedRoles.includes(roleNum))) {
      router.replace('/');
      return;
    }
  }, [role, isLoading, requireAuth, allowedRoles, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Convert role to number for comparison
  const roleNum = role ? parseInt(role, 10) : null;

  // If authentication is required but user is not logged in
  if (requireAuth && !role) {
    return null; // Will redirect in useEffect
  }

  // If specific roles are required and user doesn't have the right role
  if (allowedRoles && allowedRoles.length > 0 && (!roleNum || !allowedRoles.includes(roleNum))) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
