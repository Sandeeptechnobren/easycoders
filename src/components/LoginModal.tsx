'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post('/login', { email, password });

      const token = response.data.data.access_token;
      const user = response.data.data.user;
      const role = user.role;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);
      login(role);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      onClose();
      if (role === 1) router.push('/admin');
      else if (role === 2) router.push('/hr');
      else if (role === 3) router.push('/students');
      else if (role === 4) router.push('/trainer');
      else router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  return (
    <div className="modalOverlay">
      <div className="modalBox">
        <button className="closeBtn" onClick={onClose}>✕</button>
        <div className='text-center mb-4'>
            <h4 className="mb-2 ">Welcome Back</h4>
            <p>Login to continue your learning journey</p>
        </div>
        {error && (
          <div className="errorBox">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="loginForm">
        <label className='formLabel'>Email Address</label>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className='formLabel'>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="formButton">
            Login →
          </button>
        </form>
      </div>
    </div>
  );
}