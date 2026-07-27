'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/* Public gallery — a grid of ALBUMS (collections grouped by event). Clicking an
   album opens a popup showing that album's photos; clicking a photo opens a
   full-screen lightbox (prev/next). Albums come from GET /api/gallery; an
   album's photos from GET /api/gallery/albums/{id}. Plain fetch (no auth). */

const API = 'https://api.easycoders.in/api';

type Album = {
  id: number;
  title: string;
  description: string | null;
  event: string | null;
  event_date: string | null;
  category: string | null;
  cover_url: string | null;
  count: number;
};
type Photo = { id: number; image_url: string | null; title: string | null; caption: string | null };
type OpenAlbum = { album: { id: number; title: string; event: string | null; event_date: string | null; description: string | null }; items: Photo[] };

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function GalleryInner() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState('All');
  const [open, setOpen]     = useState<OpenAlbum | null>(null); // opened album popup
  const [opening, setOpening] = useState<number | null>(null);
  const [lb, setLb]         = useState<number | null>(null);    // lightbox index into open.items

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/gallery`, { headers: { Accept: 'application/json' } })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancelled) setAlbums(Array.isArray(j?.data) ? j.data : []); })
      .catch(() => { /* leave empty */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    albums.forEach(a => { if (a.category?.trim()) set.add(a.category.trim()); });
    return Array.from(set);
  }, [albums]);

  const shown = useMemo(
    () => (tab === 'All' ? albums : albums.filter(a => (a.category?.trim() || '') === tab)),
    [albums, tab],
  );

  const openAlbum = useCallback(async (a: Album) => {
    setOpening(a.id);
    try {
      const r = await fetch(`${API}/gallery/albums/${a.id}`, { headers: { Accept: 'application/json' } });
      const j = r.ok ? await r.json() : null;
      const data = j?.data;
      if (data?.album) { setOpen({ album: data.album, items: Array.isArray(data.items) ? data.items.filter((p: Photo) => p.image_url) : [] }); setLb(null); }
    } catch { /* ignore */ }
    finally { setOpening(null); }
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    setLb(cur => {
      if (cur === null || !open || open.items.length === 0) return cur;
      return (cur + dir + open.items.length) % open.items.length;
    });
  }, [open]);

  // Keyboard: lightbox arrows/esc, else esc closes the album popup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lb !== null) {
        if (e.key === 'Escape') setLb(null);
        else if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'ArrowLeft') step(-1);
      } else if (open) {
        if (e.key === 'Escape') setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lb, open, step]);

  const active = lb !== null && open ? open.items[lb] : null;

  return (
    <section className="gl">
      <style jsx>{`
        .gl { background: #F4F6FB; padding: 40px 24px 72px; min-height: 40vh; font-family: 'DM Sans', system-ui, sans-serif; }
        .gl-inner { max-width: 1180px; margin: 0 auto; }

        .gl-tabs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px; }
        .gl-tab { background: #fff; border: 1px solid #E5E9F2; color: #4A5568; border-radius: 100px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.18s ease; }
        .gl-tab:hover { border-color: #E8A020; color: #0B1B3A; }
        .gl-tab.active { background: #0B1B3A; border-color: #0B1B3A; color: #fff; }

        .gl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
        .gl-album { position: relative; border: none; padding: 0; margin: 0; text-align: left; border-radius: 16px; overflow: hidden; cursor: pointer; background: #fff; box-shadow: 0 6px 18px rgba(11,27,58,0.06); transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease; font-family: inherit; }
        .gl-album:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(11,27,58,0.14); }
        .gl-album-cover { position: relative; aspect-ratio: 4 / 3; background: #E5E9F2; overflow: hidden; }
        .gl-album-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
        .gl-album:hover .gl-album-cover img { transform: scale(1.05); }
        .gl-album-count { position: absolute; top: 10px; right: 10px; background: rgba(7,18,42,0.86); color: #F5C356; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; padding: 4px 11px; border-radius: 100px; display: inline-flex; align-items: center; gap: 5px; }
        .gl-album-stack { position: absolute; inset: 0; border-radius: 16px 16px 0 0; box-shadow: inset 0 -60px 60px -40px rgba(7,18,42,0.55); pointer-events: none; }
        .gl-album-body { padding: 14px 16px 16px; }
        .gl-album-cat { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #B97A0F; margin-bottom: 5px; }
        .gl-album-title { font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: #0B1B3A; line-height: 1.25; margin: 0; }
        .gl-album-meta { font-size: 12.5px; color: #64748b; margin-top: 5px; }
        .gl-album.loading { opacity: 0.6; cursor: wait; }

        .gl-empty { text-align: center; padding: 60px 20px; color: #94A3B8; }
        .gl-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .gl-empty-title { font-size: 16px; font-weight: 700; color: #0B1B3A; margin-bottom: 6px; }
        .gl-skel { aspect-ratio: 4 / 3; border-radius: 16px; background: linear-gradient(100deg,#eef2f8 30%,#e3e9f3 50%,#eef2f8 70%); background-size: 200% 100%; animation: glShimmer 1.2s ease-in-out infinite; }
        @keyframes glShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

        /* Album popup — a modal showing the album's photos */
        .gl-pop { position: fixed; inset: 0; z-index: 9998; background: rgba(7,18,42,0.72); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; animation: glFade 0.2s ease; }
        @keyframes glFade { from { opacity: 0; } to { opacity: 1; } }
        .gl-pop-card { background: #fff; border-radius: 20px; width: 100%; max-width: 1000px; max-height: 90vh; overflow-y: auto; box-shadow: 0 28px 80px rgba(0,0,0,0.45); }
        .gl-pop-head { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #eef2f7; padding: 20px 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; z-index: 1; }
        .gl-pop-cat { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #B97A0F; }
        .gl-pop-title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #0B1B3A; margin: 4px 0 0; }
        .gl-pop-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
        .gl-pop-close { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; background: #f1f5f9; border: none; color: #475569; font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .gl-pop-close:hover { background: #0B1B3A; color: #fff; }
        .gl-pop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 18px 24px 24px; }
        .gl-pop-photo { border: none; padding: 0; margin: 0; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; cursor: pointer; background: #E5E9F2; }
        .gl-pop-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .gl-pop-photo:hover img { transform: scale(1.08); }

        /* Full-screen lightbox */
        .gl-lb { position: fixed; inset: 0; z-index: 10000; background: rgba(7,18,42,0.94); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; }
        .gl-lb-fig { max-width: 1000px; width: 100%; display: flex; flex-direction: column; align-items: center; }
        .gl-lb-img { max-width: 100%; max-height: 76vh; border-radius: 12px; box-shadow: 0 24px 70px rgba(0,0,0,0.5); }
        .gl-lb-cap { margin-top: 14px; text-align: center; color: rgba(255,255,255,0.82); max-width: 680px; font-size: 14px; font-weight: 300; line-height: 1.5; }
        .gl-lb-count { margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.5); }
        .gl-lb-close { position: fixed; top: 18px; right: 20px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .gl-lb-close:hover { background: rgba(232,160,32,0.85); color: #0B1B3A; border-color: transparent; }
        .gl-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .gl-lb-nav:hover { background: rgba(232,160,32,0.85); color: #0B1B3A; border-color: transparent; }
        .gl-lb-prev { left: 18px; } .gl-lb-next { right: 18px; }
        @media (max-width: 560px) { .gl-lb-nav { width: 40px; height: 40px; } .gl-lb-prev { left: 8px; } .gl-lb-next { right: 8px; } }
        @media (prefers-reduced-motion: reduce) { .gl-album:hover, .gl-album:hover .gl-album-cover img, .gl-pop-photo:hover img { transform: none; } .gl-skel { animation: none; } }
      `}</style>

      <div className="gl-inner">
        {categories.length > 0 && (
          <div className="gl-tabs" role="tablist" aria-label="Album categories">
            {['All', ...categories].map(t => (
              <button key={t} className={`gl-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} role="tab" aria-selected={tab === t}>{t}</button>
            ))}
          </div>
        )}

        {!loaded ? (
          <div className="gl-grid">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="gl-skel" />)}</div>
        ) : shown.length === 0 ? (
          <div className="gl-empty">
            <div className="gl-empty-icon">🖼️</div>
            <div className="gl-empty-title">No albums yet</div>
            <p>Our gallery is being put together — check back soon for moments from Easy Coders.</p>
          </div>
        ) : (
          <div className="gl-grid">
            {shown.map(a => (
              <button key={a.id} type="button" className={`gl-album ${opening === a.id ? 'loading' : ''}`} onClick={() => openAlbum(a)} aria-label={`Open album ${a.title}`}>
                <div className="gl-album-cover">
                  {a.cover_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.cover_url} alt={a.title} loading="lazy" />}
                  <span className="gl-album-stack" />
                  <span className="gl-album-count">🖼 {a.count}</span>
                </div>
                <div className="gl-album-body">
                  {a.category && <div className="gl-album-cat">{a.category}</div>}
                  <h3 className="gl-album-title">{a.title}</h3>
                  <div className="gl-album-meta">
                    {[a.event && a.event !== a.title ? a.event : null, fmtDate(a.event_date)].filter(Boolean).join(' · ') || `${a.count} photo${a.count === 1 ? '' : 's'}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Album popup */}
      {open && (
        <div className="gl-pop" onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="gl-pop-card">
            <div className="gl-pop-head">
              <div>
                {open.album ? <div className="gl-pop-cat">Album</div> : null}
                <h2 className="gl-pop-title">{open.album.title}</h2>
                <div className="gl-pop-meta">
                  {[open.album.event && open.album.event !== open.album.title ? open.album.event : null, fmtDate(open.album.event_date), `${open.items.length} photo${open.items.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
                  {open.album.description ? ` — ${open.album.description}` : ''}
                </div>
              </div>
              <button className="gl-pop-close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>
            {open.items.length === 0 ? (
              <div className="gl-empty" style={{ padding: '40px 20px' }}>No photos in this album yet.</div>
            ) : (
              <div className="gl-pop-grid">
                {open.items.map((p, i) => (
                  <button key={p.id} type="button" className="gl-pop-photo" onClick={() => setLb(i)} aria-label={p.caption || p.title || `Photo ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url!} alt={p.caption || p.title || 'gallery photo'} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-screen lightbox (on top of the album popup) */}
      {active && (
        <div className="gl-lb" onClick={e => { if (e.target === e.currentTarget) setLb(null); }}>
          <button className="gl-lb-close" onClick={() => setLb(null)} aria-label="Close">✕</button>
          {open && open.items.length > 1 && <button className="gl-lb-nav gl-lb-prev" onClick={() => step(-1)} aria-label="Previous">‹</button>}
          {open && open.items.length > 1 && <button className="gl-lb-nav gl-lb-next" onClick={() => step(1)} aria-label="Next">›</button>}
          <figure className="gl-lb-fig">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gl-lb-img" src={active.image_url!} alt={active.caption || active.title || 'gallery photo'} />
            {(active.caption || active.title) && <figcaption className="gl-lb-cap">{active.caption || active.title}</figcaption>}
            {open && open.items.length > 1 && <div className="gl-lb-count">{(lb ?? 0) + 1} / {open.items.length}</div>}
          </figure>
        </div>
      )}
    </section>
  );
}
