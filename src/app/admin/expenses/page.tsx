'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';

/* /admin/expenses — business expense tracking. ADMIN ONLY.
 *
 * These rows expose salaries, so the backend grants `manage_expenses` to admin
 * and deliberately not to HR; this page is gated to role 1 to match.
 *
 * Money is never touched by float arithmetic here: the API returns amounts as
 * strings and every total shown comes from the server, so the browser only ever
 * formats — it never sums.
 *
 * ⚠️ Classes are `exp-*` / `expm-*` prefixed — Bootstrap is global via CDN, so
 * bare .modal/.card/.btn/.badge would collide. */

const BASE = 'https://api.easycoders.in/api';

type Category = { id: number; name: string; is_active: boolean; sort_order: number };

type Expense = {
  id: number;
  expense_date: string;
  category_id: number;
  amount: string;
  paid_to: string;
  payment_mode: string;
  reference_no: string | null;
  description: string | null;
  has_receipt: boolean;
  category?: { id: number; name: string } | null;
  creator?: { id: number; name: string } | null;
};

type Summary = {
  this_month: string;
  last_month: string;
  this_year: string;
  entry_count: number;
  by_category: { category_id: number; name: string; total: string }[];
};

const MODES = [
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'bank_transfer', label: 'Bank transfer' },
  { key: 'card', label: 'Card' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'other', label: 'Other' },
];
const MODE_LABEL: Record<string, string> = Object.fromEntries(MODES.map(m => [m.key, m.label]));

/* Formatting only — never arithmetic. The server owns every total. */
const inr = (v: string | number) =>
  '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : `${s}T00:00:00`);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/* Colour per category, derived from its name so it stays stable as categories
 * are added — no hardcoded map to fall out of sync. */
const TINTS = [
  { bg: '#EEEDFE', fg: '#3C3489', bar: '#7F77DD' },
  { bg: '#E1F5EE', fg: '#085041', bar: '#1D9E75' },
  { bg: '#FAECE7', fg: '#712B13', bar: '#D85A30' },
  { bg: '#FAEEDA', fg: '#633806', bar: '#EF9F27' },
  { bg: '#E6F1FB', fg: '#0C447C', bar: '#378ADD' },
  { bg: '#FBEAF0', fg: '#72243E', bar: '#D4537E' },
  { bg: '#EAF3DE', fg: '#27500A', bar: '#639922' },
];
const tintFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

