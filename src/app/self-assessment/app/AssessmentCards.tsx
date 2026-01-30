// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/axios';
// type Assessment = {
//   id: number;
//   title: string;
//   description?: string;
//   duration?: number;
//   level?: string;
//   status: 'published' | 'completed';
// };

// export default function AssessmentCards() {
//   const router = useRouter();

//   const [assessments, setAssessments] = useState<Assessment[]>([]);
//   const [visibleCount, setVisibleCount] = useState(8);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('assessment_token');
//     if (!token) {
//       router.replace('/self-assessment/login');
//       return;
//     }

//     api
//       .get('/assessment/list', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       })
//       .then(res => {
//         setAssessments(res.data?.data || []);
//       })
//       .catch(err => {
//         console.error(err);
//         if (err.response?.status === 401) {
//           localStorage.removeItem('assessment_token');
//           router.replace('/self-assessment/login');
//         }
//         setAssessments([]);
//       })
//       .finally(() => setLoading(false));
//   }, [router]);

//   if (loading) return <p>Loading assessments…</p>;
//   if (!assessments.length) return <p>No active assessments available.</p>;

//   return (
//     <>
//       <div className="assessmentGrid">
//         {assessments.slice(0, visibleCount).map(item => {
//           const isCompleted = item.status === 'completed';

//           return (
//             <div key={item.id} className={`assessmentCard ${isCompleted ? 'completed' : ''}`}>
//               <h3>{item.title}</h3>

//               <p className="assessmentDesc">
//                 {item.description || 'No description available.'}
//               </p>

//               <div className="assessmentMeta">
//                 {item.level && <span>Level: {item.level}</span>}
//                 {item.duration && <span>Duration: {item.duration} mins</span>}
//                 {/* Visual badge for status */}
//                 <span style={{ 
//                   color: isCompleted ? '#22c55e' : '#666', 
//                   fontWeight: 'bold' 
//                 }}>
//                   {isCompleted ? '✓ Completed' : 'Status: Available'}
//                 </span>
//               </div>

//               <button
//                 className="startBtn"
//                 disabled={isCompleted}
//                 onClick={() =>
//                   router.push(`/self-assessment/app/assessment/${item.id}`)
//                 }
//                 style={{
//                   backgroundColor: isCompleted ? '#9ca3af' : '#16316b',
//                   cursor: isCompleted ? 'not-allowed' : 'pointer',
//                   opacity: isCompleted ? 0.7 : 1
//                 }}
//               >
//                 {isCompleted ? 'Assessment Attempted' : 'Start Assessment'}
//               </button>
//             </div>
//           );
//         })}
//       </div>

//       {visibleCount < assessments.length && (
//         <div style={{ textAlign: 'center', marginTop: 30 }}>
//           <button
//             className="loadMoreBtn"
//             onClick={() => setVisibleCount(v => v + 8)}
//           >
//             Load More
//           </button>
//         </div>
//       )}
//     </>
//   );
// }
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

type Assessment = {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  level?: string;
  status: 'published' | 'completed';
};

export default function AssessmentCards() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    if (!token) {
      router.replace('/self-assessment/login');
      return;
    }

    api
      .get('/assessment/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setAssessments(res.data?.data || []))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('assessment_token');
          router.replace('/self-assessment/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // NEW: Download Certificate Logic
  const handleDownload = async (assessmentId: number) => {
    setDownloadingId(assessmentId);
    try {
      const token = localStorage.getItem('assessment_token');
      const res = await api.get(`/assessment/certificate/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status === 'success' && res.data.download_url) {
        // Open the PDF in a new tab or trigger download
        window.open(res.data.download_url, '_blank');
      } else {
        alert('Certificate not found or still generating.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to fetch certificate.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <p>Loading assessments…</p>;
  if (!assessments.length) return <p>No active assessments available.</p>;

  return (
    <>
      <div className="assessmentGrid">
        {assessments.slice(0, visibleCount).map(item => {
          const isCompleted = item.status === 'completed';

          return (
            <div key={item.id} className={`assessmentCard ${isCompleted ? 'completed' : ''}`}>
              <h3>{item.title}</h3>
              <p className="assessmentDesc">{item.description || 'No description available.'}</p>

              <div className="assessmentMeta">
                {item.level && <span>Level: {item.level}</span>}
                {item.duration && <span>Duration: {item.duration} mins</span>}
                <span style={{ color: isCompleted ? '#22c55e' : '#666', fontWeight: 'bold' }}>
                  {isCompleted ? '✓ Completed' : 'Status: Available'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="startBtn"
                  disabled={isCompleted}
                  onClick={() => router.push(`/self-assessment/app/assessment/${item.id}`)}
                  style={{
                    flex: 1,
                    backgroundColor: isCompleted ? '#9ca3af' : '#16316b',
                    cursor: isCompleted ? 'not-allowed' : 'pointer',
                    opacity: isCompleted ? 0.7 : 1,
                  }}
                >
                  {isCompleted ? 'Attempted' : 'Start Assessment'}
                </button>
                {isCompleted && (
                  <button
                    onClick={() => handleDownload(item.id)}
                    disabled={downloadingId === item.id}
                    style={{
                      flex: 1,
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px',
                      fontWeight: '700',
                      cursor: downloadingId === item.id ? 'wait' : 'pointer',
                    }}
                  >
                    {downloadingId === item.id ? 'Generating...' : '📜 Certificate'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < assessments.length && (
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button className="loadMoreBtn" onClick={() => setVisibleCount(v => v + 8)}>
            Load More
          </button>
        </div>
      )}
    </>
  );
}
