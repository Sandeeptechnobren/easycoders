'use client';
import { useEffect } from 'react';

export default function AssessmentSuccess() {
  useEffect(() => {
    for (let i = 0; i < 80; i++) {
      const dot = document.createElement('div');
      dot.style.position = 'fixed';
      dot.style.top = '-10px';
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.background = ['#22c55e', '#6366f1', '#f59e0b'][i % 3];
      dot.style.borderRadius = '50%';
      dot.style.animation = 'fall 3s linear';
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 3000);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`@keyframes fall{to{transform:translateY(110vh)}}`}</style>

      <div
        style={{
          background: '#fff',
          padding: 40,
          borderRadius: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 64 }}>🎉</div>
        <h1>Assessment Submitted!</h1>
        <p>You did an amazing job 🚀</p>
      </div>
    </div>
  );
}
