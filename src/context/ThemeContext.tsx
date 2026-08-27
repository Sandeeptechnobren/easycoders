'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/* Site-wide seasonal theme.
 *
 * The server is the authority: `GET /site-settings` returns `active` already
 * resolved against the admin's on/off intent AND the optional date window (in
 * IST). This client never does date maths — it just paints what it's told.
 *
 * Flash-free by design, in two steps:
 *   1. layout.tsx runs a tiny inline script BEFORE first paint that applies the
 *      LAST KNOWN theme from localStorage. Repeat visitors therefore see the
 *      correct theme immediately, with no flash.
 *   2. This provider then revalidates against the server and corrects the
 *      attribute if the admin changed it since.
 *
 * The cache is an optimisation, never the source of truth — if the admin turns
 * the theme off, the next load fixes itself.
 */

export type SiteTheme = 'default' | 'tiranga' | 'rakhi';

/** Every theme the CSS knows how to paint. Anything else falls back to default. */
export const KNOWN_THEMES: SiteTheme[] = ['tiranga', 'rakhi'];

const isKnown = (value: unknown): value is SiteTheme =>
  typeof value === 'string' && (KNOWN_THEMES as string[]).includes(value);

/**
 * `?theme=rakhi` previews a theme without switching it on for everyone.
 *
 * Kept in sessionStorage so it survives client-side navigation but dies with
 * the tab — a preview that outlived the session would be indistinguishable
 * from the real setting and someone would eventually report a "bug" that is
 * just their own stale override. `?theme=off` clears it.
 */
const PREVIEW_KEY = 'ec_theme_preview';

function readPreview(): SiteTheme | null | 'clear' {
  if (typeof window === 'undefined') return null;
  try {
    const param = new URLSearchParams(window.location.search).get('theme');
    if (param === 'off' || param === 'default') {
      sessionStorage.removeItem(PREVIEW_KEY);
      return 'clear';
    }
    if (isKnown(param)) {
      sessionStorage.setItem(PREVIEW_KEY, param);
      return param;
    }
    const stored = sessionStorage.getItem(PREVIEW_KEY);
    return isKnown(stored) ? stored : null;
  } catch {
    return null;
  }
}

const BASE = 'https://api.easycoders.in/api';

/** Must match the key read by the inline script in layout.tsx. */
const STORAGE_KEY = 'ec_site_theme';

type ThemeContextValue = {
  theme: SiteTheme;
  /** False until the server has answered; useful for avoiding themed flicker. */
  resolved: boolean;
  /** Lets the admin page preview/apply a change without a reload. */
  applyTheme: (theme: SiteTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Single place that mutates the DOM, so the two attributes never drift apart. */
function paint(theme: SiteTheme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('data-theme', theme);
  // Bootstrap 5.3 (CDN-loaded in layout.tsx) recolours its own components off
  // this. Both themes are light-background, so it stays 'light' — declared
  // explicitly so a future dark theme has an obvious hook.
  el.setAttribute('data-bs-theme', 'light');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start from 'default' so the server-rendered markup and the first
  // client render agree. The pre-paint script has already applied the cached
  // theme to <html>; reading localStorage HERE instead would reintroduce the
  // hydration mismatch that script exists to avoid.
  const [theme, setTheme] = useState<SiteTheme>('default');
  const [resolved, setResolved] = useState(false);

  const applyTheme = useCallback((next: SiteTheme) => {
    setTheme(next);
    paint(next);
    try {
      if (next === 'default') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / storage disabled — the theme still applies for this page */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    /* Read what the pre-paint script already applied to <html>. Note this is
     * only ever called from inside a promise callback below, never synchronously
     * in the effect body — a sync setState here would cause a cascading render
     * (react-hooks/set-state-in-effect), and reading it in the useState
     * initialiser instead would reintroduce a hydration mismatch. */
    const adoptPainted = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (isKnown(cached)) setTheme(cached);
      } catch {
        /* storage unavailable — the DOM attribute still stands */
      }
    };

    /* Everything below runs inside promise callbacks on purpose. Setting state
     * synchronously in an effect body triggers a cascading render
     * (react-hooks/set-state-in-effect); deferring by one microtask costs
     * nothing visible, because the pre-paint script in layout.tsx has already
     * put the right theme on <html> before React ever runs.
     *
     * A ?theme= preview WINS over the server and skips the fetch entirely —
     * the whole point is to see a theme the server has not switched on yet. */
    Promise.resolve()
      .then(() => {
        const preview = readPreview();
        if (cancelled) return null;

        if (preview === 'clear') {
          applyTheme('default');
          setResolved(true);
          return null;
        }
        if (preview) {
          applyTheme(preview);
          setResolved(true);
          return null;
        }

        // Deliberately a bare fetch, not fetchWithAuth: this endpoint is public
        // and must work for logged-out visitors. A failure here must never
        // break the page — we simply keep the cached theme.
        return fetch(`${BASE}/site-settings`, { headers: { Accept: 'application/json' } })
          .then((r) => (r.ok ? r.json() : null));
      })
      .then((j) => {
        if (cancelled || j === null) return;
        if (!j?.data) {
          // Unexpected shape — treat it like a failure and trust the cache.
          adoptPainted();
          return;
        }
        applyTheme(j.data.active && isKnown(j.data.theme) ? j.data.theme : 'default');
      })
      .catch(() => {
        // Offline or API down: keep whatever the pre-paint script painted, and
        // bring React state into line with it so the two never disagree.
        if (!cancelled) adoptPainted();
      })
      .finally(() => {
        if (!cancelled) setResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Safe outside the provider (returns the default) so no page can crash on it. */
export function useSiteTheme(): ThemeContextValue {
  return (
    useContext(ThemeContext) ?? {
      theme: 'default',
      resolved: false,
      applyTheme: () => {},
    }
  );
}
