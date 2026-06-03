'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './courses.module.css';

/* /admin/courses — manage course offerings (the public-facing catalogue). */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  return [];
}
const inr = (n: unknown) => {
  const v = Number(n);
  return isNaN(v) ? '—' : `₹${v.toLocaleString('en-IN')}`;
};

type Category = { id: number; name: string; courses_count?: number };
type Course = {
  id: number; title: string; description?: string;
  category_id?: number; category?: { id: number; name: string } | null;
  original_price?: number | string; discounted_price?: number | string; offer?: string | null;
  duration?: string; duration_weeks?: number | null; level?: string;
  status?: string; thumbnail?: string | null; is_free?: boolean;
  total_seats?: number | null; enrollment_prefix?: string | null; batches_count?: number;
};

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const STATUSES = ['draft', 'published', 'archived'];

const EMPTY = {
  title: '', category_id: '', description: '', level: 'beginner', duration: '', duration_weeks: '',
  original_price: '', discounted_price: '', offer: '', is_free: false, total_seats: '',
  enrollment_prefix: '', status: 'draft', thumbnail: '',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cat] = await Promise.all([
        fetchWithAuth(`${BASE}/admin/courses`),
        fetchWithAuth(`${BASE}/categories`),
      ]);
      setCourses(asArray<Course>(c));
      setCategories(asArray<Category>(cat));
    } catch { setCourses([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    cats: categories.length,
  }), [courses, categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(c =>
      (!statusFilter || c.status === statusFilter) &&
      (!catFilter || String(c.category?.id ?? c.category_id ?? '') === catFilter) &&
      (!q || c.title.toLowerCase().includes(q) || (c.category?.name || '').toLowerCase().includes(q))
    );
  }, [courses, query, statusFilter, catFilter]);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setMsg(''); setShowModal(true); };
  const openEdit = (c: Course) => {
    setEditId(c.id);
    setForm({
      title: c.title || '', category_id: String(c.category?.id ?? c.category_id ?? ''),
      description: c.description || '', level: c.level || 'beginner',
      duration: c.duration || '', duration_weeks: c.duration_weeks != null ? String(c.duration_weeks) : '',
      original_price: c.original_price != null ? String(c.original_price) : '',
      discounted_price: c.discounted_price != null ? String(c.discounted_price) : '',
      offer: c.offer || '', is_free: !!c.is_free,
      total_seats: c.total_seats != null ? String(c.total_seats) : '',
      enrollment_prefix: c.enrollment_prefix || '', status: c.status || 'draft', thumbnail: c.thumbnail || '',
    });
    setMsg(''); setShowModal(true);
  };

  const uploadThumb = async (file: File) => {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/courses/upload-thumbnail`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Upload failed.');
      setForm(f => ({ ...f, thumbnail: json?.data?.url || '' }));
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Thumbnail upload failed.'); }
    finally { setUploading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = {
        title: form.title, category_id: Number(form.category_id), description: form.description,
        level: form.level, duration: form.duration,
        duration_weeks: form.duration_weeks === '' ? null : Number(form.duration_weeks),
        original_price: form.is_free ? 0 : Number(form.original_price || 0),
        discounted_price: form.is_free ? 0 : (form.discounted_price === '' ? null : Number(form.discounted_price)),
        offer: form.offer || null, is_free: form.is_free,
        total_seats: form.total_seats === '' ? null : Number(form.total_seats),
        enrollment_prefix: form.enrollment_prefix || null, status: form.status, thumbnail: form.thumbnail || null,
      };
      await fetchWithAuth(`${BASE}/courses${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      setShowModal(false); load();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed to save the course.'); }
    finally { setSaving(false); }
  };

  const setStatus = async (c: Course, status: string) => {
    try {
      await fetchWithAuth(`${BASE}/courses/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not update status.'); }
  };

  const remove = async (c: Course) => {
    if (!confirm(`Delete "${c.title}"? It will be removed from the public catalogue.`)) return;
    try { await fetchWithAuth(`${BASE}/courses/${c.id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Catalogue"
        title="Courses"
        description="Manage the course offerings shown across the public site — pricing, level, seats, thumbnail and publish status. Draft courses stay hidden until you publish them."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Courses' },
        ]}
      >
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#0B1B3A' }} /><div className={styles.statVal}>{stats.total}</div><div className={styles.statLbl}>Courses</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#16A34A' }} /><div className={styles.statVal}>{stats.published}</div><div className={styles.statLbl}>Published</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#E8A020' }} /><div className={styles.statVal}>{stats.draft}</div><div className={styles.statLbl}>Drafts</div></div>
          <div className={styles.stat}><span className={styles.statBar} style={{ background: '#1D4ED8' }} /><div className={styles.statVal}>{stats.cats}</div><div className={styles.statLbl}>Categories</div></div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchIn} placeholder="Search courses…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className={styles.filterSel} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={styles.filterSel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
          <div className={styles.spacer} />
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/admin/categories">Manage categories</a>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>+ New Course</button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading courses…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>{courses.length === 0 ? 'No courses yet' : 'No courses match your filters'}</div>
            {courses.length === 0 ? 'Create your first course to populate the public catalogue.' : 'Try clearing the search or filters.'}
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th /><th>Course</th><th>Price</th><th>Level</th><th>Seats</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>{c.thumbnail ? <img className={styles.thumb} src={c.thumbnail} alt="" /> : <div className={styles.thumbEmpty}>▦</div>}</td>
                      <td>
                        <div className={styles.cName}>{c.title}</div>
                        <div className={styles.cMeta}>{c.category?.name || 'Uncategorised'}{c.duration ? ` · ${c.duration}` : ''}</div>
                      </td>
                      <td>
                        {c.is_free ? <span className={`${styles.badge} ${styles.st_published}`}>Free</span> : (
                          <span className={styles.price}>
                            {inr(c.discounted_price ?? c.original_price)}
                            {c.discounted_price != null && Number(c.discounted_price) < Number(c.original_price) && <span className={styles.strike}>{inr(c.original_price)}</span>}
                          </span>
                        )}
                        {c.offer ? <span className={`${styles.badge} ${styles.offer}`} style={{ marginLeft: 6 }}>{c.offer}</span> : null}
                      </td>
                      <td><span className={`${styles.badge} ${styles.lvl}`}>{c.level || 'beginner'}</span></td>
                      <td className={c.total_seats ? '' : styles.muted}>{c.total_seats ?? '—'}</td>
                      <td><span className={`${styles.badge} ${styles[`st_${c.status}`] || styles.st_draft}`}>{c.status || 'draft'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {c.status !== 'published'
                            ? <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} onClick={() => setStatus(c, 'published')}>Publish</button>
                            : <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setStatus(c, 'draft')}>Unpublish</button>}
                          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => openEdit(c)}>Edit</button>
                          <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => remove(c)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminSection>

      {showModal && (
        <div className={styles.backdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>{editId ? 'Edit course' : 'New course'}</h2>
              <button className={styles.mClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className={styles.mBody}>
                {msg && <div className={`${styles.alert} ${styles.alertErr}`}>{msg}</div>}
                <div className={styles.fGrid}>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Title<span className={styles.req}> *</span></label>
                    <input className={styles.fIn} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Full-Stack Java Development" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Category<span className={styles.req}> *</span></label>
                    <select className={styles.fIn} required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                      <option value="">— Select —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Level</label>
                    <select className={styles.fIn} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                      {LEVELS.map(l => <option key={l} value={l} style={{ textTransform: 'capitalize' }}>{l}</option>)}
                    </select>
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Description<span className={styles.req}> *</span></label>
                    <textarea className={styles.fIn} required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What the course covers and who it's for…" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Duration<span className={styles.req}> *</span></label>
                    <input className={styles.fIn} required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 months" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Duration (weeks)</label>
                    <input className={styles.fIn} type="number" min={0} value={form.duration_weeks} onChange={e => setForm(f => ({ ...f, duration_weeks: e.target.value }))} placeholder="e.g. 12" />
                  </div>

                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.check}>
                      <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} />
                      This is a free course
                    </label>
                  </div>

                  {!form.is_free && (
                    <>
                      <div className={styles.fld}>
                        <label className={styles.fLbl}>Original price (₹)<span className={styles.req}> *</span></label>
                        <input className={styles.fIn} type="number" min={0} required={!form.is_free} value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="e.g. 25000" />
                      </div>
                      <div className={styles.fld}>
                        <label className={styles.fLbl}>Discounted price (₹)</label>
                        <input className={styles.fIn} type="number" min={0} value={form.discounted_price} onChange={e => setForm(f => ({ ...f, discounted_price: e.target.value }))} placeholder="leave blank if none" />
                      </div>
                      <div className={styles.fld}>
                        <label className={styles.fLbl}>Offer label</label>
                        <input className={styles.fIn} value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} placeholder='e.g. "20% OFF"' />
                      </div>
                    </>
                  )}

                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Total seats</label>
                    <input className={styles.fIn} type="number" min={0} value={form.total_seats} onChange={e => setForm(f => ({ ...f, total_seats: e.target.value }))} placeholder="optional" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Enrolment prefix</label>
                    <input className={styles.fIn} maxLength={10} value={form.enrollment_prefix} onChange={e => setForm(f => ({ ...f, enrollment_prefix: e.target.value }))} placeholder="e.g. JAVA" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Status</label>
                    <select className={styles.fIn} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                    </select>
                  </div>

                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Thumbnail</label>
                    <div className={styles.thumbBox}>
                      {form.thumbnail && <img className={styles.thumbPrev} src={form.thumbnail} alt="thumbnail" />}
                      <div>
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const fl = e.target.files?.[0]; if (fl) uploadThumb(fl); }} />
                        {uploading && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Uploading…</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Create course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
