'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

/* ──────────────────────────────────────────────────────────────────────────
 * /contactus — client-side body.
 *
 * Re-skinned May 2026 to navy/gold matching home, footer, about, courses.
 *
 * Backend (/api/contact) only accepts {name, email, message}. To surface
 * Phone + Topic in the admin inbox WITHOUT requiring a backend change,
 * we prepend them to the message body as a short metadata header. When
 * Phone + Topic become first-class columns (follow-up backend PR), this
 * composition can drop and the fields can be sent as their own keys.
 *
 * Also fixed in this pass:
 *  - The Email + Phone info-cards were crammed into ONE card with manual
 *    <br/> separators. Now three properly structured cards.
 *  - Phone icon had viewBox 512×512 stuffed into a 14×14 box — appeared
 *    microscopic. Switched to a stroked Lucide-style icon at 18×18.
 *  - alert() on form failure → inline toast (matches course-detail pattern).
 *  - Thanks modal: focus trap, Escape-to-close, aria-modal/labelledby,
 *    restore focus on close, prevents background scroll, respects
 *    prefers-reduced-motion.
 *  - Map embed pinned to the actual address (was generic `q=jaunpur`).
 *  - Added Business Hours card + WhatsApp quick-link.
 *  - 487 lines of commented-out legacy code deleted from page.tsx.
 *  - Replaced hardcoded #ea6500 hovers with CSS variables.
 *  - Dropped the unused --indigo CSS variable.
 * ────────────────────────────────────────────────────────────────────────── */

const PHONE_DISPLAY = '+91 7523 930 301';
const PHONE_TEL     = '+917523930301';
const PHONE_WA      = '917523930301'; // wa.me uses no plus, no spaces
const EMAIL         = 'team@easycoders.in';

const TOPICS = [
  'Course inquiry',
  'Summer Training',
  'Internship',
  'Partnership / Hiring',
  'Something else',
] as const;
type Topic = typeof TOPICS[number];

