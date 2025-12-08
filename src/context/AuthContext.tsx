'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) setRole(storedRole);
  }, []);
  const login = (userRole: string) => {
    setRole(userRole);
    localStorage.setItem('role', userRole);
  };
  const logout = () => {
    setRole(null);
    localStorage.clear();
  };
  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
