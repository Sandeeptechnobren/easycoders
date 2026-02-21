// 'use client';
// import { useState } from 'react';
// type VerifyApiResponse = {
//   success: boolean;
//   message: string;
//   data?: {
//     certificate_code: string;
//     user: { id: number; name: string; email: string };
//     assessment: { id: number; title: string };
//     score: number;
//     completed_at: string;
//   };
// };
// export default function VerifyCertificate() {
//   const [identifier, setIdentifier] = useState('');
//   const [result, setResult] = useState<VerifyApiResponse['data'] | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string>('');

//   const handleVerify = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setErrorMsg('');
//     setResult(null);

//     try {
//       const code = identifier.trim().toUpperCase();
//       const url =
//         `https://api.easycoders.in/projects/backend/public/api/certificate/verify` +
//         `?certificate_code=${encodeURIComponent(code)}`;
//       const res = await fetch(url, {
//         method: 'GET',
//         headers: {
//           Accept: 'application/json',
//         },
//       });

//       const json: VerifyApiResponse = await res.json();

//       if (!res.ok || !json?.success) {
//         setErrorMsg(json?.message || 'Certificate not found. Please check the ID.');
//         setLoading(false);
//         return;
//       }

//       setResult(json.data ?? null);
//       setLoading(false);
//     } catch (err) {
//       console.error(err);
//       setErrorMsg('Server error. Please try again later.');
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ width: '100%', minHeight: '100vh' }} className="global-header-bg">
//       <div
//         style={{
//           width: '100%',
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           justifyContent: 'center',
//           gap: '30px',
//           padding: '40px 20px',
//         }}
//       >
//         <span
//           style={{
//             color: 'white',
//             fontSize: 'clamp(30px, 6vw, 48px)',
//             fontWeight: '900',
//             textShadow: '0 4px 15px rgba(0,0,0,0.4)',
//             textAlign: 'center',
//           }}
//         >
//           Verify Certificate
//         </span>

//         {!result ? (
//           <form
//             onSubmit={handleVerify}
//             style={{
//               width: '100%',
//               maxWidth: '420px',
//               padding: '30px',
//               background: 'rgba(255, 255, 255, 0.12)',
//               backdropFilter: 'blur(15px)',
//               borderRadius: '28px',
//               border: '1px solid rgba(255, 255, 255, 0.2)',
//               display: 'flex',
//               flexDirection: 'column',
//               gap: '20px',
//               boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
//             }}
//           >
//             <div className="formGroup" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//               <label style={{ color: 'white', fontWeight: '500', opacity: 0.9 }}>
//                 Certificate ID/ Enrollment ID
//               </label>

//               <input
//                 type="text"
//                 placeholder="Enter ID (Try: EC0031)"
//                 value={identifier}
//                 onChange={(e) => setIdentifier(e.target.value)}
//                 required
//                 className="formInput"
//                 style={{ padding: '14px', borderRadius: '14px', border: 'none' }}
//               />

//               {/* ✅ error line (design unchanged, only shown on error) */}
//               {errorMsg ? (
//                 <div
//                   style={{
//                     marginTop: '6px',
//                     color: '#fff',
//                     background: 'rgba(239, 68, 68, 0.25)',
//                     border: '1px solid rgba(239, 68, 68, 0.35)',
//                     padding: '10px 12px',
//                     borderRadius: '14px',
//                     fontSize: '13px',
//                   }}
//                 >
//                   {errorMsg}
//                 </div>
//               ) : null}
//             </div>

//             <button
//               type="submit"
//               className="formButton"
//               disabled={loading}
//               style={{
//                 padding: '16px',
//                 borderRadius: '14px',
//                 background: loading ? '#ccc' : 'white',
//                 color: '#8B5CF6',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//               }}
//             >
//               {loading ? 'Verifying...' : 'Verify Now'}
//             </button>
//           </form>
//         ) : (
//           <div
//             style={{
//               width: '100%',
//               maxWidth: '500px',
//               background: 'white',
//               borderRadius: '28px',
//               padding: '40px',
//               textAlign: 'center',
//               boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
//               animation: 'slideUp 0.5s ease-out',
//             }}
//           >
//             <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
//             <h2 style={{ color: '#1a1a1a', fontWeight: '800' }}>Certificate Verified</h2>
//             <p style={{ color: '#666', marginBottom: '20px' }}>
//               This certificate is authentic and issued by Easy Coders.
//             </p>

