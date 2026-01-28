'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

type Assessment = {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  level?: string;
};

export default function AssessmentCards() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   api
  //     .get('/assessment/list',{

  //     })
  //     .then(res => {
  //       setAssessments(res.data?.data || res.data);
  //     })
  //     .catch(() => setAssessments([]))
  //     .finally(() => setLoading(false));
  // }, []);
useEffect(() => {
  const token = localStorage.getItem('assessment_token');

  api
    .get('/assessment/list', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(res => {
      setAssessments(res.data?.data || res.data);
    })
    .catch(err => {
      console.error(err);

      // 🔐 Handle token expiry / invalid token
      if (err.response?.status === 401) {
        localStorage.removeItem('assessment_token');
        window.location.href = '/self-assessment/login';
      }

      setAssessments([]);
    })
    .finally(() => setLoading(false));
}, []);
  if (loading) {
    return <p>Loading assessments…</p>;
  }

  if (!assessments.length) {
    return <p>No active assessments available.</p>;
  }

  return (
    <>
      {/* GRID */}
      <div className="assessmentGrid">
        {assessments.slice(0, visibleCount).map(item => (
          <div key={item.id} className="assessmentCard">
            <h3>{item.title}</h3>

            <p className="assessmentDesc">
              {item.description || 'No description available.'}
            </p>

            <div className="assessmentMeta">
              {item.level && <span>Level: {item.level}</span>}
              {item.duration && <span>Duration: {item.duration}</span>}
            </div>

            <button className="startBtn">
              Start Assessment →
            </button>
          </div>
        ))}
      </div>

      {/* MORE BUTTON */}
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
