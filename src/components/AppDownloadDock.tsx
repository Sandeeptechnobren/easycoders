'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './AppDownloadDock.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * Floating right-edge app-download dock (public pages only — mounted in
 * app/providers.tsx and gated away from the portals + self-assessment).
 *
 * Replaces the old Navbar "Get the App" / "Get EasyAssess" pills as the single
 * home for the two Android app downloads.
 *
 *  - Collapsed: two navy tabs stuck to the right border, vertically centred.
 *  - Desktop (hover-capable): hover/focus a tab → the full button slides out.
 *  - Touch devices: tap the cap to expand (`open` state); tap elsewhere closes.
 *  - Android visitor → one-tap Download link to the .apk.
 *  - Desktop / iPhone visitor → a QR code to scan and install on Android.
 * ────────────────────────────────────────────────────────────────────────── */

type AppEntry = {
  id: string;
  name: string;
  size: string;
  url: string;
  accent: 'ec' | 'ea';
  icon: React.ReactNode;
};

const APPS: AppEntry[] = [
  {
    id: 'easycoders',
    name: 'EasyCoders App',
    size: '83 MB',
    url: 'https://api.easycoders.in/projects/backend/public/downloads/easycoders.apk',
    accent: 'ec',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'easyassess',
    name: 'EasyAssess App',
    size: '',
    url: 'https://api.easycoders.in/projects/backend/public/downloads/easyassess.apk',
    accent: 'ea',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

const DownloadIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
  </svg>
);

const ChevronLeft = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function AppDownloadDock() {
  /* Platform is only known on the client; render the panel action after mount
   * so the SSR markup and the first client render match (both render nothing
   * in the hidden panel), avoiding a hydration mismatch. */
  const [mounted, setMounted] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsAndroid(typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent));
  }, []);

  /* Touch (tap-to-open) only: close on outside tap or Escape. */
  useEffect(() => {
    if (!openId) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  return (
    <div className={styles.wrap} ref={wrapRef} aria-label="Download our Android apps">
      {APPS.map((app) => {
        const isOpen = openId === app.id;
        return (
          <div key={app.id} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
            <span className={styles.hint} aria-hidden="true">{ChevronLeft}</span>

            <div className={styles.panel} role="group" aria-label={app.name}>
              <span className={styles.info}>
                <span className={styles.name}>{app.name}</span>
                <span className={styles.sub}>
                  {mounted && isAndroid
                    ? `Android · .apk${app.size ? ` · ${app.size}` : ''}`
                    : 'Scan to install on Android'}
                </span>
              </span>

              {mounted &&
                (isAndroid ? (
                  <a
                    className={`${styles.dl} ${app.accent === 'ec' ? styles.dlEc : styles.dlEa}`}
                    href={app.url}
                    download
                  >
                    {DownloadIcon} Download
                  </a>
                ) : (
                  <span className={styles.qrBox}>
                    <QRCodeSVG value={app.url} size={52} bgColor="#ffffff" fgColor="#0B1B3A" level="M" />
                  </span>
                ))}
            </div>

            <button
              type="button"
              className={`${styles.cap} ${app.accent === 'ec' ? styles.capEc : styles.capEa}`}
              aria-label={`${app.name} — download`}
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : app.id)}
            >
              {app.icon}
            </button>
          </div>
        );
      })}
    </div>
  );
}