//             <div
//               style={{
//                 textAlign: 'left',
//                 background: '#f9f9f9',
//                 padding: '20px',
//                 borderRadius: '16px',
//                 borderLeft: '5px solid #8B5CF6',
//               }}
//             >
//               <p>
//                 <strong>Certificate Code:</strong> {result.certificate_code}
//               </p>
//               <p>
//                 <strong>Student:</strong> {result.user?.name}
//               </p>
//               <p>
//                 <strong>Email:</strong> {result.user?.email}
//               </p>
//               <p>
//                 <strong>Assessment:</strong> {result.assessment?.title}
//               </p>
//               <p>
//                 <strong>Score:</strong> {result.score}
//               </p>
//               <p>
//                 <strong>Completed At:</strong> {result.completed_at}
//               </p>
//             </div>

//             <button
//               onClick={() => {
//                 setResult(null);
//                 setIdentifier('');
//                 setErrorMsg('');
//               }}
//               style={{
//                 marginTop: '25px',
//                 background: 'none',
//                 border: 'none',
//                 color: '#8B5CF6',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//               }}
//             >
//               Verify Another
//             </button>
//           </div>
//         )}
//       </div>

//       <style jsx>{`
//         @keyframes slideUp {
//           from {
//             opacity: 0;
//             transform: translateY(30px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
'use client';

import React, { useState } from 'react';

type VerifyApiResponse = {
  success: boolean;
  message: string;
  data?: {
    certificate_code: string;
    user: { id: number; name: string; email: string };
    assessment: { id: number; title: string };
    score: number;
    completed_at: string;
  };
};

export default function VerifyCertificate() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<VerifyApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setOpenModal(false);

    try {
      const code = identifier.trim().toUpperCase();
      const url =
        `https://api.easycoders.in/projects/backend/public/api/certificate/verify` +
        `?certificate_code=${encodeURIComponent(code)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json: VerifyApiResponse = await res.json();

      if (!res.ok || !json?.success) {
        setErrorMsg(json?.message || 'Certificate not found. Please check the ID.');
        setLoading(false);
        return;
      }

      setResult(json.data ?? null);
      setOpenModal(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error. Please try again later.');
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
  };

  const resetAll = () => {
    setResult(null);
    setIdentifier('');
    setErrorMsg('');
    setOpenModal(false);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh' }} className="global-header-bg">
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '30px',
          padding: '40px 20px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 'clamp(30px, 6vw, 48px)',
            fontWeight: '900',
            textShadow: '0 4px 15px rgba(0,0,0,0.4)',
            textAlign: 'center',
          }}
        >
          Verify Certificate
        </span>

        {/* Form (always visible) */}
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
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          }}
        >
          <div className="formGroup" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'white', fontWeight: '500', opacity: 0.9 }}>
              Certificate ID/ Enrollment ID
            </label>

            <input
              type="text"
              placeholder="Enter ID (Try: EC0031)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="formInput"
              style={{ padding: '14px', borderRadius: '14px', border: 'none' }}
            />

            {/* error line (design unchanged, only shown on error) */}
            {errorMsg ? (
              <div
                style={{
                  marginTop: '6px',
                  color: '#fff',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  fontSize: '13px',
                }}
              >
                {errorMsg}
              </div>
            ) : null}
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
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>
      </div>

      {/* ✅ Popup Modal */}
      {openModal && result ? (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Stop closing when clicking inside card */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'white',
              borderRadius: '28px',
              padding: '36px 34px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.35s ease-out',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                border: '1px solid #eee',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: '50px', marginBottom: '10px', textAlign: 'center' }}>✅</div>
            <h2 style={{ color: '#1a1a1a', fontWeight: '800', textAlign: 'center', margin: 0 }}>
              Certificate Verified
            </h2>
            <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
              This certificate is authentic and issued by Easy Coders.
            </p>

            <div
              style={{
                textAlign: 'left',
                background: '#f9f9f9',
                padding: '20px',
                borderRadius: '16px',
                borderLeft: '5px solid #8B5CF6',
              }}
            >
              <p style={{ margin: '8px 0' }}>
                <strong>Certificate Code:</strong> {result.certificate_code}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Student:</strong> {result.user?.name}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Email:</strong> {result.user?.email}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Assessment:</strong> {result.assessment?.title}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Score:</strong> {result.score}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Completed At:</strong> {result.completed_at}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <button
                onClick={resetAll}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Verify Another
              </button>

              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'white',
                  color: '#8B5CF6',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}