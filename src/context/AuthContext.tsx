'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  role: string | null;
  user: any | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
}

type AuthContextValue = {
  role: string | null;
  user: any | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  login: (userRole: string, userData: any, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const API_USER_URL = 'https://api.easycoders.in/projects/backend/public/api/user';

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<AuthState>({
    role: null,
    user: null,
    token: null,
    permissions: [],
    isLoading: true,
  });

  const router = useRouter();

  // Validate token with backend. The backend's /api/user response now
  // includes a `permissions: string[]` array (union of Spatie role
  // permissions + per-user grants minus per-user revokes).
  const validateToken = async (token: string) => {
    try {
      const response = await fetch(API_USER_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return { valid: true, userData };
      } else {
        return { valid: false, userData: null };
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      return { valid: false, userData: null };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser  = localStorage.getItem('user');
        const storedRole  = localStorage.getItem('role');

        if (storedToken && storedUser && storedRole) {
          const validation = await validateToken(storedToken);

          if (validation.valid) {
            const perms = Array.isArray(validation.userData?.permissions)
              ? validation.userData.permissions
              : [];
            setAuthState({
              role: storedRole,
              user: storedUser ? JSON.parse(storedUser) : null,
              token: storedToken,
              permissions: perms,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear localStorage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            setAuthState({
              role: null,
              user: null,
              token: null,
              permissions: [],
              isLoading: false,
            });

            if (window.location.pathname !== '/') {
              router.replace('/');
            }
          }
        } else {
          setAuthState({
            role: null,
            user: null,
            token: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState({
          role: null,
          user: null,
          token: null,
          permissions: [],
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, [router]);

  const login = (userRole: string, userData: any, token: string) => {
    // Set immediate state from the login response so the UI can transition
    // right away. Permissions are then populated asynchronously.
    setAuthState({
      role: userRole,
      user: userData,
      token: token,
      permissions: [],
      isLoading: false,
    });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);

    // Fire-and-forget: fetch /api/user to learn this user's permission set
    // and merge it into state. The next page render will see them.
    validateToken(token)
      .then(({ valid, userData: fresh }) => {
        if (valid && Array.isArray(fresh?.permissions)) {
          setAuthState((prev) => ({ ...prev, permissions: fresh.permissions }));
        }
      })
      .catch(() => { /* swallow — permissions just stay empty until next mount */ });
  };

  const logout = () => {
    setAuthState({
      role: null,
      user: null,
      token: null,
      permissions: [],
      isLoading: false,
    });
    localStorage.clear();
    router.replace('/');
  };

  return (
    <AuthContext.Provider
      value={{
        role: authState.role,
        user: authState.user,
        token: authState.token,
        permissions: authState.permissions,
        isLoading: authState.isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
