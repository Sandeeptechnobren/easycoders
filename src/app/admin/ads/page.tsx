'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './ads.module.css';

/* /admin/ads — Ad Settings.
 *
 * Two tabs:
 *   • Ads    — manage login-page promos (CRUD + active toggle). Images are
 *              sent inline as multipart; on edit we use POST + `_method=PUT`
 *              (Laravel method spoofing) so the file rides along.
 *   • Leads  — view + triage the interested-student leads captured when an
 *              app user taps a promo. The leads endpoint is paginated, so the
 *              rows live at `data.data` (30/page).
 *
 * Mirrors /admin/courses: hardcoded BASE, fetchWithAuth, an asArray() unwrap
 * helper, a create/edit modal, and the navy/gold AdminSection chrome. */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

/** Unwrap a bare array, `{data:[]}`, or `{data:{data:[]}}` (paginator). */
function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Convert an API datetime (or ISO) into the value a datetime-local input wants. */
const toLocalInput = (s?: string | null) => {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Promo = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  course_id?: number | null;
  is_active?: boolean | number;
  order_no?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  leads_count?: number;
  created_at?: string | null;
};

type Course = { id: number; title?: string; name?: string };

type Lead = {
  id: number;
  promo_id?: number | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  course_interest?: string | null;
  city?: string | null;
  message?: string | null;
  status?: string | null;
  source?: string | null;
  created_at?: string | null;
  promo?: { id: number; title: string } | null;
};

type Paginator = { current_page?: number; last_page?: number; total?: number; per_page?: number };

const LEAD_STATUSES = ['new', 'contacted', 'converted', 'closed'];

const EMPTY = {
  title: '', description: '', cta_label: '', course_id: '',
  is_active: true, order_no: '', starts_at: '', ends_at: '',
};

const courseLabel = (c: Course) => c.title || c.name || `Course #${c.id}`;