export default function AdminExpensesPage() {
  const [items, setItems]     = useState<Expense[]>([]);
  const [cats, setCats]       = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal]     = useState<string>('0.00');
  const [page, setPage]       = useState(1);
  const [lastPage, setLast]   = useState(1);
  const [loading, setLoad]    = useState(true);
  const [busy, setBusy]       = useState<number | null>(null);
  const [err, setErr]         = useState('');

  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [catId, setCatId]     = useState('');
  const [mode, setMode]       = useState('');
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');

  const [editing, setEditing] = useState<Expense | null>(null);
  const [adding, setAdding]   = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    setErr('');
    const qs = new URLSearchParams({ page: String(page), per_page: '25' });
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (catId) qs.set('category_id', catId);
    if (mode) qs.set('payment_mode', mode);
    if (query) qs.set('search', query);

    Promise.all([
      fetchWithAuth(`${BASE}/admin/expenses?${qs.toString()}`),
      fetchWithAuth(`${BASE}/admin/expenses/summary`),
    ])
      .then(([list, sum]) => {
        const p = list?.data;
        setItems(Array.isArray(p?.data) ? p.data : []);
        setLast(p?.last_page ?? 1);
        setTotal(list?.meta?.filtered_total ?? '0.00');
        setSummary(sum?.data ?? null);
      })
      .catch((e: unknown) => {
        setItems([]);
        setErr(e instanceof Error ? e.message : 'Could not load expenses.');
      })
      .finally(() => setLoad(false));
  }, [page, from, to, catId, mode, query]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchWithAuth(`${BASE}/admin/expense-categories`)
      .then(r => setCats(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setCats([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const filtersOn = Boolean(from || to || catId || mode || query);

  const remove = async (e: Expense) => {
    if (!confirm(`Delete the ${inr(e.amount)} expense paid to ${e.paid_to}?`)) return;
    setBusy(e.id);
    try {
      await fetchWithAuth(`${BASE}/admin/expenses/${e.id}`, { method: 'DELETE' });
      load();
    } catch (ex: unknown) {
      alert(ex instanceof Error ? ex.message : 'Delete failed.');
    } finally { setBusy(null); }
  };

  const openReceipt = async (e: Expense) => {
    // The receipt endpoint is authenticated, so a plain <a href> would 401.
    // Fetch it with the bearer token and hand the browser a blob URL instead.
    setBusy(e.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE}/admin/expenses/${e.id}/receipt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Receipt could not be opened.');
      const url = URL.createObjectURL(await res.blob());
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (ex: unknown) {
      alert(ex instanceof Error ? ex.message : 'Receipt could not be opened.');
    } finally { setBusy(null); }
  };

  const exportCsv = async () => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (catId) qs.set('category_id', catId);
    if (mode) qs.set('payment_mode', mode);
    if (query) qs.set('search', query);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE}/admin/expenses/export?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed.');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (ex: unknown) {
      alert(ex instanceof Error ? ex.message : 'Export failed.');
    }
  };

  const maxCat = useMemo(
    () => Math.max(1, ...(summary?.by_category ?? []).map(c => Number(c.total))),
    [summary],
  );

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Finance"
        title="Expenses"
        description="Every rupee the business spends — rent, salaries, marketing, utilities. Attach receipts and export it all for your accountant."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Expenses' },
        ]}
      >
        <div className="exp">
          {/* Summary */}
          <div className="exp-stats">
            <div className="exp-stat"><span>This month</span><strong>{summary ? inr(summary.this_month) : '—'}</strong></div>
            <div className="exp-stat"><span>Last month</span><strong>{summary ? inr(summary.last_month) : '—'}</strong></div>
            <div className="exp-stat"><span>This year</span><strong>{summary ? inr(summary.this_year) : '—'}</strong></div>
            <div className="exp-stat"><span>Entries</span><strong>{summary?.entry_count ?? '—'}</strong></div>
          </div>

          {/* Filters */}
          <div className="exp-bar">
            <input className="exp-in" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span className="exp-to">to</span>
            <input className="exp-in" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
            <select className="exp-in" value={catId} onChange={e => { setCatId(e.target.value); setPage(1); }} aria-label="Category">
              <option value="">All categories</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="exp-in" value={mode} onChange={e => { setMode(e.target.value); setPage(1); }} aria-label="Payment mode">
              <option value="">Any mode</option>
              {MODES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <input className="exp-in exp-search" placeholder="Search payee, note, reference…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="exp-btn ghost" onClick={exportCsv}>Export CSV</button>
            <button className="exp-new" onClick={() => setAdding(true)}>+ Add expense</button>
          </div>

          {filtersOn && !loading && !err && (
            <div className="exp-filtered">
              Showing <strong>{inr(total)}</strong> across the current filter.
              <button className="exp-clear" onClick={() => { setFrom(''); setTo(''); setCatId(''); setMode(''); setSearch(''); setPage(1); }}>Clear filters</button>
            </div>
          )}

          {err && (
            <div className="exp-error">
              <span>{err}</span>
              <button className="exp-retry" onClick={load}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="exp-empty">Loading expenses…</div>
          ) : err ? null : items.length === 0 ? (
            <div className="exp-empty">
              {filtersOn ? 'No expenses match this filter.' : 'No expenses recorded yet. Add your first one.'}
            </div>
          ) : (
            <div className="exp-table">
              <div className="exp-head">
                <div>Date</div><div>Category</div><div>Paid to</div>
                <div className="right">Amount</div><div>Mode</div><div />
              </div>
              {items.map(e => {
                const t = tintFor(e.category?.name ?? '—');
                return (
                  <div key={e.id} className="exp-row">
                    <div className="exp-date">{fmtDate(e.expense_date)}</div>
                    <div><span className="exp-tag" style={{ background: t.bg, color: t.fg }}>{e.category?.name ?? '—'}</span></div>
                    <div className="exp-payee" title={e.description ?? undefined}>{e.paid_to}</div>
                    <div className="right exp-amt">{inr(e.amount)}</div>
                    <div className="exp-mode">{MODE_LABEL[e.payment_mode] ?? e.payment_mode}</div>
                    <div className="exp-acts">
                      {e.has_receipt && (
                        <button className="exp-ico" title="View receipt" aria-label="View receipt" disabled={busy === e.id} onClick={() => openReceipt(e)}>◧</button>
                      )}
                      <button className="exp-ico" title="Edit" aria-label="Edit" disabled={busy === e.id} onClick={() => setEditing(e)}>✎</button>
                      <button className="exp-ico del" title="Delete" aria-label="Delete" disabled={busy === e.id} onClick={() => remove(e)}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {lastPage > 1 && (
            <div className="exp-pager">
              <button className="exp-btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="exp-pageinfo">Page {page} of {lastPage}</span>
              <button className="exp-btn ghost" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}

          {/* Where the money went */}
          {summary && summary.by_category.length > 0 && (
            <div className="exp-break">
              <h3 className="exp-break-t">Where the money went — this month</h3>
              {summary.by_category.map(c => (
                <div key={c.category_id} className="exp-brow">
                  <div className="exp-bname">{c.name}</div>
                  <div className="exp-btrack">
                    <span style={{ width: `${(Number(c.total) / maxCat) * 100}%`, background: tintFor(c.name).bar }} />
                  </div>
                  <div className="exp-bval">{inr(c.total)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(adding || editing) && (
          <ExpenseModal
            expense={editing}
            categories={cats}
            onClose={() => { setAdding(false); setEditing(null); }}
            onSaved={() => { setAdding(false); setEditing(null); load(); }}
            onCategoryAdded={(c) => setCats(prev => [...prev, c])}
          />
        )}

        <style jsx>{`
          .exp { font-family: 'DM Sans', system-ui, sans-serif; }

          .exp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 18px; }
          .exp-stat { background: #f7f9fc; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 3px; }
          .exp-stat span { font-size: 12.5px; color: #64748b; }
          .exp-stat strong { font-size: 22px; font-weight: 700; color: #0B1B3A; }

          .exp-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
          .exp-in { border: 1px solid #e5e9f2; border-radius: 9px; padding: 8px 11px; font-size: 13px; font-family: inherit; color: #0B1B3A; outline: none; background: #fff; box-sizing: border-box; }
          .exp-in:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .exp-to { font-size: 12.5px; color: #94a3b8; }
          .exp-search { flex: 1; min-width: 170px; }
          .exp-new { background: #E8A020; border: 1.5px solid #E8A020; color: #0B1B3A; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
          .exp-new:hover { filter: brightness(1.06); }

          .exp-filtered { font-size: 13px; color: #4a5568; background: #f7f9fc; border-radius: 9px; padding: 9px 13px; margin-bottom: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
          .exp-filtered strong { color: #0B1B3A; }
          .exp-clear { background: none; border: none; color: #2D6CDF; font-size: 12.5px; cursor: pointer; font-family: inherit; text-decoration: underline; padding: 0; }

          .exp-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 14px; }
          .exp-retry { background: #fff; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
          .exp-empty { padding: 44px; text-align: center; color: #8492a6; font-size: 14px; }

          .exp-table { background: #fff; border: 1px solid #e5e9f2; border-radius: 14px; overflow: hidden; }
          .exp-head, .exp-row { display: grid; grid-template-columns: 72px minmax(0,1fr) minmax(0,1.2fr) 108px 92px 92px; gap: 10px; align-items: center; }
          .exp-head { padding: 11px 15px; border-bottom: 1px solid #e5e9f2; font-size: 12px; color: #64748b; }
          .exp-row { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
          .exp-row:last-child { border-bottom: none; }
          .right { text-align: right; }
          @media (max-width: 820px) {
            .exp-head { display: none; }
            .exp-row { grid-template-columns: minmax(0,1fr) auto; row-gap: 4px; }
            .right { text-align: left; }
          }

          .exp-date { color: #64748b; font-size: 12.5px; }
          .exp-tag { font-size: 12px; padding: 3px 10px; border-radius: 100px; display: inline-block; }
          .exp-payee { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0B1B3A; }
          .exp-amt { font-weight: 700; color: #0B1B3A; }
          .exp-mode { font-size: 12.5px; color: #64748b; }
          .exp-acts { display: flex; gap: 4px; justify-content: flex-end; }
          .exp-ico { width: 28px; height: 28px; border: 1px solid #e5e9f2; background: #fff; border-radius: 8px; cursor: pointer; color: #4a5568; font-size: 14px; line-height: 1; font-family: inherit; }
          .exp-ico:hover:not(:disabled) { border-color: #0B1B3A; color: #0B1B3A; }
          .exp-ico.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
          .exp-ico:disabled { opacity: .45; cursor: not-allowed; }

          .exp-btn { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 9px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
          .exp-btn:disabled { opacity: .5; cursor: not-allowed; }
          .exp-btn.ghost:hover:not(:disabled) { border-color: #0B1B3A; color: #0B1B3A; }
          .exp-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; }
          .exp-pageinfo { font-size: 12.5px; color: #64748b; }

          .exp-break { margin-top: 22px; background: #fff; border: 1px solid #e5e9f2; border-radius: 14px; padding: 16px 18px; }
          .exp-break-t { font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #0B1B3A; margin: 0 0 14px; }
          .exp-brow { display: grid; grid-template-columns: 140px minmax(0,1fr) 96px; gap: 10px; align-items: center; margin-bottom: 9px; }
          .exp-brow:last-child { margin-bottom: 0; }
          .exp-bname { font-size: 13px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .exp-btrack { height: 9px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
          .exp-btrack span { display: block; height: 100%; border-radius: 100px; }
          .exp-bval { font-size: 13px; text-align: right; color: #0B1B3A; font-weight: 600; }
          @media (max-width: 640px) { .exp-brow { grid-template-columns: 100px minmax(0,1fr) 84px; } }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Add / edit modal ─── */
function ExpenseModal({ expense, categories, onClose, onSaved, onCategoryAdded }: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  onCategoryAdded: (c: Category) => void;
}) {
  const [date, setDate]       = useState(expense?.expense_date?.slice(0, 10) ?? '');
  const [catId, setCatId]     = useState(expense ? String(expense.category_id) : '');
  const [amount, setAmount]   = useState(expense?.amount ?? '');
  const [paidTo, setPaidTo]   = useState(expense?.paid_to ?? '');
  const [mode, setMode]       = useState(expense?.payment_mode ?? 'cash');
  const [ref, setRef]         = useState(expense?.reference_no ?? '');
  const [notes, setNotes]     = useState(expense?.description ?? '');
  const [file, setFile]       = useState<File | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [newCat, setNewCat]   = useState('');
  const [addingCat, setAddCat] = useState(false);
  const [today, setToday]     = useState('');

  // Computed in an effect, not in render — new Date() in a render body trips
  // react-hooks/purity at build time.
  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setToday(iso);
    if (!expense) setDate(prev => prev || iso);
  }, [expense]);

  const canSave =
    date !== '' && catId !== '' && amount.trim() !== '' && paidTo.trim() !== '' && !saving;

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    setAddCat(true);
    try {
      const r = await fetchWithAuth(`${BASE}/admin/expense-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (r?.data) { onCategoryAdded(r.data); setCatId(String(r.data.id)); }
      setNewCat('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not add the category.');
    } finally { setAddCat(false); }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('expense_date', date);
      fd.append('category_id', catId);
      fd.append('amount', amount.trim());
      fd.append('paid_to', paidTo.trim());
      fd.append('payment_mode', mode);
      if (ref.trim()) fd.append('reference_no', ref.trim());
      if (notes.trim()) fd.append('description', notes.trim());
      if (file) fd.append('receipt', file);

      // Laravel cannot read multipart on a real PUT, so an edit posts with
      // _method=PUT (same trick the ads/gallery screens use).
      const url = expense
        ? `${BASE}/admin/expenses/${expense.id}`
        : `${BASE}/admin/expenses`;
      if (expense) fd.append('_method', 'PUT');

      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? `Save failed (HTTP ${res.status}).`);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="expm-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="expm">
        <h3 className="expm-title">{expense ? 'Edit expense' : 'Add expense'}</h3>

        {error && <div className="expm-error">{error}</div>}

        <div className="expm-row">
          <div>
            <label className="expm-label">Date</label>
            <input className="expm-in" type="date" value={date} max={today || undefined} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="expm-label">Amount (₹)</label>
            <input className="expm-in" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="18000.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <label className="expm-label">Category</label>
        <select className="expm-in" value={catId} onChange={e => setCatId(e.target.value)}>
          <option value="">Choose a category…</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="expm-addcat">
          <input className="expm-in expm-catin" placeholder="…or add a new one" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <button className="expm-btn ghost" onClick={addCategory} disabled={!newCat.trim() || addingCat}>{addingCat ? 'Adding…' : 'Add'}</button>
        </div>

        <label className="expm-label">Paid to</label>
        <input className="expm-in" placeholder="Bharti Enterprises" value={paidTo} maxLength={160} onChange={e => setPaidTo(e.target.value)} />

        <div className="expm-row">
          <div>
            <label className="expm-label">Paid by</label>
            <select className="expm-in" value={mode} onChange={e => setMode(e.target.value)}>
              {MODES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="expm-label">Reference</label>
            <input className="expm-in" placeholder="Optional" value={ref} maxLength={80} onChange={e => setRef(e.target.value)} />
          </div>
        </div>

        <label className="expm-label">Notes</label>
        <textarea className="expm-in expm-ta" placeholder="Optional" value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} />

        <label className="expm-label">Receipt</label>
        <input className="expm-in" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <div className="expm-hint">
          Photo or PDF, optional{expense?.has_receipt ? ' — choosing a new file replaces the current one.' : '.'} Only signed-in admins can open it.
        </div>

        <div className="expm-actions">
          <button className="expm-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="expm-btn save" onClick={save} disabled={!canSave}>{saving ? 'Saving…' : expense ? 'Save changes' : 'Save expense'}</button>
        </div>

        <style jsx>{`
          /* :global() — styled-jsx does not scope the outermost node of a createPortal argument. */
          :global(.expm-overlay) {
            position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
            padding: 16px; overflow-y: auto;
          }
          .expm { background: #fff; border-radius: 18px; padding: 24px; width: 100%; max-width: 470px; max-height: 90vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 28px 70px rgba(0,0,0,0.4); }
          .expm-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0 0 14px; }
          .expm-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; }
          .expm-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 13px 0 5px; }
          .expm-in { width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 9px 12px; font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; box-sizing: border-box; background: #fff; }
          .expm-in:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .expm-ta { min-height: 66px; resize: vertical; line-height: 1.5; }
          .expm-row { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
          .expm-addcat { display: flex; gap: 8px; margin-top: 8px; }
          .expm-catin { flex: 1; }
          .expm-hint { font-size: 11.5px; color: #64748b; margin-top: 5px; line-height: 1.45; }
          .expm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
          .expm-btn { border-radius: 10px; padding: 9px 17px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; white-space: nowrap; }
          .expm-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .expm-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .expm-btn:disabled { opacity: .55; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
