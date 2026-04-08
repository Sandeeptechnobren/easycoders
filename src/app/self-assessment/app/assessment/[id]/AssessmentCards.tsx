
'use client';
import './assessmentApp.css';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    const assessment_token = localStorage.getItem('assessment_token');
    if (!assessment_token) {
      router.replace('/self-assessment/login');
      return;
    }

    api
      .get('/assessment/list', {
        headers: { Authorization: `Bearer ${assessment_token}` },
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

  const handleDownload = async (assessmentId: number) => {
    setDownloadingId(assessmentId);
    try {
      const assessment_token = localStorage.getItem('assessment_token');
      const res = await api.get(`/assessment/certificate/${assessmentId}`, {
        headers: { Authorization: `Bearer ${assessment_token}` },
      });

      if (res.data.status === 'success' && res.data.download_url) {
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '15px' }}>
      Loading assessments…
    </div>
  );
  if (!assessments.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '15px' }}>
      No active assessments available.
    </div>
  );

  return (
    <>
      <div className="assessmentGrid">
        {assessments.slice(0, visibleCount).map(item => {
          const isCompleted = item.status === 'completed';

          return (
           <div key={item.id} className={`assessmentCard ${isCompleted ? 'completed' : ''}`}>
  
  {/* STATUS BADGE */}
  <div className={`statusBadge ${isCompleted ? 'done' : 'active'}`}>
    {isCompleted ? 'Completed' : 'Active'}
  </div>

  <h3>{item.title}</h3>

  <p className="assessmentDesc">
    {item.description || 'No description available.'}
  </p>

  <div className="assessmentMeta">
    {item.level && <span>🎯 {item.level}</span>}
    {item.duration && <span>⏱ {item.duration} mins</span>}
  </div>

  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', width: '100%' }}>
    <button
      className="startBtn"
      disabled={isCompleted}
      onClick={() => router.push(`/self-assessment/app/assessment/${item.id}`)}
      style={{
        flex: 1,
        height: '38px',
        background: isCompleted
          ? '#9ca3af'
          : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
        color: '#fff',
        cursor: isCompleted ? 'not-allowed' : 'pointer',
      }}
    >
      {isCompleted ? 'Attempted' : 'Start'}
    </button>

    {isCompleted && (
      <button
        onClick={() => handleDownload(item.id)}
        disabled={downloadingId === item.id}
        className="startBtn"
        style={{
          flex: 1,
          background: '#22c55e',
          color: '#fff',
        }}
      >
        {downloadingId === item.id ? '...' : 'Certificate'}
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
