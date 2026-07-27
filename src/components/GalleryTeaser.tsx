'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/* Home-page gallery teaser — a short strip of the latest published photos that
   links through to the full /gallery page. Fetches the public GET /api/gallery
   and renders NOTHING until (and unless) there are photos, so the home page is
   never left with an empty section. Self-contained. */

const API = 'https://api.easycoders.in/api';

type Album = { id: number; title: string; category: string | null; cover_url: string | null; count: number };

export default function GalleryTeaser() {
  const [items, setItems] = useState<Album[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/gallery`, { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancelled) setItems(Array.isArray(j?.data) ? j.data.filter((a: Album) => a.cover_url).slice(0, 8) : []); })
      .catch(() => { /* leave empty */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="gt">
      <style jsx>{`
        .gt { background: #F4F6FB; padding: 72px 24px; font-family: 'DM Sans', system-ui, sans-serif; }
        .gt-inner { max-width: 1180px; margin: 0 auto; }
        .gt-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
        .gt-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #E8A020; margin: 0 0 10px; }
        .gt-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(24px, 3.4vw, 34px); font-weight: 700; color: #0B1B3A; letter-spacing: -0.02em; margin: 0; line-height: 1.15; }
        .gt-sub { font-size: 14px; color: #4A5568; margin: 8px 0 0; font-weight: 300; }
        .gt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .gt-tile { position: relative; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; display: block; background: #E5E9F2; box-shadow: 0 6px 18px rgba(11,27,58,0.06); }
        .gt-tile :global(img) { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
        .gt-tile:hover :global(img) { transform: scale(1.07); }
        .gt-tile-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,18,42,0.78) 0%, transparent 55%); opacity: 0; transition: opacity 0.28s ease; display: flex; align-items: flex-end; padding: 12px; }
        .gt-tile:hover .gt-tile-ov { opacity: 1; }
        .gt-tile-cap { font-size: 12px; font-weight: 700; color: #fff; line-height: 1.3; }
        /* Link renders via next/link (<a>) which doesn't get the styled-jsx scope
           class, so :global() + !important beat the CDN Bootstrap link styling. */
        :global(.gt-link) { display: inline-flex; align-items: center; gap: 6px; color: #B97A0F !important; font-size: 14px; font-weight: 700; text-decoration: none !important; white-space: nowrap; transition: gap 0.2s ease; }
        :global(.gt-link):hover { gap: 10px; color: #0B1B3A !important; }
        @media (prefers-reduced-motion: reduce) { .gt-tile:hover :global(img) { transform: none; } }
      `}</style>

      <div className="gt-inner">
        <div className="gt-head">
          <div>
            <p className="gt-eyebrow">Gallery</p>
            <h2 className="gt-title">Life at Easy Coders</h2>
            <p className="gt-sub">Workshops, events, mentor sessions and student wins.</p>
          </div>
          <Link href="/gallery" className="gt-link">View full gallery →</Link>
        </div>

        <div className="gt-grid">
          {items.map(a => (
            <Link key={a.id} href="/gallery" className="gt-tile" aria-label={`View album ${a.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.cover_url!} alt={a.title} loading="lazy" />
              <span className="gt-tile-ov"><span className="gt-tile-cap">{a.title}{a.count ? ` · ${a.count} photo${a.count === 1 ? '' : 's'}` : ''}</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
