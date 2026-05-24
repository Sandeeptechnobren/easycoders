'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SelfAssessmentBubble.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * Floating quick-access bubble.
 *
 * Re-skinned May 2026:
 *  - Collapsed state is a compact 52×52 navy circle with a single SVG icon
 *    (was a ~150×56 maroon pill labelled "🚀 Easy Assess" — both maroon
 *    and a bounce-easing animation were CLAUDE.md design-rule violations).
 *  - Expanded state slides two pill items out to the left with proper
 *    SVG icons and navy/gold styling (was indigo/purple gradients —
 *    also CLAUDE.md violations).
 *  - The collapsed icon and the menu item it reveals no longer share the
 *    same name ("Easy Assess" appeared twice for two different actions).
 *  - Proper menu semantics: role="menu" / role="menuitem", arrow-key
 *    navigation, Home/End, focus management.
 *  - Tooltip on hover when collapsed so the icon is discoverable.
 *  - All 135 lines of commented-out legacy code removed.
 * ────────────────────────────────────────────────────────────────────────── */

type QuickLink = {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
};

const LINKS: QuickLink[] = [
  {
    id: 'self-assess',
    label: 'Self-assessment',
    // Skip the marketing landing — users coming via the floating bubble
    // already know what they want. Send them straight to the login form.
    // The login page itself short-circuits to /self-assessment/app if
    // they already have a valid session, and links to /signup for new
    // users. The public /self-assessment landing still exists for
    // organic / SEO traffic.
    path: '/self-assessment/login',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'verify-cert',
    label: 'Verify certificate',
    path: '/verifyCertificate',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
    ),
  },
];

export default function SelfAssessmentBubble() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const wrapRef    = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs   = useRef<Array<HTMLButtonElement | null>>([]);

  /* ─── Click outside → close ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /* ─── Escape / arrow-key navigation ──────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    // Focus the first item shortly after opening.
    queueMicrotask(() => itemRefs.current[0]?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (items.length === 0) return;
      const currentIdx = items.findIndex(el => el === document.activeElement);
      let next = currentIdx;
      if (e.key === 'ArrowDown') next = currentIdx >= items.length - 1 ? 0 : currentIdx + 1;
      else if (e.key === 'ArrowUp') next = currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      e.preventDefault();
      items[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const go = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.row}>
        {/* Menu items slide out to the left of the trigger */}
        <div
          className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}
          role="menu"
          aria-label="Quick links"
          aria-hidden={!isOpen}
        >
          {LINKS.map((link, idx) => (
            <button
              key={link.id}
              ref={el => { itemRefs.current[idx] = el; }}
              type="button"
              role="menuitem"
              className={styles.item}
              style={{ transitionDelay: isOpen ? `${idx * 50}ms` : '0ms' }}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => go(link.path)}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                {link.icon}
              </span>
              <span className={styles.itemLabel}>{link.label}</span>
            </button>
          ))}
        </div>

        {/* Collapsed trigger — small navy circle with rocket icon */}
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
          onClick={() => setIsOpen(v => !v)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={isOpen ? 'Close quick links' : 'Open quick links'}
        >
          {/* Two icons cross-fade based on open state */}
          <span className={`${styles.iconWrap} ${isOpen ? styles.iconWrapHidden : ''}`} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </span>
          <span className={`${styles.iconWrap} ${styles.iconClose} ${isOpen ? '' : styles.iconWrapHidden}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>

          {/* Tooltip on hover (collapsed state only) */}
          <span className={styles.tooltip} aria-hidden="true">Quick links</span>
        </button>
      </div>
    </div>
  );
}
