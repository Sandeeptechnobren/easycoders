'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './trainerManagement.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/trainerManagement — onboard and manage trainers (users where role=4).
 *
 * Onboarding mints a 7-day temporary password (first login forces a change).
 * A trainer's "teaching tracks" are the batches assigned to them via the
 * batch_trainers pivot — the same pivot the Batches screen writes — so the two
 * stay in sync. Admin-only (every endpoint requires manage_trainers).
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

type Trainer = { id: number; name: string; email: string; phone?: string | null; profile_photo?: string | null; is_active: boolean; status?: string | null; batches_count: number; students_count: number; open_tickets_count: number; created_at?: string };
type Stats = { total: number; active: number; inactive: number; batches: number };
type Batch = { id: number; name: string };
type TrackBatch = { id: number; name: string; course?: string | null; status?: string | null; start_date?: string | null; end_date?: string | null; students_count: number };
type TicketLite = { id: number; ticket_id?: string | null; title: string; status: string; priority?: string | null; student?: { id: number; name: string } | null; category?: { id: number; name: string } | null };
type TrainerDetail = { id: number; name: string; email: string; phone?: string | null; profile_photo?: string | null; is_active: boolean; status?: string | null; created_at?: string; batches: TrackBatch[]; tickets: TicketLite[]; credentials_available: boolean };
type Credentials = { email?: string; password: string; expires_at?: string | null };

const fmtStatus = (s: string) => s.replace(/_/g, ' ');

const STORAGE_BASE = 'https://api.easycoders.in/projects/backend/public';
const photoUrl = (p?: string | null) => (!p ? null : p.startsWith('http') ? p : `${STORAGE_BASE}/storage/${p}`);
const initialsOf = (name: string) => {
  const p = name.trim().split(/\s+/);
  if (!p[0]) return '?';
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase();
};
/** Round trainer avatar — profile photo if set, else initials. */
function Avatar({ name, photo, size = 40 }: { name: string; photo?: string | null; size?: number }) {
  const url = photoUrl(photo);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#0B1B3A', color: '#E8A020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, overflow: 'hidden', flexShrink: 0 }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
}

