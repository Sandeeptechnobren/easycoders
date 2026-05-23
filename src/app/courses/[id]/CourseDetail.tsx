'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/axios';
import {
  type ApiCourse,
  courseImage,
  formatINR,
  titleCase,
} from '@/lib/course';

/* ──────────────────────────────────────────────────────────────────────────
 * Course detail body — all interactive bits live here.
 *
 *  - Re-skinned to navy/gold matching the home page (was navy + orange + an
 *    indigo enrollment modal, three palettes for one page).
 *  - Replaced `alert()` calls with an in-page toast.
 *  - Enroll modal now: traps focus, closes on Escape, restores focus to the
 *    trigger button on close, focuses the first field on open.
 *  - "Also available as…" rail surfaces the same course under other
 *    categories (Internship / Summer Training / Job-Oriented). The backend
 *    serves each of the 4 core courses under 3 categories — users could
 *    not previously see the alternatives without going back to the list.
 *  - Prices formatted with thousand-separators (₹14,000 not ₹14000).
 *  - Description preserves whitespace via `whiteSpace: pre-line`.
 *  - Title displayed via PageHeader → no duplicate H1 on the page.
 * ────────────────────────────────────────────────────────────────────────── */

type PaymentMethod = 'qr' | 'office' | '';

type Props = {
  course:  ApiCourse;
  related: ApiCourse[];
};