export default function ContactUsInner() {
  const router = useRouter();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [topic,   setTopic]   = useState<Topic>('Course inquiry');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  const thanksTitleId   = useId();
  const thanksRef       = useRef<HTMLDivElement | null>(null);
  const submitBtnRef    = useRef<HTMLButtonElement | null>(null);
  const thanksFocusable = useRef<HTMLElement | null>(null);

  /* ─── Auto-dismiss toast ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Thanks modal a11y (Escape, focus trap, restore focus) ───────────── */
  useEffect(() => {
    if (!showThanks) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the close-to-home button after the modal renders.
    queueMicrotask(() => thanksFocusable.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeThanks();
      } else if (e.key === 'Tab' && thanksRef.current) {
        const focusables = thanksRef.current.querySelectorAll<HTMLElement>(
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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showThanks]);

  const closeThanks = useCallback(() => {
    setShowThanks(false);
    // Reset the form so a second message can be sent.
    setName(''); setEmail(''); setPhone(''); setTopic('Course inquiry'); setMessage('');
  }, []);

  const goHome = () => {
    closeThanks();
    router.push('/');
  };

  /* ─── Compose phone + topic into the message until the backend has
   *     dedicated columns. Keeps it readable in the admin inbox. */
  const composedMessage = () => {
    const meta: string[] = [];
    if (topic)        meta.push(`Topic: ${topic}`);
    if (phone.trim()) meta.push(`Phone: ${phone.trim()}`);
    return meta.length
      ? `[${meta.join(' · ')}]\n\n${message.trim()}`
      : message.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/contact', {
        name:    name.trim(),
        email:   email.trim(),
        message: composedMessage(),
      });
      setShowThanks(true);
    } catch {
      setToast('Could not send your message. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style jsx>{`
        :global(:root) {
          --navy:        #0B1B3A;
          --navy-mid:    #152D5A;
          --navy-deep:   #07122A;
          --navy-soft:   #F4F6FB;
          --gold:        #E8A020;
          --gold-light:  #F5C356;
          --gold-soft:   #FEF6E7;
          --gold-deep:   #B97A0F;
          --slate:       #4A5568;
          --slate-soft:  #94A3B8;
          --border:      #E5E9F2;
          --white:       #FFFFFF;
          --success:     #16a34a;
          --success-bg:  #ecfdf5;
        }

        .ct {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          background: var(--navy-soft);
          color: var(--navy);
        }

        /* ─── MAIN ─── */
        .ct-section { padding: 64px 24px 80px; }
        .ct-container { max-width: 1180px; margin: 0 auto; }
        .ct-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 920px) {
          .ct-grid { grid-template-columns: 1fr; gap: 40px; }
        }

        /* ─── LEFT: INFO ─── */
        .ct-info { display: flex; flex-direction: column; gap: 24px; }

        .ct-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--gold-soft);
          color: #92660D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          width: fit-content;
        }
        .ct-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }
        .ct-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3.5vw, 38px);
          font-weight: 700;
          color: var(--navy);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 14px 0 0;
        }
        .ct-title em { font-style: italic; color: var(--gold); }
        .ct-lede {
          font-size: 15px;
          color: var(--slate);
          line-height: 1.7;
          margin: 12px 0 0;
          font-weight: 300;
        }

        /* ─── Info cards ─── */
        .ct-info-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .ct-info-cards { grid-template-columns: 1fr; }
        }
        .ct-card-address { grid-column: 1 / -1; }

        .ct-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          transition: border-color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
        }
        .ct-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(11, 27, 58, 0.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .ct-card { transition: none; }
          .ct-card:hover { transform: none; }
        }
        .ct-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: var(--gold-soft);
          color: var(--gold-deep);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ct-card-body { min-width: 0; }
        .ct-card-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--slate);
          margin: 0 0 4px;
        }
        .ct-card-value {
          font-size: 14px;
          color: var(--navy);
          line-height: 1.6;
          font-weight: 500;
          margin: 0;
        }
        .ct-card-value a {
          color: var(--gold-deep);
          text-decoration: none;
          font-weight: 600;
        }
        .ct-card-value a:hover { text-decoration: underline; }
        .ct-card-sub {
          font-size: 12px;
          color: var(--slate);
          margin: 4px 0 0;
        }

        /* ─── Map ─── */
        .ct-map {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 0 2px 12px rgba(11, 27, 58, 0.05);
        }
        .ct-map iframe {
          display: block;
          width: 100%;
          height: 220px;
          border: 0;
        }

        /* ─── RIGHT: FORM ─── */
        .ct-form-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 4px 24px rgba(11, 27, 58, 0.07);
          position: sticky;
          top: 24px;
        }
        @media (max-width: 920px) {
          .ct-form-card { position: static; }
        }
        .ct-form-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .ct-form-sub {
          font-size: 14px;
          color: var(--slate);
          margin: 0 0 28px;
          line-height: 1.55;
        }
        .ct-form { display: flex; flex-direction: column; gap: 16px; }
        .ct-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .ct-row { grid-template-columns: 1fr; }
        }
        .ct-field { display: flex; flex-direction: column; gap: 6px; }
        .ct-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .ct-label .opt {
          font-weight: 400;
          color: var(--slate-soft);
        }
        .ct-input,
        .ct-select,
        .ct-textarea {
          border: 1px solid var(--border);
          background: var(--white);
          padding: 12px 14px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          color: var(--navy);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .ct-textarea { resize: vertical; min-height: 120px; }
        .ct-select {
          appearance: none;
          background-image:
            linear-gradient(45deg, transparent 50%, var(--slate) 50%),
            linear-gradient(135deg, var(--slate) 50%, transparent 50%);
          background-position:
            calc(100% - 16px) calc(50% - 2px),
            calc(100% - 11px) calc(50% - 2px);
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          padding-right: 36px;
          cursor: pointer;
        }
        .ct-input::placeholder,
        .ct-textarea::placeholder { color: var(--slate-soft); }
        .ct-input:focus,
        .ct-select:focus,
        .ct-textarea:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.16);
        }

        .ct-submit {
          width: 100%;
          background: var(--gold);
          color: var(--navy);
          border: none;
          padding: 14px;
          border-radius: 11px;
          font-family: inherit;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
          margin-top: 4px;
        }
        .ct-submit:hover:not(:disabled) {
          background: var(--gold-light);
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(11, 27, 58, 0.15);
        }
        .ct-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .ct-submit:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .ct-submit:hover:not(:disabled) { transform: none; }
        }

        .ct-form-foot {
          font-size: 12px;
          color: var(--slate);
          margin: 6px 0 0;
          text-align: center;
        }

        /* ─── BOTTOM CTA ─── */
        .ct-bottom-cta {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 72px 24px;
          position: relative;
          overflow: hidden;
        }
        .ct-bottom-cta::before {
          content: '';
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          border: 1px solid rgba(232,160,32,0.10);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .ct-bottom-inner {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          flex-wrap: wrap;
        }
        .ct-bottom-text { flex: 1; min-width: 240px; }
        .ct-bottom-tag {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 10px;
        }
        .ct-bottom-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(24px, 3.2vw, 34px);
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .ct-bottom-h em { color: var(--gold); font-style: italic; }
        .ct-bottom-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.6);
          margin: 8px 0 0;
          font-weight: 300;
        }
        /* .ct-btn-gold sits on a next/link <a>, which does NOT get the styled-jsx
           scope class — so it must be :global(), scoped under .ct-bottom-cta for
           specificity, with !important + literal hex to beat the CDN Bootstrap
           link styling (otherwise the button renders as a blue underlined link). */
        .ct-bottom-cta :global(.ct-btn-gold) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E8A020 !important;
          color: #0B1B3A !important;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none !important;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
        }
        .ct-bottom-cta :global(.ct-btn-gold):hover {
          background: #F5C356 !important;
          transform: translateY(-2px);
          color: #0B1B3A !important;
          box-shadow: 0 14px 30px rgba(232,160,32,0.32);
        }
        :global(.ct-btn-arrow) { display: inline-block; transition: transform 0.22s cubic-bezier(0.22,1,0.36,1); }
        .ct-bottom-cta :global(.ct-btn-gold):hover :global(.ct-btn-arrow) { transform: translateX(4px); }
        @media (max-width: 520px) {
          .ct-bottom-cta :global(.ct-btn-gold) { width: 100%; justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ct-bottom-cta :global(.ct-btn-gold):hover { transform: none; }
          .ct-bottom-cta :global(.ct-btn-gold):hover :global(.ct-btn-arrow) { transform: none; }
        }

        /* ─── THANKS MODAL ─── */
        .ct-thx-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11, 27, 58, 0.62);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: ct-fade 0.18s ease;
        }
        @keyframes ct-fade { from { opacity: 0; } to { opacity: 1; } }
        .ct-thx-card {
          background: var(--white);
          border-radius: 24px;
          padding: 48px 40px 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 32px 80px rgba(11, 27, 58, 0.3);
          animation: ct-rise 0.22s ease;
        }
        @keyframes ct-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ct-thx-overlay, .ct-thx-card { animation: none; }
        }
        .ct-thx-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: var(--success-bg);
          color: var(--success);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .ct-thx-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .ct-thx-body {
          font-size: 14px;
          color: var(--slate);
          line-height: 1.65;
          margin: 0 0 28px;
        }
        .ct-thx-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .ct-thx-primary,
        .ct-thx-secondary {
          padding: 12px 24px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.18s ease;
          letter-spacing: 0.01em;
        }
        .ct-thx-primary {
          background: var(--gold);
          color: var(--navy);
          border: 1.5px solid var(--gold);
        }
        .ct-thx-primary:hover {
          background: var(--gold-light);
          border-color: var(--gold-light);
          transform: translateY(-1px);
        }
        .ct-thx-secondary {
          background: transparent;
          color: var(--slate);
          border: 1.5px solid var(--border);
        }
        .ct-thx-secondary:hover {
          border-color: var(--navy);
          color: var(--navy);
        }
        @media (prefers-reduced-motion: reduce) {
          .ct-thx-primary:hover { transform: none; }
        }

        /* ─── TOAST ─── */
        .ct-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #7f1d1d;
          color: #ffffff;
          padding: 14px 22px;
          border-radius: 14px;
          box-shadow: 0 14px 36px rgba(11, 27, 58, 0.32);
          z-index: 10000;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          max-width: calc(100% - 32px);
          animation: ct-toast-rise 0.25s ease;
        }
        @keyframes ct-toast-rise {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .ct-toast-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #fca5a5;
          flex-shrink: 0;
        }
      `}</style>

      <div className="ct">
        <section className="ct-section">
          <div className="ct-container">
            <div className="ct-grid">

              {/* ─── LEFT: INFO ─── */}
              <div className="ct-info">
                <div>
                  <span className="ct-eyebrow">Get in touch</span>
                  <h2 className="ct-title">
                    We&apos;d love to <em>hear from you</em>
                  </h2>
                  <p className="ct-lede">
                    Whether you have a question about a program, need career
                    guidance, or want to partner with us — drop a line and
                    we&apos;ll reply within 24 hours.
                  </p>
                </div>

                <div className="ct-info-cards">
                  <article className="ct-card ct-card-address">
                    <span className="ct-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <address className="ct-card-body" style={{ fontStyle: 'normal' }}>
                      <p className="ct-card-label">Office</p>
                      <p className="ct-card-value">
                        Technobren Infotech Pvt. Ltd.<br />
                        City Tower, Varanasi–Lucknow Road,<br />
                        Wazidpur, Jaunpur,<br />
                        Uttar Pradesh – 222002, India
                      </p>
                    </address>
                  </article>

                  <article className="ct-card">
                    <span className="ct-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                    </span>
                    <div className="ct-card-body">
                      <p className="ct-card-label">Email</p>
                      <p className="ct-card-value">
                        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                      </p>
                    </div>
                  </article>

                  <article className="ct-card">
                    <span className="ct-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
                      </svg>
                    </span>
                    <div className="ct-card-body">
                      <p className="ct-card-label">Phone</p>
                      <p className="ct-card-value">
                        <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
                      </p>
                    </div>
                  </article>

                  <article className="ct-card">
                    <span className="ct-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <div className="ct-card-body">
                      <p className="ct-card-label">Hours</p>
                      <p className="ct-card-value">
                        Mon – Sat · 9:00 AM – 7:00 PM
                      </p>
                      <p className="ct-card-sub">Closed on Sundays</p>
                    </div>
                  </article>

                  <article className="ct-card ct-card-address">
                    <span className="ct-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                      </svg>
                    </span>
                    <div className="ct-card-body">
                      <p className="ct-card-label">WhatsApp</p>
                      <p className="ct-card-value">
                        <a
                          href={`https://wa.me/${PHONE_WA}?text=Hi%20Easy%20Coders%2C%20I%27d%20like%20to%20know%20more%20about%20your%20programs.`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Chat with us on WhatsApp →
                        </a>
                      </p>
                      <p className="ct-card-sub">Fastest way to reach our counsellors.</p>
                    </div>
                  </article>
                </div>

                {/* Map — precise address embed (was generic q=jaunpur). */}
                <div className="ct-map">
                  <iframe
                    src="https://maps.google.com/maps?q=City+Tower%2C+Wazidpur%2C+Jaunpur%2C+Uttar+Pradesh+222002&z=15&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Easy Coders office location — City Tower, Wazidpur, Jaunpur"
                  />
                </div>
              </div>

              {/* ─── RIGHT: FORM ─── */}
              <div className="ct-form-card">
                <h2 className="ct-form-h">Send us a message</h2>
                <p className="ct-form-sub">
                  Fill in the details below and our team will get back to you within 24 hours.
                </p>

                <form className="ct-form" onSubmit={handleSubmit} noValidate>
                  <div className="ct-row">
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-name">Full name</label>
                      <input
                        id="ct-name"
                        className="ct-input"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-email">Email address</label>
                      <input
                        id="ct-email"
                        className="ct-input"
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="ct-row">
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-phone">
                        Phone <span className="opt">(optional)</span>
                      </label>
                      <input
                        id="ct-phone"
                        className="ct-input"
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-topic">What can we help with?</label>
                      <select
                        id="ct-topic"
                        className="ct-select"
                        value={topic}
                        onChange={e => setTopic(e.target.value as Topic)}
                      >
                        {TOPICS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ct-field">
                    <label className="ct-label" htmlFor="ct-message">Your message</label>
                    <textarea
                      id="ct-message"
                      className="ct-textarea"
                      rows={5}
                      placeholder="Tell us how we can help…"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    ref={submitBtnRef}
                    type="submit"
                    disabled={submitting}
                    className="ct-submit"
                  >
                    {submitting ? 'Sending…' : 'Send message →'}
                  </button>
                  <p className="ct-form-foot">We typically reply within 24 hours on weekdays.</p>
                </form>
              </div>

            </div>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="ct-bottom-cta" aria-label="Browse programs">
          <div className="ct-bottom-inner">
            <div className="ct-bottom-text">
              <p className="ct-bottom-tag">Ready to start?</p>
              <h2 className="ct-bottom-h">
                Skip the wait — <em>browse our programs</em>
              </h2>
              <p className="ct-bottom-sub">
                Already know what you want? Jump straight to the catalogue.
              </p>
            </div>
            <Link href="/courses" className="ct-btn-gold">
              Explore courses <span className="ct-btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>

      {/* ─── THANKS MODAL ─── */}
      {showThanks && (
        <div
          className="ct-thx-overlay"
          role="presentation"
          onClick={e => { if (e.target === e.currentTarget) closeThanks(); }}
        >
          <div
            ref={thanksRef}
            className="ct-thx-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={thanksTitleId}
          >
            <div className="ct-thx-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 id={thanksTitleId} className="ct-thx-h">Message received</h3>
            <p className="ct-thx-body">
              Thanks for reaching out. Our team will get back to you within <strong>24 hours</strong>.
            </p>
            <div className="ct-thx-actions">
              <button
                ref={el => { thanksFocusable.current = el; }}
                type="button"
                className="ct-thx-primary"
                onClick={goHome}
              >
                Back to home →
              </button>
              <button
                type="button"
                className="ct-thx-secondary"
                onClick={closeThanks}
              >
                Send another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST (error only — success uses the thanks modal) ─── */}
      {toast && (
        <div className="ct-toast" role="status" aria-live="polite">
          <span className="ct-toast-dot" aria-hidden="true" />
          {toast}
        </div>
      )}
    </>
  );
}
