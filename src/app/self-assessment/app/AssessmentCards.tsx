// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/axios';

// type Assessment = {
//   id: number;
//   title: string;
//   description?: string;
//   duration?: string;
//   level?: string;
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

//         // 🔐 Token invalid / expired
//         if (err.response?.status === 401) {
//           localStorage.removeItem('assessment_token');
//           router.replace('/self-assessment/login');
//         }

//         setAssessments([]);
//       })
//       .finally(() => setLoading(false));
//   }, [router]);

//   if (loading) {
//     return <p>Loading assessments…</p>;
//   }

//   if (!assessments.length) {
//     return <p>No active assessments available.</p>;
//   }

//   return (
//     <>
      
//       <div className="assessmentGrid">
//         {assessments.slice(0, visibleCount).map(item => (
//           <div key={item.id} className="assessmentCard">
//             <h3>{item.title}</h3>

//             <p className="assessmentDesc">
//               {item.description || 'No description available.'}
//             </p>

//             <div className="assessmentMeta">
//               {item.level && <span>Level: {item.level}</span>}
//               {item.duration && <span>Duration: {item.duration} mins</span>}
//             </div>

//             <button
//               className="startBtn"
//               onClick={() =>
//                 router.push(`/self-assessment/app/assessment/${item.id}`)
//               }
//             >
//               Start Assessment
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* LOAD MORE */}
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
  duration?: number; // Changed to number based on your JSON example
  level?: string;
  status: 'published' | 'completed'; // Added status field
};

export default function AssessmentCards() {
  const router = useRouter();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    if (!token) {
      router.replace('/self-assessment/login');
      return;
    }

    api
      .get('/assessment/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => {
        setAssessments(res.data?.data || []);
      })
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('assessment_token');
          router.replace('/self-assessment/login');
        }
        setAssessments([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

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

              <p className="assessmentDesc">
                {item.description || 'No description available.'}
              </p>

              <div className="assessmentMeta">
                {item.level && <span>Level: {item.level}</span>}
                {item.duration && <span>Duration: {item.duration} mins</span>}
                {/* Visual badge for status */}
                <span style={{ 
                  color: isCompleted ? '#22c55e' : '#666', 
                  fontWeight: 'bold' 
                }}>
                  {isCompleted ? '✓ Completed' : 'Status: Available'}
                </span>
              </div>

              <button
                className="startBtn"
                disabled={isCompleted}
                onClick={() =>
                  router.push(`/self-assessment/app/assessment/${item.id}`)
                }
                style={{
                  backgroundColor: isCompleted ? '#9ca3af' : '#16316b',
                  cursor: isCompleted ? 'not-allowed' : 'pointer',
                  opacity: isCompleted ? 0.7 : 1
                }}
              >
                {isCompleted ? 'Assessment Attempted' : 'Start Assessment'}
              </button>
            </div>
          );
        })}
      </div>

      {visibleCount < assessments.length && (
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            className="loadMoreBtn"
            onClick={() => setVisibleCount(v => v + 8)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}