export default function CourseDetail({ course, related }: Props) {
  const [showEnroll, setShowEnroll] = useState(false);
  const [showQr,     setShowQr]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    college: '',
    payment_method: '' as PaymentMethod,
    transaction_number: '',
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const modalRef   = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  const openEnroll  = () => setShowEnroll(true);
  const closeEnroll = useCallback(() => setShowEnroll(false), []);

  /* ─── Auto-dismiss toast ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Modal: Escape closes + initial focus + restore focus on close ───── */
  useEffect(() => {
    if (!showEnroll) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the first field after the modal renders.
    queueMicrotask(() => firstFieldRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEnroll();
      } else if (e.key === 'Tab' && modalRef.current) {
        // Simple focus trap — wrap Tab inside the modal.
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);

    // Prevent background scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // Return focus to the button that opened the modal.
      previouslyFocused?.focus?.();
    };
  }, [showEnroll, closeEnroll]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payment_method) {
      setToast({ type: 'error', msg: 'Please choose a payment method.' });
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/addenrollmentrequest', {
        course_id: course.id,
        ...form,
        transaction_number: form.payment_method === 'qr' ? form.transaction_number : '',
      });
      setToast({ type: 'success', msg: 'Enrollment submitted. Our team will contact you within 24 hours.' });
      closeEnroll();
      setForm({ name: '', email: '', phone_number: '', college: '', payment_method: '', transaction_number: '' });
    } catch {
      setToast({ type: 'error', msg: 'Something went wrong. Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Computed pricing strings ────────────────────────────────────────── */
  const priceFmt    = formatINR(course.discounted_price);
  const originalFmt = formatINR(course.original_price);
  const showStrike  = originalFmt && originalFmt !== priceFmt;
  const savings     = (() => {
    const o = parseFloat(String(course.original_price ?? ''));
    const d = parseFloat(String(course.discounted_price ?? ''));
    if (!Number.isFinite(o) || !Number.isFinite(d) || o <= 0 || d >= o) return null;
    return Math.round((1 - d / o) * 100);
  })();

  return (
    <>
      <style jsx>{`
        :global(:root) {
          --navy:        #0B1B3A;
          --navy-mid:    #152D5A;
          --navy-soft:   #F4F6FB;
          --gold:        #E8A020;
          --gold-light:  #F5C356;
          --gold-soft:   #FEF6E7;
          --slate:       #4A5568;
          --slate-soft:  #94A3B8;
          --border:      #E5E9F2;
          --white:       #FFFFFF;
          --success:     #16a34a;
          --success-bg:  #ecfdf5;
          --danger:      #dc2626;
          --danger-bg:   #fef2f2;
        }

        .cd-section {
          background: var(--navy-soft);
          padding: 56px 0 96px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .cd-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .cd-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--slate);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          transition: color 0.2s ease;
        }
        .cd-back:hover { color: var(--navy); }

        /* ─── Two-column layout ─── */
        .cd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 980px) {
          .cd-grid { grid-template-columns: 1fr; }
        }

        /* ─── Left: content ─── */
        .cd-left {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .cd-offer-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold-soft);
          color: #92660D;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          width: fit-content;
        }
        .cd-offer-pill::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
        }
        .cd-desc {
          font-size: 15px;
          color: var(--slate);
          line-height: 1.75;
          white-space: pre-line;
          margin: 0;
        }
        .cd-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cd-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--navy);
        }
        .cd-chip svg { opacity: 0.55; }

        /* ─── Features card ─── */
        .cd-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 2px 14px rgba(11, 27, 58, 0.05);
        }
        .cd-card-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 18px;
          letter-spacing: -0.01em;
        }
        .cd-features {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .cd-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: var(--navy-soft);
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          color: var(--navy);
          line-height: 1.45;
        }
        .cd-tick {
          flex-shrink: 0;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--success-bg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--success);
          margin-top: 1px;
        }

        /* ─── Related rail ─── */
        .cd-related {
          margin-top: 8px;
        }
        .cd-related-head {
          font-size: 13px;
          color: var(--slate);
          margin: 0 0 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .cd-related-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .cd-related-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
        }
        .cd-related-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11, 27, 58, 0.08);
          text-decoration: none;
        }
        .cd-related-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--gold);
        }
        .cd-related-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--navy);
          margin: 0;
        }
        .cd-related-meta {
          font-size: 12px;
          color: var(--slate);
        }

        /* ─── Right: sticky enroll card ─── */
        .cd-sidebar {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 980px) {
          .cd-sidebar { position: static; }
        }
        .cd-enroll {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 6px 28px rgba(11, 27, 58, 0.10);
        }
        .cd-img-wrap {
          position: relative;
          aspect-ratio: 16 / 10;
          background: var(--navy-soft);
          overflow: hidden;
        }
        .cd-img-wrap :global(img) {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .cd-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(11,27,58,0.55) 0%, transparent 55%);
        }
        .cd-img-cat {
          position: absolute;
          bottom: 12px; left: 14px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          color: var(--navy);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .cd-enroll-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .cd-price-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cd-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .cd-price {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.01em;
        }
        .cd-price-strike {
          font-size: 15px;
          color: var(--slate-soft);
          text-decoration: line-through;
        }
        .cd-save-pill {
          background: var(--success-bg);
          color: #166534;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 100px;
          width: fit-content;
        }
        .cd-attrs {
          background: var(--navy-soft);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cd-attr-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .cd-attr-k { color: var(--slate); }
        .cd-attr-v { font-weight: 600; color: var(--navy); }
        .cd-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--gold);
          color: var(--navy);
          border: none;
          border-radius: 12px;
          padding: 14px 22px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
        }
        .cd-cta:hover {
          background: var(--gold-light);
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(11, 27, 58, 0.15);
        }
        .cd-cta:focus-visible {
          outline: 2px solid var(--navy);
          outline-offset: 2px;
        }
        .cd-cta-sub {
          text-align: center;
          font-size: 12px;
          color: var(--slate);
        }

        /* ─── Modal ─── */
        .cd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11, 27, 58, 0.62);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 9999;
          animation: fade-in 0.18s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .cd-modal {
          background: var(--white);
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(11, 27, 58, 0.30);
          animation: rise 0.22s ease;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cd-overlay, .cd-modal { animation: none; }
        }
        .cd-modal-head {
          padding: 22px 24px 0;
          position: relative;
        }
        .cd-modal-close {
          position: absolute;
          top: 16px; right: 16px;
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--navy-soft);
          color: var(--slate);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }
        .cd-modal-close:hover { background: var(--border); color: var(--navy); }
        .cd-modal-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 4px;
          padding-right: 40px;
          letter-spacing: -0.01em;
        }
        .cd-modal-sub {
          font-size: 13px;
          color: var(--slate);
          margin: 0 0 18px;
        }
        .cd-modal-body {
          padding: 0 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cd-notice {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--danger-bg);
          border: 1px solid rgba(220, 38, 38, 0.18);
          padding: 11px 14px;
          border-radius: 12px;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.5;
        }
        .cd-pay-grid { display: grid; gap: 8px; }
        .cd-pay {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--navy-soft);
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .cd-pay.active {
          border-color: var(--gold);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.16);
        }
        .cd-pay input { margin-top: 3px; accent-color: var(--navy); }
        .cd-pay-title { font-weight: 600; font-size: 14px; color: var(--navy); }
        .cd-pay-sub { font-size: 12px; color: var(--slate); margin-top: 3px; }

        .cd-qr-box {
          border: 1px dashed var(--border);
          border-radius: 14px;
          padding: 14px;
          background: var(--white);
        }
        .cd-qr-reveal {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--navy-soft);
          color: var(--navy);
          padding: 11px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          font-family: inherit;
          transition: background 0.15s ease;
        }
        .cd-qr-reveal:hover { background: var(--border); }
        .cd-qr-hint { font-size: 12px; color: var(--slate); margin-top: 10px; }
        .cd-qr-img-wrap {
          margin-top: 14px;
          display: flex;
          justify-content: center;
        }
        .cd-qr-frame {
          background: var(--navy-soft);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
        }
        .cd-qr-frame :global(img) {
          width: 200px; height: 200px;
          border-radius: 10px;
          object-fit: cover;
          display: block;
        }

        .cd-office {
          border: 1px solid var(--border);
          background: var(--navy-soft);
          border-radius: 12px;
          padding: 14px;
        }
        .cd-office-badge {
          display: inline-block;
          background: var(--success-bg);
          color: #166534;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .cd-office-text { font-size: 13px; color: var(--slate); line-height: 1.55; margin: 0; }

        .cd-fields { display: flex; flex-direction: column; gap: 14px; }
        .cd-field { display: flex; flex-direction: column; gap: 6px; }
        .cd-label { font-size: 13px; font-weight: 600; color: #334155; }
        .cd-label .opt { font-weight: 400; color: var(--slate-soft); }
        .cd-input {
          border: 1px solid var(--border);
          background: var(--white);
          padding: 12px 14px;
          border-radius: 10px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: var(--navy);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
        }
        .cd-input::placeholder { color: var(--slate-soft); }
        .cd-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.18);
        }
        .cd-help { font-size: 12px; color: var(--slate); }

        .cd-submit {
          width: 100%;
          background: var(--navy);
          color: var(--white);
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          margin-top: 4px;
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .cd-submit:hover:not(:disabled) {
          background: var(--gold);
          color: var(--navy);
          transform: translateY(-1px);
        }
        .cd-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ─── Toast ─── */
        .cd-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--navy);
          color: var(--white);
          padding: 14px 22px;
          border-radius: 14px;
          box-shadow: 0 14px 36px rgba(11, 27, 58, 0.32);
          z-index: 10000;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          max-width: calc(100% - 32px);
          animation: toast-rise 0.25s ease;
        }
        @keyframes toast-rise {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .cd-toast.error { background: #7f1d1d; }
        .cd-toast .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--gold);
        }
        .cd-toast.error .dot { background: #fca5a5; }
      `}</style>

      <section className="cd-section">
        <div className="cd-container">
          <Link href="/courses" className="cd-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All courses
          </Link>

          <div className="cd-grid">
            {/* ─── LEFT ─── */}
            <div className="cd-left">
              {course.offer && <div className="cd-offer-pill">{course.offer}</div>}

              {course.description && (
                <p className="cd-desc">{course.description}</p>
              )}

              <div className="cd-meta">
                {course.duration && (
                  <span className="cd-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {course.duration}
                  </span>
                )}
                {course.level && (
                  <span className="cd-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {titleCase(course.level)}
                  </span>
                )}
                {course.category?.name && (
                  <span className="cd-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    {course.category.name}
                  </span>
                )}
              </div>

              {(course.category?.features?.length ?? 0) > 0 && (
                <div className="cd-card">
                  <h2 className="cd-card-h">What you will get</h2>
                  <ul className="cd-features">
                    {course.category!.features!.map(f => (
                      <li key={f.id} className="cd-feature">
                        <span className="cd-tick" aria-hidden="true">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {f.feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related rail */}
              {related.length > 0 && (
                <div className="cd-related">
                  <p className="cd-related-head">Also available as</p>
                  <div className="cd-related-list">
                    {related.map(r => (
                      <Link key={r.id} href={`/courses/${r.id}`} className="cd-related-card">
                        <span className="cd-related-tag">{r.category?.name}</span>
                        <h3 className="cd-related-title">{r.title}</h3>
                        <span className="cd-related-meta">
                          {r.duration}{r.discounted_price ? ` · ${formatINR(r.discounted_price)}` : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── SIDEBAR ─── */}
            <aside className="cd-sidebar">
              <div className="cd-enroll">
                <div className="cd-img-wrap">
                  <Image
                    src={courseImage(course)}
                    alt={course.title}
                    width={500}
                    height={312}
                    sizes="(max-width: 980px) 100vw, 380px"
                    priority
                  />
                  <div className="cd-img-overlay" aria-hidden="true" />
                  {course.category?.name && (
                    <span className="cd-img-cat">{course.category.name}</span>
                  )}
                </div>
                <div className="cd-enroll-body">
                  {priceFmt && (
                    <div className="cd-price-block">
                      <div className="cd-price-row">
                        <span className="cd-price">{priceFmt}</span>
                        {showStrike && <span className="cd-price-strike">{originalFmt}</span>}
                      </div>
                      {savings !== null && (
                        <span className="cd-save-pill">You save {savings}%</span>
                      )}
                    </div>
                  )}

                  <div className="cd-attrs">
                    {course.duration && (
                      <div className="cd-attr-row">
                        <span className="cd-attr-k">Duration</span>
                        <span className="cd-attr-v">{course.duration}</span>
                      </div>
                    )}
                    {course.level && (
                      <div className="cd-attr-row">
                        <span className="cd-attr-k">Level</span>
                        <span className="cd-attr-v">{titleCase(course.level)}</span>
                      </div>
                    )}
                    {course.category?.name && (
                      <div className="cd-attr-row">
                        <span className="cd-attr-k">Program type</span>
                        <span className="cd-attr-v">{course.category.name}</span>
                      </div>
                    )}
                  </div>

                  <button
                    ref={triggerRef}
                    type="button"
                    className="cd-cta"
                    onClick={openEnroll}
                  >
                    Enrol now →
                  </button>
                  <p className="cd-cta-sub">Limited seats · mentor-led batches</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── Modal ─── */}
      {showEnroll && (
        <div
          className="cd-overlay"
          role="presentation"
          onClick={e => { if (e.target === e.currentTarget) closeEnroll(); }}
        >
          <div
            ref={modalRef}
            className="cd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="cd-modal-head">
              <button type="button" className="cd-modal-close" onClick={closeEnroll} aria-label="Close enrollment form">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h2 id={titleId} className="cd-modal-title">Enrollment Form</h2>
              <p className="cd-modal-sub">{course.title}{course.category?.name ? ` · ${course.category.name}` : ''}</p>
            </div>

            <div className="cd-modal-body">
              <div className="cd-notice">
                <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">⚠️</span>
                <span><strong>Note:</strong> Registration fee is <strong>non-refundable</strong>. Please review details before submitting.</span>
              </div>

              {/* Payment method */}
              <div>
                <p className="cd-label" style={{ marginBottom: 10 }}>Select payment method</p>
                <div className="cd-pay-grid">
                  <label className={`cd-pay ${form.payment_method === 'qr' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="qr"
                      checked={form.payment_method === 'qr'} onChange={handleChange} />
                    <div>
                      <div className="cd-pay-title">Pay via QR (UPI)</div>
                      <div className="cd-pay-sub">Scan QR and enter the transaction number.</div>
                    </div>
                  </label>
                  <label className={`cd-pay ${form.payment_method === 'office' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="office"
                      checked={form.payment_method === 'office'}
                      onChange={e => { handleChange(e); setForm(p => ({ ...p, transaction_number: '' })); }} />
                    <div>
                      <div className="cd-pay-title">Pay at office</div>
                      <div className="cd-pay-sub">Pay in-person at our office counter.</div>
                    </div>
                  </label>
                </div>
              </div>

              {form.payment_method === 'qr' && (
                <div className="cd-qr-box">
                  <button type="button" className="cd-qr-reveal" onClick={() => setShowQr(v => !v)}>
                    {showQr ? '▲ Hide QR code' : '▼ Show QR code to scan'}
                  </button>
                  {!showQr && <p className="cd-qr-hint">QR code is hidden. Click above to reveal and scan.</p>}
                  {showQr && (
                    <div className="cd-qr-img-wrap">
                      <div className="cd-qr-frame">
                        {/* QR served from /public — known asset, OK to use Image */}
                        <Image src="/images/TechnobrenQR.jpeg" alt="Easy Coders UPI QR Code" width={200} height={200} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {form.payment_method === 'office' && (
                <div className="cd-office">
                  <div className="cd-office-badge">Pay at office selected</div>
                  <p className="cd-office-text">After submitting, our team will contact you with office details and confirm your slot.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="cd-fields">
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-name">Full name</label>
                  <input ref={firstFieldRef} id="cd-name" className="cd-input" name="name"
                    placeholder="Your full name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-email">Email address</label>
                  <input id="cd-email" className="cd-input" type="email" name="email"
                    placeholder="you@email.com" value={form.email} onChange={handleChange} required />
                </div>
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-phone">Phone number</label>
                  <input id="cd-phone" className="cd-input" type="tel" name="phone_number"
                    placeholder="+91 00000 00000" value={form.phone_number} onChange={handleChange} required />
                </div>
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-college">College <span className="opt">(optional)</span></label>
                  <input id="cd-college" className="cd-input" name="college"
                    placeholder="Your college name" value={form.college} onChange={handleChange} />
                </div>
                {form.payment_method === 'qr' && (
                  <div className="cd-field">
                    <label className="cd-label" htmlFor="cd-txn">Transaction / UTR number</label>
                    <input id="cd-txn" className="cd-input" name="transaction_number"
                      placeholder="e.g. 123456789012" value={form.transaction_number}
                      onChange={handleChange} required />
                    <span className="cd-help">We use this to verify your payment quickly.</span>
                  </div>
                )}
                <button type="submit" disabled={submitting} className="cd-submit">
                  {submitting ? 'Submitting…' : 'Submit enrollment →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`cd-toast ${toast.type === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          {toast.msg}
        </div>
      )}
    </>
  );
}
