'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from '../courses/courses.module.css';

/* /admin/categories — manage course categories + their feature bullets. */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;   // {data:<paginator>}
  if (Array.isArray(dd)) return dd as T[];
  return [];
}

type Feature = { id: number; feature: string };
type Category = { id: number; name: string; parent_id?: number | null; courses_count?: number; features?: Feature[] };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featInput, setFeatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setCategories(asArray<Category>(await fetchWithAuth(`${BASE}/categories`))); }
    catch { setCategories([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setName(''); setParentId(''); setFeatures([]); setFeatInput(''); setMsg(''); setShowModal(true); };
  const openEdit = (c: Category) => {
    setEditId(c.id); setName(c.name); setParentId(c.parent_id ? String(c.parent_id) : '');
    setFeatures((c.features || []).map(f => f.feature)); setFeatInput(''); setMsg(''); setShowModal(true);
  };

  const addFeature = () => {
    const v = featInput.trim();
    if (v && !features.includes(v)) setFeatures(fs => [...fs, v]);
    setFeatInput('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = { name, parent_id: parentId ? Number(parentId) : null, features };
      await fetchWithAuth(`${BASE}/categories${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      setShowModal(false); load();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed to save the category.'); }
    finally { setSaving(false); }
  };

  const remove = async (c: Category) => {
    if (c.courses_count) { alert(`Cannot delete: ${c.courses_count} course(s) use "${c.name}". Reassign them first.`); return; }
    if (!confirm(`Delete the "${c.name}" category?`)) return;
    try { await fetchWithAuth(`${BASE}/categories/${c.id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Catalogue"
        title="Course Categories"
        description="Group courses (Summer Training, Internship, Job-Oriented Programs…) and set the feature bullets shown on their cards."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Courses', href: '/admin/courses' },
          { label: 'Categories' },
        ]}
      >
        <div className={styles.toolbar}>
          <div className={styles.spacer} />
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/admin/courses">← Back to courses</a>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>+ New Category</button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className={styles.state}><div className={styles.stateTitle}>No categories yet</div>Create one to group your courses.</div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Category</th><th>Courses</th><th>Feature bullets</th><th /></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td><div className={styles.cName}>{c.name}</div></td>
                      <td className={c.courses_count ? '' : styles.muted}>{c.courses_count ?? 0}</td>
                      <td>
                        {(c.features || []).length
                          ? (c.features || []).map(f => <span key={f.id} className={styles.featPill}>{f.feature}</span>)
                          : <span className={styles.muted}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
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
          <div className={`${styles.modal} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>{editId ? 'Edit category' : 'New category'}</h2>
              <button className={styles.mClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={save}>
              <div className={styles.mBody}>
                {msg && <div className={`${styles.alert} ${styles.alertErr}`}>{msg}</div>}
                <div className={styles.fld}>
                  <label className={styles.fLbl}>Name<span className={styles.req}> *</span></label>
                  <input className={styles.fIn} required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Job-Oriented Programs" />
                </div>
                <div className={styles.fld} style={{ marginTop: 12 }}>
                  <label className={styles.fLbl}>Parent category <span className={styles.muted}>(optional)</span></label>
                  <select className={styles.fIn} value={parentId} onChange={e => setParentId(e.target.value)}>
                    <option value="">— None —</option>
                    {categories.filter(c => c.id !== editId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.fld} style={{ marginTop: 12 }}>
                  <label className={styles.fLbl}>Feature bullets <span className={styles.muted}>(shown on course cards)</span></label>
                  {features.length > 0 && (
                    <div className={styles.feats}>
                      {features.map((f, i) => (
                        <span key={i} className={styles.feat}>{f}<button type="button" className={styles.featX} onClick={() => setFeatures(fs => fs.filter((_, j) => j !== i))}>×</button></span>
                      ))}
                    </div>
                  )}
                  <div className={styles.featAdd}>
                    <input className={styles.fIn} value={featInput} onChange={e => setFeatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                      placeholder="e.g. Placement assistance" />
                    <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={addFeature}>Add</button>
                  </div>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Create category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
