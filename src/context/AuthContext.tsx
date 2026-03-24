'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthState {
  role: string | null;
  user: any | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<{
  role: string | null;
  user: any | null;
  token: string | null;
  isLoading: boolean;
  login: (userRole: string, userData: any, token: string) => void;
  logout: () => void;
} | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<AuthState>({
    role: null,
    user: null,
    token: null,
    isLoading: true,
  });
  
  const router = useRouter();

  // Validate token with backend
  const validateToken = async (token: string) => {
    try {
      const response = await fetch('https://api.easycoders.in/projects/backend/public/api/user', {
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
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('role');

        if (storedToken && storedUser && storedRole) {
          // Validate token with backend
          const validation = await validateToken(storedToken);
          
          if (validation.valid) {
            setAuthState({
              role: storedRole,
              user: storedUser ? JSON.parse(storedUser) : null,
              token: storedToken,
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
              isLoading: false,
            });
            
            // Only redirect if not on login page
            if (window.location.pathname !== '/') {
              router.replace('/');
            }
          }
        } else {
          // No stored auth data
          setAuthState({
            role: null,
            user: null,
            token: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState({
          role: null,
          user: null,
          token: null,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, [router]);

  const login = (userRole: string, userData: any, token: string) => {
    setAuthState({
      role: userRole,
      user: userData,
      token: token,
      isLoading: false,
    });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
  };

  const logout = () => {
    setAuthState({
      role: null,
      user: null,
      token: null,
      isLoading: false,
    });
    localStorage.clear();
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ 
      role: authState.role, 
      user: authState.user, 
      token: authState.token,
      isLoading: authState.isLoading,
      login, 
      logout 
    }}>
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
