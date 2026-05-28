'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/admissions — Admit a Student (Easy Coders)
 *
 * Single long form (sectioned): Personal · Contact & Family · Education ·
 * Program & Fees. On submit it POSTs to /api/admissions with
 * `auto_enroll: true` (Phase 1 backend), which atomically creates the
 * student account + profile + approved admission and returns a one-time
 * temporary password. A success modal surfaces the credentials with
 * copy-to-clipboard and an "email these" mailto shortcut.
 *
 * Cascade: Category (program) → Course → Batch. Courses are loaded once and
 * filtered client-side by category_id; batches filtered by course_id.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Category = { id: number; name: string; parent_id?: number | null };
type Course = {
  id: number;
  category_id: number;
  title: string;
  discounted_price?: number | string;
  original_price?: number | string;
  category?: { id: number; name: string };
};
type Batch = { id: number; name: string; course_id?: number; status?: string };
type Coupon = { id: number; code: string; discount_type: string; discount_value: number };

type Credentials = { enrollment_id: string; email: string; password: string; expires_at: string };
type AdmitResult = {
  user: { id: number; name: string; email: string } | null;
  credentials: Credentials | null;
};

type Form = {
  student_name: string; student_email: string; student_phone: string; college_name: string;
  date_of_birth: string; gender: string; blood_group: string;
  father_name: string; mother_name: string;
  guardian_name: string; guardian_phone: string; guardian_email: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  address_line1: string; address_line2: string; city: string; state: string; postal_code: string; country: string;
  highest_qualification: string; qualification_institute: string; qualification_year: string; qualification_percent: string;
  id_proof_type: string; id_proof_number: string;
  category_id: string; course_id: string; batch_id: string;
  total_fees: string; payment_mode: string; coupon_code: string;
  referral_source: string; notes: string;
};

const EMPTY_FORM: Form = {
  student_name: '', student_email: '', student_phone: '', college_name: '',
  date_of_birth: '', gender: '', blood_group: '',
  father_name: '', mother_name: '',
  guardian_name: '', guardian_phone: '', guardian_email: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'India',
  highest_qualification: '', qualification_institute: '', qualification_year: '', qualification_percent: '',
  id_proof_type: '', id_proof_number: '',
  category_id: '', course_id: '', batch_id: '',
  total_fees: '', payment_mode: 'cash', coupon_code: '',
  referral_source: '', notes: '',
};

const GENDERS      = [['male', 'Male'], ['female', 'Female'], ['other', 'Other'], ['prefer_not_to_say', 'Prefer not to say']];
const PAY_MODES    = [['cash', 'Cash'], ['online', 'Online'], ['cheque', 'Cheque'], ['bank_transfer', 'Bank transfer'], ['waived', 'Waived']];
const ID_PROOFS    = [['aadhaar', 'Aadhaar'], ['pan', 'PAN'], ['passport', 'Passport'], ['driving_license', 'Driving license'], ['voter_id', 'Voter ID'], ['other', 'Other']];

