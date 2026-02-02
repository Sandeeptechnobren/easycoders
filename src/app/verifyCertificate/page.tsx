'use client';
import { useState } from 'react';
export default function VerifyCertificate() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (identifier === "EC-2026-101") {
        setResult({
          studentName: "Aarav Sharma",
          course: "Full Stack Web Development",
          issueDate: "Jan 15, 2026",
          status: "Verified"
        });
      } else {
        alert("Certificate not found. Please check the ID.");
        setResult(null);
      }
      setLoading(false);
    }, 1500);
  };
  return (
    <div style={{ width: '100%', minHeight: '100vh' }} className='global-header-bg'>
      <div 
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '30px',
          padding: '40px 20px'
        }}
      >
        <span style={{
          color: 'white',
          fontSize: 'clamp(30px, 6vw, 48px)',
          fontWeight: '900',
          textShadow: '0 4px 15px rgba(0,0,0,0.4)',
          textAlign: 'center'
        }}>
          Verify Certificate
        </span>
        {!result ? (
          <form 
            onSubmit={handleVerify}
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(15px)',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}
          >
            <div className="formGroup" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'white', fontWeight: '500', opacity: 0.9 }}>Certificate ID/ Enrollment ID</label>
              <input 
                type="text" 
                placeholder="Enter ID (Try: EC-2026-101)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="formInput"
                style={{ padding: '14px', borderRadius: '14px', border: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              className="formButton"
              disabled={loading}
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: loading ? '#ccc' : 'white',
                color: '#8B5CF6',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Searching...' : 'Verify Now'}
            </button>
          </form>
        ) : (
          <div 
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'white',
              borderRadius: '28px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.5s ease-out'
            }}
          >
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ color: '#1a1a1a', fontWeight: '800' }}>Certificate Verified</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>This certificate is authentic and issued by Easy Coders.</p>
            <div style={{ textAlign: 'left', background: '#f9f9f9', padding: '20px', borderRadius: '16px', borderLeft: '5px solid #8B5CF6' }}>
              <p><strong>Student:</strong> {result.studentName}</p>
              <p><strong>Course:</strong> {result.course}</p>
              <p><strong>Date of Issue:</strong> {result.issueDate}</p>
            </div>
            <button 
              onClick={() => setResult(null)}
              style={{ marginTop: '25px', background: 'none', border: 'none', color: '#8B5CF6', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Verify Another
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}