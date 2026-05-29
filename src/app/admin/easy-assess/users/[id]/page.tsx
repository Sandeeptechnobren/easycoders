'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';
import { normalizeInterestLabel } from '@/lib/interest';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/users/[id] — Assessment-user (lead) detail.
 *
 * The assessment-takers section lives entirely under Easy Assess now. This is
 * the detail companion to /admin/easy-assess/users — profile, interest /
 * call-response follow-up, and completed assessment attempts. Reuses the
 * existing /hr/* endpoints (assement_users feed); no backend change.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type InterestOption = { id: number; interest: string };

type AssessmentUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: number | string;
  course?: string | null;
  year?: string | null;
  assessments_attempts?: Array<{
    id: number;
    assessment_id: number;
    score: number;
    status: string;
    certificate_code: string;
    assessment?: { id: number; title: string };
  }>;
  interest?: null | {
    id: number;
    assessment_user_id: number;
    interest_status?: { id: number; interest: string };
    call_response?: string | null;
  };
};

const INTEREST_ACCENT: Record<string, string> = {
  'Interested': '#22C55E',
  'Not Interested': '#EF4444',
  'Call Back Later': '#F59E0B',
  'Not Reachable': '#64748B',
  'Not Set': '#8B5CF6',
};

const INTEREST_PILL: Record<string, string> = {
  'Interested': 'pill-interested',
  'Not Interested': 'pill-not-interested',
  'Call Back Later': 'pill-callback',
  'Not Reachable': 'pill-unreachable',
  'Not Set': 'pill-not-set',
};

export default function AssessmentUserDetail() {
  const params = useParams();
  const id = String(params?.id || '');

  const [user, setUser] = useState<AssessmentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [callResponse, setCallResponse] = useState('');
  const [busyInterest, setBusyInterest] = useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const json = await fetchWithAuth(`${BASE}/hr/students/${encodeURIComponent(id)}`);
      setUser(json.data || null);
      setCallResponse(json.data?.interest?.call_response || '');
    } catch (e: unknown) {
      setUser(null);
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired — please sign in again.' : 'Failed to load user.');
    } finally {
      setLoading(false);
    }
  };

  const loadInterestOptions = async () => {
    try {
      const json = await fetchWithAuth(`${BASE}/hr/student/interests`);
      setInterestOptions(json.data || []);
    } catch {
      setInterestOptions([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadUser();
    loadInterestOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const interestLabel = useMemo(
    () => normalizeInterestLabel(user?.interest?.interest_status?.interest),
    [user]
  );

  const updateInterest = async (interest_status_id: number) => {
    if (!user) return;
    try {
      setBusyInterest(true);
      await fetchWithAuth(`${BASE}/hr/assessmentUser/updateInterestStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_user_id: user.id,
          interest_status: interest_status_id,
          call_response: callResponse || null,
        }),
      });
      await loadUser();
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired.' : 'Failed to update interest.');
    } finally {
      setBusyInterest(false);
    }
  };

  const isActive = user && (user.status === 1 || user.status === '1' || String(user.status).toLowerCase() === 'active');

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title={user?.name || 'Assessment User'}
        description="Profile, interest follow-up and completed assessment attempts for this Easy Assess account."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Users', href: '/admin/easy-assess/users' },
          { label: 'Detail' },
        ]}
      >
        <style jsx>{`
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
          @media (max-width: 820px) { .grid2 { grid-template-columns: 1fr; } }
          .stack { display: grid; gap: 18px; }

          .field { display: flex; flex-direction: column; gap: 3px; }
          .fieldGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          @media (max-width: 520px) { .fieldGrid { grid-template-columns: 1fr; } }
          .fkey { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: #94A3B8; font-weight: 600; }
          .fval { font-size: 14px; color: #0B1B3A; font-weight: 500; }

          .pill { display: inline-block; padding: 3px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; }
          .pill-interested    { background: #ECFDF5; color: #166534; }
          .pill-not-interested{ background: #FEF2F2; color: #991B1B; }
          .pill-callback      { background: #FEF6E7; color: #92660D; }
          .pill-unreachable   { background: #F1F5F9; color: #475569; }
          .pill-not-set       { background: #EEF2FF; color: #3730A3; }
          .pill-green { background: #ECFDF5; color: #166534; }
          .pill-amber { background: #FEF6E7; color: #92660D; }
          .pill-blue  { background: #EFF6FF; color: #1D4ED8; }

          .ta { width: 100%; border: 1px solid #E5E9F2; border-radius: 10px; padding: 10px 12px; font-family: inherit; font-size: 13px; color: #0B1B3A; outline: none; resize: vertical; }
          .ta:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.16); }

          .intBtns { display: grid; gap: 8px; }
          .intBtn {
            display: flex; align-items: center; gap: 9px;
            background: #fff; border: 1px solid #E5E9F2; border-left: 3px solid #d1d5db;
            border-radius: 10px; padding: 10px 14px; font-family: inherit; font-size: 13px;
            font-weight: 600; color: #0B1B3A; cursor: pointer; text-align: left;
            transition: border-color 0.18s ease, background 0.18s ease;
          }
          .intBtn:hover:not(:disabled) { background: #F8FAFD; border-color: #E8A020; }
          .intBtn:disabled { opacity: 0.55; cursor: not-allowed; }
          .intDot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94A3B8; padding: 10px 12px; border-bottom: 1px solid #E5E9F2; }
          tbody td { padding: 12px; border-bottom: 1px solid #F1F4F9; color: #0B1B3A; vertical-align: middle; }
          tbody tr:last-child td { border-bottom: none; }
          .tdBold { font-weight: 600; }
          .tdSub { font-size: 12px; color: #94A3B8; }
          .emptyRow { text-align: center; color: #94A3B8; padding: 20px; }
          .divider { height: 1px; background: #E5E9F2; margin: 16px 0; }
          .backLink { display: inline-flex; align-items: center; gap: 6px; color: #B97A0F; font-weight: 600; font-size: 13px; }
        `}</style>

        {loading && <AdminPanel><AdminState kind="loading" message="Loading user…" /></AdminPanel>}
        {!loading && error && (
          <AdminPanel>
            <AdminState kind="error" message={error} action={<Link className="backLink" href="/admin/easy-assess/users">← Back to users</Link>} />
          </AdminPanel>
        )}

        {!loading && !error && user && (
          <div className="stack">
            <div className="grid2">

              {/* Profile */}
              <AdminPanel
                title="Profile"
                subtitle={`Assessment account #${user.id}`}
                toolbar={<span className={`pill ${isActive ? 'pill-green' : 'pill-amber'}`}>{isActive ? 'Active' : 'Inactive'}</span>}
              >
                <div className="fieldGrid">
                  <div className="field"><span className="fkey">Name</span><span className="fval">{user.name}</span></div>
                  <div className="field"><span className="fkey">Email</span><span className="fval">{user.email}</span></div>
                  <div className="field"><span className="fkey">Phone</span><span className="fval">{user.phone || '—'}</span></div>
                  <div className="field"><span className="fkey">Interest</span><span className={`pill ${INTEREST_PILL[interestLabel] || 'pill-not-set'}`}>{interestLabel}</span></div>
                  {user.course && <div className="field"><span className="fkey">Course</span><span className="fval">{user.course}</span></div>}
                  {user.year && <div className="field"><span className="fkey">Year</span><span className="fval">{user.year}</span></div>}
                  {user.interest?.call_response && (
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <span className="fkey">Last Call Note</span><span className="fval">{user.interest.call_response}</span>
                    </div>
                  )}
                </div>
              </AdminPanel>

              {/* Interest update */}
              <AdminPanel title="Update Interest" subtitle={busyInterest ? 'Saving…' : 'Log a call & set status'}>
                <div className="field" style={{ marginBottom: 12 }}>
                  <span className="fkey" style={{ marginBottom: 4 }}>Call Response Note</span>
                  <textarea
                    className="ta"
                    rows={3}
                    placeholder="Enter call response or notes…"
                    value={callResponse}
                    onChange={(e) => setCallResponse(e.target.value)}
                  />
                </div>
                <div className="intBtns">
                  {interestOptions.length === 0 && <span className="tdSub">No interest options configured.</span>}
                  {interestOptions.map((opt) => {
                    const accent = INTEREST_ACCENT[normalizeInterestLabel(opt.interest)] || '#d1d5db';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className="intBtn"
                        disabled={busyInterest}
                        onClick={() => updateInterest(opt.id)}
                        style={{ borderLeftColor: accent }}
                      >
                        <span className="intDot" style={{ background: accent }} />
                        {opt.interest}
                      </button>
                    );
                  })}
                </div>
              </AdminPanel>
            </div>

            {/* Attempts */}
            <AdminPanel title="Assessment Attempts" subtitle="Certificates & scores">
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Title</th><th>Status</th><th>Score</th><th>Certificate</th></tr>
                  </thead>
                  <tbody>
                    {user.assessments_attempts?.length ? (
                      user.assessments_attempts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="tdBold">{a.assessment?.title ?? `Assessment #${a.assessment_id}`}</div>
                            <div className="tdSub">Attempt #{a.id}</div>
                          </td>
                          <td><span className={`pill ${a.status === 'completed' ? 'pill-green' : 'pill-amber'}`}>{a.status}</span></td>
                          <td className="tdBold">{a.score}</td>
                          <td>{a.certificate_code ? <span className="pill pill-blue">{a.certificate_code}</span> : <span className="tdSub">—</span>}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="emptyRow">No attempts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AdminPanel>
          </div>
        )}
      </AdminSection>
    </RoleGuard>
  );
}
