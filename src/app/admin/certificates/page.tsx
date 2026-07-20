'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* /admin/certificates — generate & manage MANUAL certificates (issued to a
   free-typed name, not tied to a registered student). Reuses the same
   course-completion certificate engine: saved, publicly verifiable (QR/code),
   re-downloadable and revocable. */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Cert = {
  id: number;
  student_name: string;
  program?: string | null;
  tech_field?: string | null;
  duration_value: number;
  duration_unit: string;
  performance_grade?: string | null;
  completed_on?: string | null;
  start_date?: string | null;
  certificate_code?: string | null;
  status: string;
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Build a certificate download filename: "<Name>_<Course>_<Year>.pdf". */
function certFileName(name?: string | null, course?: string | null, dateStr?: string | null): string {
  const clean = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
  const year = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
  return `${clean(name || '') || 'Certificate'}_${clean(course || '') || 'Course'}_${year}.pdf`;
}

const emptyForm = {
  student_name: '',
  program: 'Summer Training',
  tech_field: '',
  duration_value: '',
  duration_unit: 'days',
  performance_grade: '',
  start_date: '',
  completed_on: new Date().toISOString().slice(0, 10),
  remarks: '',
};

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const r = await fetchWithAuth(`${BASE}/course-completions/manual`);
      setItems(Array.isArray(r?.data) ? r.data : []);
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load certificates.');
      setItems([]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Esc closes the form
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowForm(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const set = (k: keyof typeof emptyForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const download = async (c: Cert) => {
    setDownloading(c.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/course-completions/${c.id}/certificate`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const course = c.program || c.tech_field || '';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = certFileName(c.student_name, course, c.completed_on);
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Could not download the certificate. Please try again.'); }
    finally { setDownloading(null); }
  };

  const submit = async () => {
    if (!form.student_name.trim() || !form.tech_field.trim() || !form.duration_value) {
      setFormMsg('Student name, technology and duration are required.');
      return;
    }
    setBusy(true); setFormMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/course-completions/manual`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: form.student_name.trim(),
          tech_field: form.tech_field.trim(),
          program: form.program.trim() || null,
          duration_value: Number(form.duration_value),
          duration_unit: form.duration_unit,
          performance_grade: form.performance_grade.trim() || null,
          start_date: form.start_date || null,
          completed_on: form.completed_on || null,
          remarks: form.remarks.trim() || null,
        }),
      });
      const created = r?.data as Cert | undefined;
      setShowForm(false); setForm(emptyForm);
      await load();
      if (created?.id) await download(created);   // hand the PDF straight to the user
    } catch (e: unknown) {
      setFormMsg(e instanceof Error ? e.message : 'Could not generate the certificate.');
    } finally { setBusy(false); }
  };

  const revoke = async (c: Cert) => {
    if (!confirm(`Revoke the certificate for "${c.student_name}"? It will no longer verify or download.`)) return;
    try {
      await fetchWithAuth(`${BASE}/course-completions/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not revoke the certificate.'); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Certificates"
        title="Certificates"
        description="Generate a certificate manually for anyone — enter the name, technology and details, and download an official, verifiable Certificate of Completion. These are saved here and can be re-downloaded or revoked."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Certificates' },
        ]}
      >
        <style jsx>{`
          .toolBtn {
            background: #E8A020; color: #0B1B3A; border: none; border-radius: 10px;
            padding: 10px 18px; font-family: inherit; font-size: 13px; font-weight: 700;
            cursor: pointer; transition: background .18s ease, transform .18s ease;
          }
          .toolBtn:hover { background: #F5C356; transform: translateY(-1px); }
          .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
          .tbl thead tr { background: #F4F6FB; border-bottom: 1px solid #E5E9F2; }
          .tbl th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #94A3B8; white-space: nowrap; }
          .tbl td { padding: 12px 14px; border-bottom: 1px solid #F1F4F9; vertical-align: middle; }
          .tbl tbody tr:last-child td { border-bottom: none; }
          .nm { font-weight: 700; color: #0B1B3A; }
          .sub { font-size: 11.5px; color: #94A3B8; margin-top: 2px; }
          .code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #4A5568; }
          .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .pIssued { background: #E9F6EC; color: #1B7A3D; border: 1px solid #BCE4C6; }
          .pRevoked { background: #FBEBEB; color: #9B2B2B; border: 1px solid #F1C6C6; }
          .act { display: inline-flex; gap: 6px; }
          .aBtn { border: 1px solid #E5E9F2; background: #fff; color: #0B1B3A; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
          .aBtn:hover { border-color: #E8A020; }
          .aDanger { color: #9B2B2B; }
          .aDanger:hover { border-color: #E0A3A3; background: #FDF4F4; }
          .scroll { overflow-x: auto; }

          .overlay { position: fixed; inset: 0; background: rgba(11,27,58,.5); display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; z-index: 1000; overflow-y: auto; }
          .modal { background: #fff; border-radius: 18px; width: 100%; max-width: 620px; box-shadow: 0 24px 60px rgba(11,27,58,.28); }
          .mHead { padding: 22px 24px 0; }
          .mTitle { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0; }
          .mSub { font-size: 13px; color: #94A3B8; margin: 4px 0 0; }
          .mBody { padding: 18px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
          .full { grid-column: 1 / -1; }
          .lbl { display: block; font-size: 12px; font-weight: 700; color: #4A5568; margin-bottom: 6px; }
          .req { color: #E8A020; }
          .inp { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #E5E9F2; border-radius: 9px; font-family: inherit; font-size: 14px; color: #0B1B3A; background: #fff; }
          .inp:focus { outline: none; border-color: #E8A020; }
          .dur { display: flex; gap: 8px; }
          .dur .inp:first-child { flex: 1; }
          .mFoot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 6px 24px 22px; }
          .msg { flex: 1; font-size: 13px; color: #9B2B2B; }
          .ghost { background: #fff; color: #4A5568; border: 1px solid #E5E9F2; border-radius: 10px; padding: 10px 18px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
          .primary { background: #0B1B3A; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
          .primary:hover { background: #E8A020; color: #0B1B3A; }
          .primary:disabled { opacity: .6; cursor: wait; }
          @media (max-width: 560px) { .mBody { grid-template-columns: 1fr; } }
        `}</style>

        <AdminPanel
          title="Generated certificates"
          subtitle={loading ? 'Loading…' : `${items.length} manual certificate${items.length !== 1 ? 's' : ''}`}
          toolbar={<button className="toolBtn" type="button" onClick={() => { setForm(emptyForm); setFormMsg(''); setShowForm(true); }}>+ Generate Certificate</button>}
        >
          {loading ? (
            <AdminState kind="loading" />
          ) : error ? (
            <AdminState kind="error" message={error} />
          ) : items.length === 0 ? (
            <AdminState kind="empty" message="No certificates generated yet. Click “Generate Certificate” to create one." />
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Recipient</th><th>Technology</th><th>Duration</th><th>Grade</th>
                    <th>Issued</th><th>Code</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => {
                    const issued = c.status === 'issued';
                    const grade = (c.performance_grade || '').trim() || 'Pending';
                    return (
                      <tr key={c.id}>
                        <td><div className="nm">{c.student_name}</div>{c.program && <div className="sub">{c.program}</div>}</td>
                        <td>{c.tech_field || '—'}</td>
                        <td>{c.duration_value} {c.duration_unit}</td>
                        <td>{grade}</td>
                        <td>{fmt(c.completed_on)}</td>
                        <td className="code">{c.certificate_code || <span style={{ color: '#B9C2D0' }}>on download</span>}</td>
                        <td><span className={`pill ${issued ? 'pIssued' : 'pRevoked'}`}>{c.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="act">
                            {issued && (
                              <button className="aBtn" type="button" disabled={downloading === c.id} onClick={() => download(c)}>
                                {downloading === c.id ? '…' : 'Download'}
                              </button>
                            )}
                            {issued && <button className="aBtn aDanger" type="button" onClick={() => revoke(c)}>Revoke</button>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        {showForm && (
          <div className="overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="mHead">
                <h2 className="mTitle">Generate a certificate</h2>
                <p className="mSub">Fill in the recipient&rsquo;s details. The certificate downloads immediately and is saved below.</p>
              </div>
              <div className="mBody">
                <div className="full">
                  <label className="lbl">Student / recipient name <span className="req">*</span></label>
                  <input className="inp" value={form.student_name} onChange={(e) => set('student_name', e.target.value)} placeholder="e.g. Riya Sharma" />
                </div>
                <div className="full">
                  <label className="lbl">Technology / tech stack <span className="req">*</span></label>
                  <input className="inp" value={form.tech_field} onChange={(e) => set('tech_field', e.target.value)} placeholder="e.g. MERN, React, Node.js, MySQL" />
                </div>
                <div>
                  <label className="lbl">Program</label>
                  <input className="inp" list="cert-programs" value={form.program} onChange={(e) => set('program', e.target.value)} placeholder="e.g. Summer Training" />
                  <datalist id="cert-programs">
                    <option value="Summer Training" /><option value="Winter Training" /><option value="Internship" /><option value="Job Oriented Program" /><option value="Bootcamp" />
                  </datalist>
                </div>
                <div>
                  <label className="lbl">Grade</label>
                  <input className="inp" value={form.performance_grade} onChange={(e) => set('performance_grade', e.target.value)} placeholder="e.g. A+ (optional)" />
                </div>
                <div>
                  <label className="lbl">Duration <span className="req">*</span></label>
                  <div className="dur">
                    <input className="inp" type="number" min={1} value={form.duration_value} onChange={(e) => set('duration_value', e.target.value)} placeholder="e.g. 45" />
                    <select className="inp" style={{ width: 120 }} value={form.duration_unit} onChange={(e) => set('duration_unit', e.target.value)}>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
                <div />
                <div>
                  <label className="lbl">Start date</label>
                  <input className="inp" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Completion date</label>
                  <input className="inp" type="date" value={form.completed_on} onChange={(e) => set('completed_on', e.target.value)} />
                </div>
                <div className="full">
                  <label className="lbl">Remarks (internal, not printed)</label>
                  <input className="inp" value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Optional note" />
                </div>
              </div>
              <div className="mFoot">
                <span className="msg">{formMsg}</span>
                <button className="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="primary" type="button" disabled={busy} onClick={submit}>
                  {busy ? 'Generating…' : 'Generate & download'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminSection>
    </RoleGuard>
  );
}