export default function TrainerManagementPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, batches: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add-trainer modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '' });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState('');
  const [newCreds, setNewCreds] = useState<Credentials | null>(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<TrainerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMsg, setDetailMsg] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [detailCreds, setDetailCreds] = useState<Credentials | null>(null);
  const [credBusy, setCredBusy] = useState(false);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [assignSel, setAssignSel] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchWithAuth(`${BASE}/admin/trainers`);
      setTrainers(asArray<Trainer>(r));
      if (r?.stats) setStats(r.stats as Stats);
    } catch { setTrainers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    fetchWithAuth(`${BASE}/batches`).then(r => setAllBatches(asArray<Batch>(r))).catch(() => setAllBatches([]));
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trainers.filter(t =>
      (!statusFilter || (statusFilter === 'active' ? t.is_active : !t.is_active)) &&
      (!q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.phone || '').toLowerCase().includes(q))
    );
  }, [trainers, query, statusFilter]);

  const copy = (t: string) => { try { navigator.clipboard?.writeText(t); } catch { /* clipboard blocked */ } };

  // ── Add trainer ──
  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setAddMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/admin/trainers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm),
      });
      setNewCreds((r?.data?.credentials as Credentials) || null);
      load();
    } catch (err: unknown) { setAddMsg(err instanceof Error ? err.message : 'Could not onboard the trainer.'); } finally { setAdding(false); }
  };
  const closeAdd = () => { setShowAdd(false); setAddForm({ name: '', email: '', phone: '' }); setAddMsg(''); setNewCreds(null); };

  // ── Detail ──
  const refreshDetail = async (id: number) => {
    const r = await fetchWithAuth(`${BASE}/admin/trainers/${id}`);
    setDetail((r?.data as TrainerDetail) || null);
    return r?.data as TrainerDetail | undefined;
  };
  const openDetail = async (id: number) => {
    setDetailOpen(true); setDetail(null); setDetailMsg(''); setDetailCreds(null); setAssignSel(''); setDetailLoading(true);
    try {
      const d = await refreshDetail(id);
      setEditName(d?.name || ''); setEditEmail(d?.email || ''); setEditPhone(d?.phone || ''); setPhotoFile(null); setPhotoPreview(null);
    } catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Could not load the trainer.'); } finally { setDetailLoading(false); }
  };
  const closeDetail = () => { setDetailOpen(false); setDetail(null); setDetailCreds(null); setDetailMsg(''); };

  const saveProfile = async () => {
    if (!detail) return;
    setSavingProfile(true); setDetailMsg('');
    try {
      // Multipart + `_method=PUT` (Laravel method spoofing) so the optional
      // photo reaches the PUT route — PHP can't parse multipart on a real PUT.
      const fd = new FormData();
      fd.append('_method', 'PUT');
      fd.append('name', editName);
      fd.append('email', editEmail);
      fd.append('phone', editPhone);
      if (photoFile) fd.append('profile_photo', photoFile);
      await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}`, { method: 'POST', body: fd });
      await refreshDetail(detail.id);
      setPhotoFile(null); setPhotoPreview(null);
      load();
    } catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Update failed.'); } finally { setSavingProfile(false); }
  };

  const toggleActive = async () => {
    if (!detail) return; setDetailMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}/toggle-active`, { method: 'POST' });
      const next = !!r?.data?.is_active;
      setDetail({ ...detail, is_active: next, status: next ? 'active' : 'inactive' });
      load();
    } catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Could not change status.'); }
  };

  const fetchCreds = async () => {
    if (!detail) return; setCredBusy(true); setDetailMsg('');
    try { const r = await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}/credentials`); setDetailCreds((r?.data as Credentials) || null); }
    catch (err: unknown) { setDetailCreds(null); setDetailMsg(err instanceof Error ? err.message : 'Temporary credentials are no longer available.'); }
    finally { setCredBusy(false); }
  };
  const regenCreds = async () => {
    if (!detail) return;
    if (!confirm('Issue a brand-new temporary password? The trainer must use the new one on next login.')) return;
    setCredBusy(true); setDetailMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}/regenerate-password`, { method: 'POST' });
      setDetailCreds((r?.data as Credentials) || null);
      setDetail({ ...detail, credentials_available: true });
    } catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Could not regenerate the password.'); } finally { setCredBusy(false); }
  };

  const assignable = useMemo(() => allBatches.filter(b => !(detail?.batches || []).some(x => x.id === b.id)), [allBatches, detail]);
  const assignBatch = async () => {
    if (!detail || !assignSel) return; setAssignBusy(true); setDetailMsg('');
    try {
      await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}/batches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch_ids: [Number(assignSel)] }),
      });
      await refreshDetail(detail.id); setAssignSel(''); load();
    } catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Could not assign the batch.'); } finally { setAssignBusy(false); }
  };
  const removeBatch = async (batchId: number) => {
    if (!detail) return;
    if (!confirm('Remove this batch from the trainer’s teaching tracks?')) return;
    setDetailMsg('');
    try { await fetchWithAuth(`${BASE}/admin/trainers/${detail.id}/batches/${batchId}`, { method: 'DELETE' }); await refreshDetail(detail.id); load(); }
    catch (err: unknown) { setDetailMsg(err instanceof Error ? err.message : 'Could not remove the batch.'); }
  };

  const renderCreds = (c: Credentials) => (
    <div className={styles.creds}>
      <div className={styles.credsTitle}>One-time credentials</div>
      {c.email && (
        <div className={styles.credRow}>
          <div><div className={styles.credKey}>Email</div><div className={styles.credVal}>{c.email}</div></div>
          <button type="button" className={styles.copyBtn} onClick={() => copy(c.email!)}>Copy</button>
        </div>
      )}
      <div className={styles.credRow}>
        <div><div className={styles.credKey}>Temporary password</div><div className={styles.credVal}>{c.password}</div></div>
        <button type="button" className={styles.copyBtn} onClick={() => copy(c.password)}>Copy</button>
      </div>
      <div className={styles.credNote}>Valid until {fmtDateTime(c.expires_at)}. The trainer will be asked to set their own password on first login.</div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · People"
        title="Trainers"
        description="Onboard trainers, manage their access, and assign the batches they teach. New trainers get a one-time password and are asked to set their own on first login."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Trainers' },
        ]}
      >
        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#0B1B3A' }} /><div className={styles.statVal}>{stats.total}</div><div className={styles.statLbl}>Total trainers</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#16A34A' }} /><div className={styles.statVal}>{stats.active}</div><div className={styles.statLbl}>Active</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#94A3B8' }} /><div className={styles.statVal}>{stats.inactive}</div><div className={styles.statLbl}>Inactive</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#E8A020' }} /><div className={styles.statVal}>{stats.batches}</div><div className={styles.statLbl}>Batches covered</div></div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchIn} placeholder="Search by name, email or phone…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className={styles.filterSel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className={styles.spacer} />
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setShowAdd(true); setNewCreds(null); setAddMsg(''); }}>+ Onboard Trainer</button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading trainers…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>{trainers.length === 0 ? 'No trainers yet' : 'No trainers match your filters'}</div>
            {trainers.length === 0 ? 'Onboard your first trainer to get started.' : 'Try clearing the search or status filter.'}
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Trainer</th><th>Phone</th><th>Batches</th><th>Students</th><th>Open tickets</th><th>Status</th><th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={t.name} photo={t.profile_photo} size={36} /><div><div className={styles.uName}>{t.name}</div><div className={styles.uMail}>{t.email}</div></div></div></td>
                      <td className={t.phone ? '' : styles.muted}>{t.phone || '—'}</td>
                      <td className={styles.num}>{t.batches_count}</td>
                      <td className={styles.num}>{t.students_count}</td>
                      <td className={styles.num}>{t.open_tickets_count}</td>
                      <td><span className={`${styles.badge} ${t.is_active ? styles.bActive : styles.bInactive}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td><button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => openDetail(t.id)}>Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminSection>

      {/* ── Add Trainer modal ── */}
      {showAdd && (
        <div className={styles.backdrop} onClick={closeAdd}>
          <div className={`${styles.modal} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <div>
                <h3 className={styles.mTitle}>{newCreds ? 'Trainer onboarded' : 'Onboard a trainer'}</h3>
                <div className={styles.mSub}>{newCreds ? 'Share these credentials securely — they’re shown once.' : 'They’ll get a 7-day temporary password.'}</div>
              </div>
              <button className={styles.mClose} onClick={closeAdd}>×</button>
            </div>
            <div className={styles.mBody}>
              {newCreds ? (
                <>
                  {renderCreds(newCreds)}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeAdd}>Done</button>
                  </div>
                </>
              ) : (
                <form onSubmit={submitAdd}>
                  {addMsg && <div className={`${styles.alert} ${styles.alertErr}`}>{addMsg}</div>}
                  <div className={styles.field}>
                    <label className={styles.label}>Full name</label>
                    <input className={styles.input} required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Anita Sharma" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} type="email" required value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="trainer@easycoders.in" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone <span className={styles.muted}>(optional)</span></label>
                    <input className={styles.input} value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={closeAdd}>Cancel</button>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={adding}>{adding ? 'Onboarding…' : 'Onboard trainer'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / manage modal ── */}
      {detailOpen && (
        <div className={styles.backdrop} onClick={closeDetail}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {detail && <Avatar name={detail.name} photo={detail.profile_photo} size={44} />}
                <div>
                  <h3 className={styles.mTitle}>{detail?.name || 'Trainer'}</h3>
                  <div className={styles.mSub}>{detail?.email}{detail ? ` · ${detail.is_active ? 'Active' : 'Inactive'} · joined ${fmtDate(detail.created_at)}` : ''}</div>
                </div>
              </div>
              <button className={styles.mClose} onClick={closeDetail}>×</button>
            </div>
            <div className={styles.mBody}>
              {detailMsg && <div className={`${styles.alert} ${styles.alertErr}`}>{detailMsg}</div>}
              {detailLoading || !detail ? (
                <div className={styles.empty}>Loading trainer…</div>
              ) : (
                <div className={styles.mGrid}>
                  {/* Left: teaching tracks */}
                  <div>
                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Teaching tracks — assigned batches</div>
                      {detail.batches.length === 0 ? (
                        <div className={styles.empty}>No batches assigned yet.</div>
                      ) : detail.batches.map(b => (
                        <div key={b.id} className={styles.trackRow}>
                          <div>
                            <div className={styles.trackName}>{b.name}</div>
                            <div className={styles.trackMeta}>{b.course || 'No course'} · {b.students_count} student{b.students_count === 1 ? '' : 's'}{b.status ? ` · ${b.status}` : ''}</div>
                          </div>
                          <button className={styles.rmBtn} onClick={() => removeBatch(b.id)}>Remove</button>
                        </div>
                      ))}
                      <div className={styles.assignRow}>
                        <select className={styles.filterSel} value={assignSel} onChange={e => setAssignSel(e.target.value)}>
                          <option value="">{assignable.length ? 'Assign a batch…' : 'No more batches'}</option>
                          {assignable.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <button className={`${styles.btn} ${styles.btnGold}`} disabled={!assignSel || assignBusy} onClick={assignBatch}>{assignBusy ? 'Adding…' : 'Add'}</button>
                      </div>
                    </div>

                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Recent assigned tickets</div>
                      {detail.tickets.length === 0 ? (
                        <div className={styles.empty}>No tickets assigned to this trainer.</div>
                      ) : detail.tickets.map(tk => (
                        <div key={tk.id} className={styles.ticketRow}>
                          <div>
                            <div className={styles.ticketTitle}>{tk.title}</div>
                            <div className={styles.ticketId}>{tk.ticket_id || `#${tk.id}`}{tk.student?.name ? ` · ${tk.student.name}` : ''}</div>
                          </div>
                          <span className={`${styles.badge} ${styles[`st_${tk.status}`] || styles.st_open}`}>{fmtStatus(tk.status)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: profile + access + credentials */}
                  <div>
                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Profile</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        {photoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoPreview} alt="Preview" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <Avatar name={editName || detail.name} photo={detail.profile_photo} size={56} />
                        )}
                        <div>
                          <label className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} style={{ cursor: 'pointer', display: 'inline-block' }}>
                            Change photo
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0] || null;
                                setPhotoFile(f);
                                setPhotoPreview(f ? URL.createObjectURL(f) : null);
                              }}
                            />
                          </label>
                          <div className={styles.muted} style={{ fontSize: 12, marginTop: 4 }}>JPG / PNG / WebP, up to 2 MB.</div>
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Name</label>
                        <input className={styles.input} value={editName} onChange={e => setEditName(e.target.value)} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Email <span className={styles.muted}>(login)</span></label>
                        <input className={styles.input} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Phone</label>
                        <input className={styles.input} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="—" />
                      </div>
                      <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} disabled={savingProfile} onClick={saveProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</button>
                    </div>

                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Access</div>
                      <div className={styles.metaRow}><span className={styles.metaKey}>Status</span><span><span className={`${styles.badge} ${detail.is_active ? styles.bActive : styles.bInactive}`}>{detail.is_active ? 'Active' : 'Inactive'}</span></span></div>
                      <button className={`${styles.btn} ${detail.is_active ? styles.btnDanger : styles.btnGold} ${styles.btnSm}`} style={{ marginTop: 12 }} onClick={toggleActive}>
                        {detail.is_active ? 'Deactivate trainer' : 'Activate trainer'}
                      </button>
                    </div>

                    {detailCreds ? (
                      renderCreds(detailCreds)
                    ) : (
                      <div className={styles.block}>
                        <div className={styles.blockTitle}>Credentials</div>
                        <div className={styles.empty} style={{ marginBottom: 10 }}>
                          {detail.credentials_available ? 'A live temporary password exists for this trainer.' : 'No live temporary password — the trainer has set their own, or it expired.'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {detail.credentials_available && <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={credBusy} onClick={fetchCreds}>{credBusy ? '…' : 'Show password'}</button>}
                          <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} disabled={credBusy} onClick={regenCreds}>{credBusy ? '…' : 'Regenerate password'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
