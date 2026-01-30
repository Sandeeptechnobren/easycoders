
// 'use client';

// import { useEffect, useState } from 'react';
// import AssessmentCards from './AssessmentCards';

// export default function AssessmentDashboard() {
//   const [userName, setUserName] = useState('');

//   useEffect(() => {
//     const storedName = localStorage.getItem('name');
//     const storedEmail = localStorage.getItem('assessment_user');
//     if (storedName && storedName !== 'undefined') {
//       setUserName(storedName);
//     } else if (storedEmail) {
//       setUserName(storedEmail.split('@')[0]);
//     } else {
//       setUserName('Learner');
//     }
//   }, []);
//   return (
//     <div style={{ padding: '20px' }}>
//       <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: '#111827' }}>
//         Hi {userName ? userName : '...'},
//       </h1>
//       <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 30 }}>
//         Welcome back! Here are your active assessments.
//       </p>

//       <AssessmentCards />
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import AssessmentCards from './AssessmentCards';

export default function AssessmentDashboard() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('assessment_user');
    console.log(storedName);
    // if (storedName && storedName !== 'undefined' && storedName !== '') {
    if (storedName) {
      setUserName(storedName);
    } else if (storedEmail) {
      setUserName(storedEmail.split('@')[0]);
    } else {
      setUserName('Learner');
    }
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          color: '#111827', 
          margin: 0 
        }}>
          Hi {userName || '...'}!
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
          Welcome back! Here are your active assessments.
        </p>
      </header>

      <AssessmentCards />
    </div>
  );
}