export default function AdmitStudentPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses]       = useState<Course[]>([]);
  const [batches, setBatches]       = useState<Batch[]>([]);

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [installments, setInstallments] = useState<Array<{ amount: string; due_date: string }>>([]);
  const [coupon, setCoupon]       = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult]     = useState<AdmitResult | null>(null);
  const [copied, setCopied]     = useState(false);

  /* ─── Load lookups once ─── */
  useEffect(() => {
    fetchWithAuth(`${BASE}/categories`)
      .then(j => setCategories(Array.isArray(j) ? j : (j?.data ?? [])))
      .catch(() => setCategories([]));
    fetchWithAuth(`${BASE}/courses`)
      .then(j => setCourses(Array.isArray(j) ? j : (j?.data ?? [])))
      .catch(() => setCourses([]));
    fetchWithAuth(`${BASE}/batches`)
      .then(j => setBatches(Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : [])))
      .catch(() => setBatches([]));
  }, []);

  const setField = (k: keyof Form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  /* ─── Cascade derivations ─── */
  const visibleCourses = useMemo(
    () => (form.category_id ? courses.filter(c => String(c.category_id) === form.category_id) : courses),
    [courses, form.category_id]
  );
  const visibleBatches = useMemo(
    () => (form.course_id ? batches.filter(b => !b.course_id || String(b.course_id) === form.course_id) : batches),
    [batches, form.course_id]
  );
  const selectedCourse = useMemo(
    () => courses.find(c => String(c.id) === form.course_id) || null,
    [courses, form.course_id]
  );

  /* When the category changes, drop a course pick that no longer belongs. */
  const onCategoryChange = (categoryId: string) => {
    setForm(f => {
      const keepCourse = courses.some(c => String(c.id) === f.course_id && String(c.category_id) === categoryId);
      return { ...f, category_id: categoryId, course_id: keepCourse ? f.course_id : '', batch_id: '' };
    });
    setCoupon(null); setCouponMsg('');
  };

  /* When the course changes, default the fee to its discounted price + reset batch/coupon. */
  const onCourseChange = (courseId: string) => {
    const c = courses.find(co => String(co.id) === courseId) || null;
    setForm(f => ({
      ...f,
      course_id: courseId,
      batch_id: '',
      total_fees: c?.discounted_price != null ? String(c.discounted_price) : f.total_fees,
    }));
    setCoupon(null); setCouponMsg('');
  };

  /* ─── Fee preview (backend recomputes authoritatively from coupon_code) ─── */
  const fees = useMemo(() => {
    const total = Number(form.total_fees) || 0;
    if (!coupon) return { total, discount: 0, final: total };
    const discount = coupon.discount_type === 'percentage'
      ? Math.round((total * coupon.discount_value) / 100)
      : Math.min(total, coupon.discount_value);
    return { total, discount, final: Math.max(0, total - discount) };
  }, [form.total_fees, coupon]);

  const verifyCoupon = async () => {
    setCouponMsg(''); setCoupon(null);
    if (!form.coupon_code.trim()) { setCouponMsg('Enter a coupon code first.'); return; }
    setCouponBusy(true);
    try {
      const res = await fetchWithAuth(`${BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.coupon_code.trim(), course_id: form.course_id || undefined }),
      });
      const c: Coupon = res?.data ?? res;
      setCoupon(c);
      setCouponMsg(`Applied — ${c.discount_type === 'percentage' ? c.discount_value + '% off' : '₹' + c.discount_value + ' off'}.`);
    } catch (e: unknown) {
      setCouponMsg(e instanceof Error ? e.message : 'Invalid coupon.');
    } finally { setCouponBusy(false); }
  };

  /* ─── Installments builder ─── */
  const addInstallment = () =>
    setInstallments(rows => [...rows, { amount: '', due_date: '' }]);
  const updateInstallment = (i: number, key: 'amount' | 'due_date', v: string) =>
    setInstallments(rows => rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const removeInstallment = (i: number) =>
    setInstallments(rows => rows.filter((_, idx) => idx !== i));

  /* ─── Submit ─── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Light client-side guard on the genuinely-required fields.
    const required: Array<[keyof Form, string]> = [
      ['student_name', 'Full name'], ['student_email', 'Email'], ['student_phone', 'Phone'],
      ['date_of_birth', 'Date of birth'], ['gender', 'Gender'],
      ['course_id', 'Course'], ['total_fees', 'Total fees'], ['payment_mode', 'Payment mode'],
    ];
    const missing = required.filter(([k]) => !String(form[k]).trim());
    if (missing.length) {
      setErrorMsg(`Please fill the required field${missing.length > 1 ? 's' : ''}: ${missing.map(m => m[1]).join(', ')}.`);
      return;
    }

    const cleanInstallments = installments
      .filter(r => r.amount && r.due_date)
      .map(r => ({ amount: Number(r.amount), due_date: r.due_date }));

    const payload: Record<string, unknown> = {
      auto_enroll:   true,
      student_name:  form.student_name,
      student_email: form.student_email,
      student_phone: form.student_phone,
      college_name:  form.college_name || undefined,
      course_id:     Number(form.course_id),
      batch_id:      form.batch_id ? Number(form.batch_id) : undefined,
      total_fees:    Number(form.total_fees || 0),
      payment_mode:  form.payment_mode,
      coupon_code:   form.coupon_code.trim() || undefined,
      notes:         form.notes || undefined,
      date_of_birth: form.date_of_birth,
      gender:        form.gender,
      blood_group:   form.blood_group || undefined,
      father_name:   form.father_name || undefined,
      mother_name:   form.mother_name || undefined,
      guardian_name:  form.guardian_name || undefined,
      guardian_phone: form.guardian_phone || undefined,
      guardian_email: form.guardian_email || undefined,
      emergency_contact_name:  form.emergency_contact_name || undefined,
      emergency_contact_phone: form.emergency_contact_phone || undefined,
      address_line1: form.address_line1 || undefined,
      address_line2: form.address_line2 || undefined,
      city:          form.city || undefined,
      state:         form.state || undefined,
      postal_code:   form.postal_code || undefined,
      country:       form.country || undefined,
      highest_qualification:   form.highest_qualification || undefined,
      qualification_institute: form.qualification_institute || undefined,
      qualification_year:    form.qualification_year ? Number(form.qualification_year) : undefined,
      qualification_percent: form.qualification_percent ? Number(form.qualification_percent) : undefined,
      id_proof_type:   form.id_proof_type || undefined,
      id_proof_number: form.id_proof_number || undefined,
      referral_source: form.referral_source || undefined,
      installments:    cleanInstallments.length ? cleanInstallments : undefined,
    };

    setSaving(true);
    try {
      const res = await fetchWithAuth(`${BASE}/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult({
        user:        res?.data?.user ?? null,
        credentials: res?.data?.credentials ?? null,
      });
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to admit the student.');
    } finally { setSaving(false); }
  };

  const resetForAnother = () => {
    setForm(EMPTY_FORM);
    setInstallments([]);
    setCoupon(null); setCouponMsg('');
    setErrorMsg(''); setResult(null); setCopied(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyCredentials = async () => {
    if (!result?.credentials) return;
    const c = result.credentials;
    const text = `EasyCoders student login\nEnrolment ID: ${c.enrollment_id}\nEmail: ${c.email}\nTemporary password: ${c.password}\nLogin: https://easycoders.in/`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — ignore */ }
  };

  const mailtoHref = useMemo(() => {
    const c = result?.credentials;
    if (!c) return '#';
    const subject = 'Your EasyCoders student account';
    const body =
      `Hi ${result?.user?.name || ''},\n\n` +
      `Your EasyCoders student account is ready.\n\n` +
      `Enrolment ID: ${c.enrollment_id}\n` +
      `Email: ${c.email}\n` +
      `Temporary password: ${c.password}\n\n` +
      `Please sign in and change your password on first login.\n\nThanks,\nEasyCoders Team`;
    return `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [result]);

  /* ─── Field render helpers (run in this component's render → styled-jsx scoped) ─── */
  const text = (name: keyof Form, label: string, opts: { req?: boolean; type?: string; placeholder?: string } = {}) => (
    <div className="fld">
      <label className="fld-lbl">{label}{opts.req && <span className="req"> *</span>}</label>
      <input
        className="fld-in"
        type={opts.type || 'text'}
        value={form[name]}
        placeholder={opts.placeholder}
        max={opts.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
        onChange={e => setField(name, e.target.value)}
      />
    </div>
  );
  const select = (name: keyof Form, label: string, options: string[][], opts: { req?: boolean; placeholder?: string; disabled?: boolean } = {}) => (
    <div className="fld">
      <label className="fld-lbl">{label}{opts.req && <span className="req"> *</span>}</label>
      <select className="fld-in" value={form[name]} disabled={opts.disabled} onChange={e => setField(name, e.target.value)}>
        <option value="">{opts.placeholder || 'Select…'}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Operations"
        title="Admit a Student"
        description="Register a new student, choose their program, course and batch, record the fee plan, and issue login credentials for the student dashboard — all in one step."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Admit Student' },
        ]}
      >
        <style jsx>{`
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px 16px;
          }
          .grid.cols-3 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
          .fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
          .fld-lbl {
            font-size: 12px;
            font-weight: 600;
            color: #4A5568;
          }
          .req { color: #B97A0F; }
          .fld-in {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 10px;
            padding: 10px 12px;
            font-family: inherit;
            font-size: 13px;
            color: #0B1B3A;
            outline: none;
            width: 100%;
            transition: border-color 0.18s ease, box-shadow 0.18s ease;
          }
          .fld-in:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 3px rgba(232,160,32,0.16);
          }
          .fld-in:disabled { background: #F4F6FB; color: #94A3B8; cursor: not-allowed; }
          textarea.fld-in { resize: vertical; min-height: 64px; }

          .panel-gap { margin-bottom: 18px; }

          /* Coupon row */
          .coupon-row { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
          .coupon-row .fld { flex: 1 1 200px; }
          .coupon-msg { font-size: 12px; margin-top: 6px; }
          .coupon-msg.ok  { color: #166534; }
          .coupon-msg.err { color: #991B1B; }

          /* Fee summary */
          .fee-summary {
            display: flex;
            gap: 22px;
            flex-wrap: wrap;
            background: #F8FAFD;
            border: 1px solid #E5E9F2;
            border-radius: 14px;
            padding: 16px 18px;
            margin-top: 16px;
          }
          .fee-cell .fee-lbl {
            font-size: 11px; color: #94A3B8; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.04em;
          }
          .fee-cell .fee-val {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 22px; font-weight: 700; color: #0B1B3A; line-height: 1.2;
          }
          .fee-cell.final .fee-val { color: #B97A0F; }

          /* Installments */
          .inst-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px; flex-wrap: wrap; }
          .inst-row .fld { flex: 1 1 160px; }
          .inst-no {
            font-size: 12px; font-weight: 700; color: #94A3B8;
            min-width: 26px; height: 40px; display: inline-flex; align-items: center;
          }
          .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 7px;
            padding: 9px 18px; border-radius: 10px; font-family: inherit; font-size: 13px;
            font-weight: 700; border: 1px solid transparent; cursor: pointer;
            transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
            white-space: nowrap;
            /* Button-styled anchors ("Email them", "View profile") render
               outside .adm-page, so the section's Bootstrap-link reset doesn't
               reach them. Kill the underline here so they never bleed blue. */
            text-decoration: none;
          }
          .btn:active { transform: translateY(1px); }
          .btn:disabled { opacity: 0.55; cursor: not-allowed; }
          .btn-primary { background: #0B1B3A; color: #fff; }
          .btn-primary:hover:not(:disabled) { background: #E8A020; color: #0B1B3A; }
          .btn-gold { background: #E8A020; color: #0B1B3A; }
          .btn-gold:hover:not(:disabled) { background: #B97A0F; color: #fff; }
          .btn-ghost { background: #fff; color: #4A5568; border-color: #E5E9F2; }
          .btn-ghost:hover { border-color: #E8A020; color: #0B1B3A; }
          .btn-sm { padding: 6px 12px; font-size: 12px; }
          .btn-link-danger {
            background: transparent; border: none; color: #991B1B; cursor: pointer;
            font-size: 12px; font-weight: 600; height: 40px;
          }
          .btn-link-danger:hover { color: #EF4444; }

          /* Submit bar */
          .submit-bar {
            display: flex; align-items: center; justify-content: space-between;
            gap: 14px; flex-wrap: wrap; margin-top: 4px;
          }
          .form-error {
            background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5;
            border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
          }
          .req-note { font-size: 12px; color: #94A3B8; }

          /* Success modal */
          :global(.admit-backdrop) {
            position: fixed; inset: 0; z-index: 1050;
            background: rgba(7,18,42,0.55); backdrop-filter: blur(2px);
            display: flex; align-items: center; justify-content: center; padding: 20px;
            animation: admit-fade 0.18s ease;
          }
          @keyframes admit-fade { from { opacity: 0; } to { opacity: 1; } }
          :global(.admit-card) {
            background: #fff; border-radius: 20px; width: 100%; max-width: 520px;
            box-shadow: 0 24px 60px rgba(7,18,42,0.45); overflow: hidden;
            animation: admit-rise 0.22s cubic-bezier(0.2,0.9,0.3,1.2);
          }
          @keyframes admit-rise { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) {
            :global(.admit-backdrop), :global(.admit-card) { animation: none; }
          }
          .admit-top {
            background: linear-gradient(180deg, #0B1B3A 0%, #152D5A 100%);
            color: #fff; padding: 26px 24px 22px; text-align: center;
          }
          .admit-check {
            width: 54px; height: 54px; border-radius: 50%;
            background: rgba(232,160,32,0.18); border: 1px solid rgba(232,160,32,0.4);
            color: #F5C356; display: inline-flex; align-items: center; justify-content: center;
            margin-bottom: 12px;
          }
          .admit-h {
            font-family: 'Playfair Display', Georgia, serif; font-size: 22px;
            font-weight: 700; margin: 0;
          }
          .admit-sub { font-size: 13px; color: rgba(255,255,255,0.72); margin: 6px 0 0; }
          .admit-body { padding: 22px 24px; }
          .cred {
            display: flex; justify-content: space-between; align-items: center; gap: 12px;
            padding: 11px 0; border-bottom: 1px solid #F1F4F9;
          }
          .cred:last-child { border-bottom: none; }
          .cred-lbl { font-size: 12px; color: #94A3B8; font-weight: 600; }
          .cred-val {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 14px; color: #0B1B3A; font-weight: 600; text-align: right; word-break: break-all;
          }
          .cred-val.pw { color: #B97A0F; font-size: 16px; letter-spacing: 0.02em; }
          .admit-note {
            font-size: 12px; color: #94A3B8; margin: 14px 0 0; line-height: 1.55;
          }
          .admit-actions {
            display: flex; gap: 10px; flex-wrap: wrap; padding: 16px 24px;
            border-top: 1px solid #F1F4F9; background: #FAFBFD;
          }
          .admit-actions .btn { flex: 1 1 auto; }
        `}</style>

        {errorMsg && <div className="form-error">{errorMsg}</div>}

        <form onSubmit={submit}>
          {/* ── Personal ── */}
          <div className="panel-gap">
            <AdminPanel title="Personal details" subtitle="Who is the student?">
              <div className="grid">
                {text('student_name', 'Full name', { req: true, placeholder: 'e.g. Riya Sharma' })}
                {text('student_email', 'Email', { req: true, type: 'email', placeholder: 'student@email.com' })}
                {text('student_phone', 'Phone', { req: true, placeholder: '10-digit mobile' })}
                {text('date_of_birth', 'Date of birth', { req: true, type: 'date' })}
                {select('gender', 'Gender', GENDERS, { req: true })}
                {text('blood_group', 'Blood group', { placeholder: 'e.g. O+' })}
              </div>
            </AdminPanel>
          </div>

          {/* ── Contact & Family ── */}
          <div className="panel-gap">
            <AdminPanel title="Contact & family" subtitle="Address, parents and an emergency contact.">
              <div className="grid">
                {text('address_line1', 'Address line 1')}
                {text('address_line2', 'Address line 2')}
                {text('city', 'City')}
                {text('state', 'State')}
                {text('postal_code', 'Postal code')}
                {text('country', 'Country')}
                {text('father_name', "Father's name")}
                {text('mother_name', "Mother's name")}
                {text('guardian_name', 'Guardian name')}
                {text('guardian_phone', 'Guardian phone')}
                {text('guardian_email', 'Guardian email', { type: 'email' })}
                {text('emergency_contact_name', 'Emergency contact')}
                {text('emergency_contact_phone', 'Emergency phone')}
              </div>
            </AdminPanel>
          </div>

          {/* ── Education ── */}
          <div className="panel-gap">
            <AdminPanel title="Education & identity" subtitle="Background and an optional ID proof.">
              <div className="grid">
                {text('college_name', 'College / school')}
                {text('highest_qualification', 'Highest qualification', { placeholder: 'e.g. B.Tech CSE' })}
                {text('qualification_institute', 'Institute')}
                {text('qualification_year', 'Year of passing', { type: 'number', placeholder: 'e.g. 2024' })}
                {text('qualification_percent', 'Percentage / CGPA', { type: 'number', placeholder: 'e.g. 78.5' })}
                {select('id_proof_type', 'ID proof type', ID_PROOFS)}
                {text('id_proof_number', 'ID proof number')}
                {text('referral_source', 'How did they hear about us?', { placeholder: 'e.g. Instagram, friend' })}
              </div>
            </AdminPanel>
          </div>

          {/* ── Program & Fees ── */}
          <div className="panel-gap">
            <AdminPanel title="Program & fees" subtitle="Pick the program, course and batch, then set the fee plan.">
              <div className="grid cols-3">
                <div className="fld">
                  <label className="fld-lbl">Program / category</label>
                  <select className="fld-in" value={form.category_id} onChange={e => onCategoryChange(e.target.value)}>
                    <option value="">All programs</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="fld">
                  <label className="fld-lbl">Course<span className="req"> *</span></label>
                  <select className="fld-in" value={form.course_id} onChange={e => onCourseChange(e.target.value)}>
                    <option value="">Select a course…</option>
                    {visibleCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="fld">
                  <label className="fld-lbl">Batch</label>
                  <select className="fld-in" value={form.batch_id} disabled={!form.course_id} onChange={e => setField('batch_id', e.target.value)}>
                    <option value="">{form.course_id ? 'No batch yet' : 'Pick a course first'}</option>
                    {visibleBatches.map(b => <option key={b.id} value={b.id}>{b.name}{b.status ? ` · ${b.status}` : ''}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid cols-3" style={{ marginTop: 14 }}>
                {text('total_fees', 'Total fees (₹)', { req: true, type: 'number' })}
                {select('payment_mode', 'Payment mode', PAY_MODES, { req: true })}
                <div className="fld">
                  <label className="fld-lbl">Coupon code</label>
                  <div className="coupon-row">
                    <input className="fld-in" value={form.coupon_code}
                      placeholder="Optional"
                      onChange={e => { setField('coupon_code', e.target.value); setCoupon(null); setCouponMsg(''); }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={verifyCoupon} disabled={couponBusy}>
                      {couponBusy ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && <div className={`coupon-msg ${coupon ? 'ok' : 'err'}`}>{couponMsg}</div>}
                </div>
              </div>

              {selectedCourse && (
                <div className="fee-summary">
                  <div className="fee-cell">
                    <div className="fee-lbl">Total</div>
                    <div className="fee-val">₹{fees.total.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="fee-cell">
                    <div className="fee-lbl">Discount</div>
                    <div className="fee-val">− ₹{fees.discount.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="fee-cell final">
                    <div className="fee-lbl">Payable</div>
                    <div className="fee-val">₹{fees.final.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}

              {/* Installments */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <label className="fld-lbl" style={{ fontSize: 13 }}>Installment plan <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addInstallment}>+ Add installment</button>
                </div>
                {installments.map((inst, i) => (
                  <div key={i} className="inst-row">
                    <span className="inst-no">#{i + 1}</span>
                    <div className="fld">
                      <label className="fld-lbl">Amount (₹)</label>
                      <input className="fld-in" type="number" value={inst.amount}
                        onChange={e => updateInstallment(i, 'amount', e.target.value)} />
                    </div>
                    <div className="fld">
                      <label className="fld-lbl">Due date</label>
                      <input className="fld-in" type="date" value={inst.due_date}
                        onChange={e => updateInstallment(i, 'due_date', e.target.value)} />
                    </div>
                    <button type="button" className="btn-link-danger" onClick={() => removeInstallment(i)}>Remove</button>
                  </div>
                ))}
              </div>

              <div className="fld" style={{ marginTop: 14 }}>
                <label className="fld-lbl">Notes</label>
                <textarea className="fld-in" rows={2} value={form.notes}
                  placeholder="Anything the team should know (optional)"
                  onChange={e => setField('notes', e.target.value)} />
              </div>
            </AdminPanel>
          </div>

          {/* ── Submit ── */}
          <div className="submit-bar">
            <span className="req-note">Fields marked <span className="req">*</span> are required. A temporary password is generated automatically.</span>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Admitting…' : 'Admit student & create account'}
            </button>
          </div>
        </form>
      </AdminSection>

      {/* ── Success modal ── */}
      {result && (
        <div className="admit-backdrop">
          <div className="admit-card" role="dialog" aria-modal="true" aria-labelledby="admit-title">
            <div className="admit-top">
              <span className="admit-check" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <h2 className="admit-h" id="admit-title">Student admitted</h2>
              <p className="admit-sub">{result.user?.name} can now sign in to the student dashboard.</p>
            </div>
            <div className="admit-body">
              {result.credentials ? (
                <>
                  <div className="cred">
                    <span className="cred-lbl">Enrolment ID</span>
                    <span className="cred-val">{result.credentials.enrollment_id}</span>
                  </div>
                  <div className="cred">
                    <span className="cred-lbl">Email</span>
                    <span className="cred-val">{result.credentials.email}</span>
                  </div>
                  <div className="cred">
                    <span className="cred-lbl">Temporary password</span>
                    <span className="cred-val pw">{result.credentials.password}</span>
                  </div>
                  <p className="admit-note">
                    Share these with the student. The temporary password works until they change it, and
                    can be re-fetched from the student profile for 7 days. No email is sent automatically.
                  </p>
                </>
              ) : (
                <p className="admit-note">The account was created, but no credentials were returned. Open the student profile to issue a password.</p>
              )}
            </div>
            <div className="admit-actions">
              <button type="button" className="btn btn-gold" onClick={copyCredentials} disabled={!result.credentials}>
                {copied ? 'Copied!' : 'Copy credentials'}
              </button>
              <a className="btn btn-ghost" href={mailtoHref} target="_blank" rel="noopener noreferrer">Email them</a>
              {result.user && (
                <Link className="btn btn-ghost" href={`/admin/students/${result.user.id}`}>View profile</Link>
              )}
              <button type="button" className="btn btn-primary" onClick={resetForAnother}>Admit another</button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
