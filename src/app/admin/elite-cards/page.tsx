'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* /admin/elite-cards — issue & manage Elite Alumni Cards (premium, verifiable
   membership cards for first-batch students / alumni). Individual/manual issuance,
   reusing the certificate engine: saved, QR-verifiable, re-downloadable, revocable. */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

const DEFAULT_BENEFITS = [
  'Lifetime access to course resources',
  'Exclusive discount on future courses',
  'Priority placement & job referrals',
  'Complimentary 1:1 mentorship sessions',
];

type Card = {
  id: number;
  holder_name: string;
  membership_label?: string | null;
  card_number?: string | null;
  issued_on?: string | null;
  status: string;
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  holder_name: '',
  membership_label: '',
  email: '',
  phone: '',
  issued_on: new Date().toISOString().slice(0, 10),
  benefits: Object.fromEntries(DEFAULT_BENEFITS.map(b => [b, true])) as Record<string, boolean>,
  extra: '', // additional benefits, one per line
};

export default function AdminEliteCardsPage() {
  const [items, setItems] = useState<Card[]>([]);
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
      const r = await fetchWithAuth(`${BASE}/elite-cards`);
      setItems(Array.isArray(r?.data) ? r.data : []);
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load cards.');
      setItems([]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowForm(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const download = async (c: Card) => {
    setDownloading(c.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/elite-cards/${c.id}/card`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const clean = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
      const fname = `EliteAlumniCard_${clean(c.holder_name) || 'Holder'}_${c.card_number || c.id}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Could not download the card. Please try again.'); }
    finally { setDownloading(null); }
  };

  const submit = async () => {
    if (!form.holder_name.trim()) { setFormMsg('Holder name is required.'); return; }
    const benefits = [
      ...DEFAULT_BENEFITS.filter(b => form.benefits[b]),
      ...form.extra.split('\n').map(s => s.trim()).filter(Boolean),
    ];
    if (benefits.length === 0) { setFormMsg('Select or add at least one benefit.'); return; }
    setBusy(true); setFormMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/elite-cards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holder_name: form.holder_name.trim(),
          membership_label: form.membership_label.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          issued_on: form.issued_on || null,
          benefits,
        }),
      });
      const created = r?.data as Card | undefined;
      setShowForm(false); setForm(emptyForm);
      if (created?.id) await download(created);
      await load();
    } catch (e: unknown) {
      setFormMsg(e instanceof Error ? e.message : 'Could not issue the card.');
    } finally { setBusy(false); }
  };

  const revoke = async (c: Card) => {
    if (!confirm(`Revoke the Elite Alumni Card for "${c.holder_name}"? It will no longer verify or download.`)) return;
    try {
      await fetchWithAuth(`${BASE}/elite-cards/${c.id}`, { method: 'DELETE' });
      await load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not revoke the card.'); }
  };

  const toggleBenefit = (b: string) => setForm(p => ({ ...p, benefits: { ...p.benefits, [b]: !p.benefits[b] } }));

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Elite Alumni"
        title="Elite Alumni Cards"
        description="Issue a premium, verifiable Elite Alumni Card to your first-batch students and alumni — enter the holder's details, generate the card, and download it. Cards are saved here and can be re-downloaded or revoked."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Elite Alumni Cards' },
        ]}
      >
        <style jsx>{`
          .toolBtn { background: #E8A020; color: #0B1B3A; border: none; border-radius: 10px; padding: 10px 18px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .18s ease, transform .18s ease; }
          .toolBtn:hover { background: #F5C356; transform: translateY(-1px); }
          .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
          .tbl thead tr { background: #F4F6FB; border-bottom: 1px solid #E5E9F2; }
          .tbl th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #94A3B8; white-space: nowrap; }
          .tbl td { padding: 12px 14px; border-bottom: 1px solid #F1F4F9; vertical-align: middle; }
          .tbl tbody tr:last-child td { border-bottom: none; }
          .nm { font-weight: 700; color: #0B1B3A; }
          .sub { font-size: 11.5px; color: #94A3B8; margin-top: 2px; }
          .code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #B97A0F; font-weight: 700; }
          .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .pActive { background: #E9F6EC; color: #1B7A3D; border: 1px solid #BCE4C6; }
          .pRevoked { background: #FBEBEB; color: #9B2B2B; border: 1px solid #F1C6C6; }
          .act { display: inline-flex; gap: 6px; }
          .aBtn { border: 1px solid #E5E9F2; background: #fff; color: #0B1B3A; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
          .aBtn:hover { border-color: #E8A020; }
          .aDanger { color: #9B2B2B; }
          .aDanger:hover { border-color: #E0A3A3; background: #FDF4F4; }
          .scroll { overflow-x: auto; }

          /* Modal — NOT .modal (Bootstrap global would hide it). */
          .eOverlay { position: fixed; inset: 0; background: rgba(11,27,58,.5); display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; z-index: 2000; overflow-y: auto; }
          .eCard { background: #fff; border-radius: 18px; width: 100%; max-width: 640px; box-shadow: 0 24px 60px rgba(11,27,58,.28); }
          .mHead { padding: 22px 24px 0; }
          .mTitle { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0; }
          .mSub { font-size: 13px; color: #94A3B8; margin: 4px 0 0; }
          .mBody { padding: 18px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
          .full { grid-column: 1 / -1; }
          .lbl { display: block; font-size: 12px; font-weight: 700; color: #4A5568; margin-bottom: 6px; }
          .req { color: #E8A020; }
          .inp { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #E5E9F2; border-radius: 9px; font-family: inherit; font-size: 14px; color: #0B1B3A; background: #fff; }
          .inp:focus { outline: none; border-color: #E8A020; }
          textarea.inp { resize: vertical; min-height: 62px; }
          .benefit { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: #0B1B3A; padding: 5px 0; cursor: pointer; }
          .benefit input { margin-top: 2px; accent-color: #E8A020; }
          .mFoot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 6px 24px 22px; }
          .msg { flex: 1; font-size: 13px; color: #9B2B2B; }
          .ghost { background: #fff; color: #4A5568; border: 1px solid #E5E9F2; border-radius: 10px; padding: 10px 18px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
          .primary { background: #0B1B3A; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
          .primary:hover { background: #E8A020; color: #0B1B3A; }
          .primary:disabled { opacity: .6; cursor: wait; }
          @media (max-width: 560px) { .mBody { grid-template-columns: 1fr; } }
        `}</style>

        <AdminPanel
          title="Issued cards"
          subtitle={loading ? 'Loading…' : `${items.length} Elite Alumni Card${items.length !== 1 ? 's' : ''}`}
          toolbar={<button className="toolBtn" type="button" onClick={() => { setForm(emptyForm); setFormMsg(''); setShowForm(true); }}>+ Generate Card</button>}
        >
          {loading ? (
            <AdminState kind="loading" />
          ) : error ? (
            <AdminState kind="error" message={error} />
          ) : items.length === 0 ? (
            <AdminState kind="empty" message="No cards issued yet. Click “Generate Card” to create one." />
          ) : (
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Holder</th><th>Card No.</th><th>Issued</th><th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => {
                    const active = c.status === 'active';
                    return (
                      <tr key={c.id}>
                        <td><div className="nm">{c.holder_name}</div>{c.membership_label && <div className="sub">{c.membership_label}</div>}</td>
                        <td className="code">{c.card_number || <span style={{ color: '#B9C2D0' }}>—</span>}</td>
                        <td>{fmt(c.issued_on)}</td>
                        <td><span className={`pill ${active ? 'pActive' : 'pRevoked'}`}>{c.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="act">
                            {active && (
                              <button className="aBtn" type="button" disabled={downloading === c.id} onClick={() => download(c)}>
                                {downloading === c.id ? '…' : 'Download'}
                              </button>
                            )}
                            {active && <button className="aBtn aDanger" type="button" onClick={() => revoke(c)}>Revoke</button>}
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
          <div className="eOverlay" onClick={() => setShowForm(false)}>
            <div className="eCard" onClick={(e) => e.stopPropagation()}>
              <div className="mHead">
                <h2 className="mTitle">Generate an Elite Alumni Card</h2>
                <p className="mSub">Fill in the holder&rsquo;s details. The card downloads immediately and is saved below.</p>
              </div>
              <div className="mBody">
                <div className="full">
                  <label className="lbl">Holder name <span className="req">*</span></label>
                  <input className="inp" value={form.holder_name} onChange={(e) => setForm(p => ({ ...p, holder_name: e.target.value }))} placeholder="e.g. Riya Sharma" />
                </div>
                <div className="full">
                  <label className="lbl">Membership / cohort label</label>
                  <input className="inp" value={form.membership_label} onChange={(e) => setForm(p => ({ ...p, membership_label: e.target.value }))} placeholder="e.g. First Batch — Alpha EC · 2026" />
                </div>
                <div className="full">
                  <label className="lbl">Benefits (printed on the card)</label>
                  {DEFAULT_BENEFITS.map(b => (
                    <label key={b} className="benefit">
                      <input type="checkbox" checked={!!form.benefits[b]} onChange={() => toggleBenefit(b)} />
                      <span>{b}</span>
                    </label>
                  ))}
                  <textarea className="inp" style={{ marginTop: 8 }} value={form.extra} onChange={(e) => setForm(p => ({ ...p, extra: e.target.value }))} placeholder="Add more benefits — one per line (optional)" />
                </div>
                <div>
                  <label className="lbl">Issue date</label>
                  <input className="inp" type="date" value={form.issued_on} onChange={(e) => setForm(p => ({ ...p, issued_on: e.target.value }))} />
                </div>
                <div>
                  <label className="lbl">Email (optional, not printed)</label>
                  <input className="inp" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="holder@email.com" />
                </div>
                <div className="full">
                  <label className="lbl">Phone (optional, not printed)</label>
                  <input className="inp" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91…" />
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