export default function AdminAdsPage() {
  const [tab, setTab] = useState<'ads' | 'leads'>('ads');

  // ── Ads state ──
  const [promos, setPromos] = useState<Promo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // ── Leads state ──
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsMeta, setLeadsMeta] = useState<Paginator>({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [savingLeadId, setSavingLeadId] = useState<number | null>(null);
  const [loadedLeadsOnce, setLoadedLeadsOnce] = useState(false);

  // ── Load ads + courses ──
  const loadAds = useCallback(async () => {
    setLoadingAds(true); setAdsError('');
    try {
      const [p, c] = await Promise.all([
        fetchWithAuth(`${BASE}/admin/promos`),
        fetchWithAuth(`${BASE}/admin/courses`).catch(() => null),
      ]);
      setPromos(asArray<Promo>(p));
      setCourses(asArray<Course>(c));
    } catch (e: unknown) {
      setPromos([]);
      setAdsError(e instanceof Error ? e.message : 'Could not load ads.');
    } finally { setLoadingAds(false); }
  }, []);

  useEffect(() => { loadAds(); }, [loadAds]);

  // ── Load leads (paginated, server-side search + status filter) ──
  const loadLeads = useCallback(async (page: number, status: string, search: string) => {
    setLoadingLeads(true); setLeadsError('');
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (search.trim()) qs.set('search', search.trim());
      if (page > 1) qs.set('page', String(page));
      const res = await fetchWithAuth(`${BASE}/admin/promo-leads${qs.toString() ? `?${qs}` : ''}`);
      setLeads(asArray<Lead>(res));
      const meta = (res as { data?: Paginator } | null)?.data ?? {};
      setLeadsMeta({
        current_page: meta.current_page ?? page,
        last_page: meta.last_page ?? 1,
        total: meta.total,
        per_page: meta.per_page,
      });
    } catch (e: unknown) {
      setLeads([]);
      setLeadsError(e instanceof Error ? e.message : 'Could not load leads.');
    } finally { setLoadingLeads(false); setLoadedLeadsOnce(true); }
  }, []);

  // Fetch leads the first time the tab is opened.
  useEffect(() => {
    if (tab === 'leads' && !loadedLeadsOnce) loadLeads(1, leadStatus, leadSearch);
  }, [tab, loadedLeadsOnce, loadLeads, leadStatus, leadSearch]);

  // Debounced re-fetch when the leads filters / page change (only while on the tab).
  useEffect(() => {
    if (tab !== 'leads') return;
    const t = setTimeout(() => loadLeads(leadPage, leadStatus, leadSearch), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadPage, leadStatus, leadSearch]);

  // ── Derived counts ──
  const stats = useMemo(() => ({
    total: promos.length,
    active: promos.filter(p => !!p.is_active).length,
    leads: promos.reduce((sum, p) => sum + (Number(p.leads_count) || 0), 0),
  }), [promos]);

  const sortedPromos = useMemo(
    () => [...promos].sort((a, b) => (Number(a.order_no) || 0) - (Number(b.order_no) || 0)),
    [promos],
  );

  // ── Modal helpers ──
  const openCreate = () => {
    setEditId(null); setForm(EMPTY);
    setImageFile(null); setImagePreview('');
    setMsg(''); setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditId(p.id);
    setForm({
      title: p.title || '',
      description: p.description || '',
      cta_label: p.cta_label || '',
      course_id: p.course_id != null ? String(p.course_id) : '',
      is_active: !!p.is_active,
      order_no: p.order_no != null ? String(p.order_no) : '',
      starts_at: toLocalInput(p.starts_at),
      ends_at: toLocalInput(p.ends_at),
    });
    setImageFile(null);
    setImagePreview(p.image_url || '');
    setMsg(''); setShowModal(true);
  };

  const onPickImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description ?? '');
      fd.append('cta_label', form.cta_label ?? '');
      if (form.course_id) fd.append('course_id', form.course_id);
      fd.append('is_active', form.is_active ? '1' : '0');
      if (form.order_no !== '') fd.append('order_no', form.order_no);
      if (form.starts_at) fd.append('starts_at', form.starts_at);
      if (form.ends_at) fd.append('ends_at', form.ends_at);
      if (imageFile) fd.append('image', imageFile);
      // Edit: POST + method spoofing so the image file survives the PUT.
      if (editId) fd.append('_method', 'PUT');

      // Do NOT set Content-Type — the browser adds the multipart boundary.
      await fetchWithAuth(`${BASE}/admin/promos${editId ? `/${editId}` : ''}`, {
        method: 'POST',
        body: fd,
      });
      setShowModal(false);
      loadAds();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Failed to save the ad.');
    } finally { setSaving(false); }
  };

  const toggleActive = async (p: Promo) => {
    try {
      // No image change → a plain JSON PUT is accepted by the backend.
      await fetchWithAuth(`${BASE}/admin/promos/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: p.title, is_active: p.is_active ? 0 : 1 }),
      });
      loadAds();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not update the ad.'); }
  };

  const remove = async (p: Promo) => {
    if (!confirm(`Delete the ad "${p.title}"? This also removes its captured leads.`)) return;
    try { await fetchWithAuth(`${BASE}/admin/promos/${p.id}`, { method: 'DELETE' }); loadAds(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  const setLeadStatusValue = async (lead: Lead, status: string) => {
    setSavingLeadId(lead.id);
    // Optimistic update so the dropdown reflects the choice immediately.
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await fetchWithAuth(`${BASE}/admin/promo-leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not update the lead.');
      setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, status: lead.status } : l)));
    } finally { setSavingLeadId(null); }
  };

  const curPage = leadsMeta.current_page ?? 1;
  const lastPage = leadsMeta.last_page ?? 1;

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Marketing"
        title="Ad Settings"
        description="Manage the promos shown on the app login screen and review the leads captured when students tap an ad. Ads can be scheduled, ordered and toggled live without a release."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Ad Settings' },
        ]}
      >
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#0B1B3A' }} /><div className={styles.statVal}>{stats.total}</div><div className={styles.statLbl}>Ads</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#16A34A' }} /><div className={styles.statVal}>{stats.active}</div><div className={styles.statLbl}>Active</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#E8A020' }} /><div className={styles.statVal}>{stats.leads}</div><div className={styles.statLbl}>Leads captured</div></div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Ad settings sections">
          <button role="tab" aria-selected={tab === 'ads'} className={`${styles.tab} ${tab === 'ads' ? styles.tabActive : ''}`} onClick={() => setTab('ads')}>
            Ads<span className={styles.tabCount}>{promos.length}</span>
          </button>
          <button role="tab" aria-selected={tab === 'leads'} className={`${styles.tab} ${tab === 'leads' ? styles.tabActive : ''}`} onClick={() => setTab('leads')}>
            Leads{leadsMeta.total != null && <span className={styles.tabCount}>{leadsMeta.total}</span>}
          </button>
        </div>

        {/* ─────────────────────────────  ADS TAB  ───────────────────────────── */}
        {tab === 'ads' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.spacer} />
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>+ New Ad</button>
            </div>

            {adsError && <div className={`${styles.alert} ${styles.alertErr}`}>{adsError}</div>}

            {loadingAds ? (
              <div className={styles.state}>Loading ads…</div>
            ) : sortedPromos.length === 0 ? (
              <div className={styles.state}>
                <div className={styles.stateTitle}>No ads yet</div>
                Create your first login-page promo to start capturing student leads.
              </div>
            ) : (
              <div className={styles.grid}>
                {sortedPromos.map(p => (
                  <article key={p.id} className={styles.adCard}>
                    <div className={styles.adMedia}>
                      {p.image_url
                        ? <img className={styles.adImg} src={p.image_url} alt={p.title} />
                        : <div className={styles.adImgEmpty} aria-hidden="true">▦</div>}
                      <div className={styles.adMediaTop}>
                        <span className={`${styles.badge} ${p.is_active ? styles.st_active : styles.st_inactive}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={styles.adChip}>#{p.order_no ?? 0}</span>
                      </div>
                    </div>
                    <div className={styles.adBody}>
                      <div className={styles.adTitle}>{p.title}</div>
                      {p.description && <div className={styles.adDesc}>{p.description}</div>}
                      <div className={styles.adMetaRow}>
                        {p.cta_label && <span className={styles.adChip}>CTA: {p.cta_label}</span>}
                        <span className={styles.adChip}>{Number(p.leads_count) || 0} leads</span>
                        {(p.starts_at || p.ends_at) && (
                          <span className={styles.adChip}>{fmtDate(p.starts_at)} → {fmtDate(p.ends_at)}</span>
                        )}
                      </div>
                      <div className={styles.adFoot}>
                        <button
                          className={`${styles.btn} ${p.is_active ? styles.btnGhost : styles.btnGold} ${styles.btnSm}`}
                          onClick={() => toggleActive(p)}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => openEdit(p)}>Edit</button>
                        <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => remove(p)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ────────────────────────────  LEADS TAB  ──────────────────────────── */}
        {tab === 'leads' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.search}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  className={styles.searchIn}
                  placeholder="Search name, phone, email…"
                  value={leadSearch}
                  onChange={e => { setLeadPage(1); setLeadSearch(e.target.value); }}
                />
              </div>
              <select
                className={styles.filterSel}
                value={leadStatus}
                onChange={e => { setLeadPage(1); setLeadStatus(e.target.value); }}
              >
                <option value="">All statuses</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
              </select>
            </div>

            {leadsError && <div className={`${styles.alert} ${styles.alertErr}`}>{leadsError}</div>}

            {loadingLeads && leads.length === 0 ? (
              <div className={styles.state}>Loading leads…</div>
            ) : leads.length === 0 ? (
              <div className={styles.state}>
                <div className={styles.stateTitle}>No leads found</div>
                {leadSearch || leadStatus ? 'Try clearing the search or status filter.' : 'Leads appear here once students tap an ad and submit their interest.'}
              </div>
            ) : (
              <div className={styles.panel}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Lead</th><th>Contact</th><th>Interest</th><th>City</th><th>Message</th><th>Ad</th><th>Date</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map(l => (
                        <tr key={l.id}>
                          <td><div className={styles.cName}>{l.name || '—'}</div>{l.source && <div className={styles.cMeta}>{l.source}</div>}</td>
                          <td>
                            <div>{l.phone || '—'}</div>
                            {l.email && <div className={styles.cMeta}>{l.email}</div>}
                          </td>
                          <td className={l.course_interest ? '' : styles.muted}>{l.course_interest || '—'}</td>
                          <td className={l.city ? '' : styles.muted}>{l.city || '—'}</td>
                          <td className={styles.msgCell}>
                            {l.message ? <div className={styles.msgText} title={l.message}>{l.message}</div> : <span className={styles.muted}>—</span>}
                          </td>
                          <td className={l.promo?.title ? '' : styles.muted}>{l.promo?.title || (l.promo_id ? `#${l.promo_id}` : '—')}</td>
                          <td className={styles.cMeta}>{fmtDate(l.created_at)}</td>
                          <td>
                            <select
                              className={styles.statusSel}
                              value={l.status || 'new'}
                              disabled={savingLeadId === l.id}
                              onChange={e => setLeadStatusValue(l, e.target.value)}
                            >
                              {LEAD_STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {lastPage > 1 && (
                  <div className={styles.pager}>
                    <div className={styles.pagerInfo}>
                      Page {curPage} of {lastPage}{leadsMeta.total != null ? ` · ${leadsMeta.total} total` : ''}
                    </div>
                    <div className={styles.pagerBtns}>
                      <button
                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                        disabled={curPage <= 1 || loadingLeads}
                        onClick={() => setLeadPage(p => Math.max(1, p - 1))}
                      >‹ Prev</button>
                      <button
                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                        disabled={curPage >= lastPage || loadingLeads}
                        onClick={() => setLeadPage(p => p + 1)}
                      >Next ›</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </AdminSection>

      {/* ─────────────────────────────  CREATE / EDIT MODAL  ───────────────────────────── */}
      {showModal && (
        <div className={styles.backdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>{editId ? 'Edit ad' : 'New ad'}</h2>
              <button className={styles.mClose} onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={save}>
              <div className={styles.mBody}>
                {msg && <div className={`${styles.alert} ${styles.alertErr}`}>{msg}</div>}
                <div className={styles.fGrid}>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Image</label>
                    <div className={styles.imgBox}>
                      {imagePreview
                        ? <img className={styles.imgPrev} src={imagePreview} alt="ad preview" />
                        : <div className={styles.imgPrevEmpty} aria-hidden="true">▦</div>}
                      <div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={e => { const fl = e.target.files?.[0]; if (fl) onPickImage(fl); }}
                        />
                        <div className={styles.hint}>PNG, JPG or WEBP, up to 2 MB.{editId ? ' Leave empty to keep the current image.' : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Title<span className={styles.req}> *</span></label>
                    <input className={styles.fIn} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Bootcamp — 40% off" />
                  </div>

                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Description</label>
                    <textarea className={styles.fIn} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short supporting line shown under the title…" />
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fLbl}>CTA label</label>
                    <input className={styles.fIn} value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} placeholder='e.g. "Enquire now"' />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Linked course</label>
                    <select className={styles.fIn} value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}>
                      <option value="">— None —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{courseLabel(c)}</option>)}
                    </select>
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Order number</label>
                    <input className={styles.fIn} type="number" min={0} value={form.order_no} onChange={e => setForm(f => ({ ...f, order_no: e.target.value }))} placeholder="0 = first" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Status</label>
                    <label className={styles.check} style={{ minHeight: 44 }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      Active (shown on the login screen)
                    </label>
                  </div>

                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Starts at</label>
                    <input className={styles.fIn} type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Ends at</label>
                    <input className={styles.fIn} type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Create ad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
