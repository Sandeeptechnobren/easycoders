'use client';
import { useEffect, useState } from 'react';
import AssessmentCards from './assessment/[id]/AssessmentCards';
export default function AssessmentDashboard() {
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const storedName = localStorage.getItem('logged_in_user');
    const storedEmail = localStorage.getItem('assessment_user');
    console.log(storedName);
    if (storedName) {
      setUserName(storedName);
    } else if (storedEmail) {
      setUserName(storedEmail.split('@')[0]);
    } else {
      setUserName('Learner');
    }
  }, []);
  return (
    <div>
      <header style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#111827',
          margin: 0
        }}>
          Hi {userName || '...'}!
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', marginTop: '6px' }}>
          Welcome back! Here are your active assessments.
        </p>
      </header>
      <AssessmentCards />
    </div>
  );
}