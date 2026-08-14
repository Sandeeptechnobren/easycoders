/* ──────────────────────────────────────────────────────────────────────────
 * Audio track discovery for the music dock.
 *
 * ⚠️ SERVER ONLY. This uses `node:fs` and may only be imported from a Server
 * Component — in practice that is `app/layout.tsx`, the single Server
 * Component in this app. Importing it from anything carrying `'use client'`
 * breaks the build with a module-not-found on `fs`, which is a confusing
 * error to debug, so check the import site before adding one.
 *
 * WHY read the directory instead of keeping a hand-written list: the ask was
 * to "play the audios in the folder", so dropping a file into `public/audio/`
 * should be the whole job. There is no manifest to forget to update.
 *
 * ⚠️ This runs at BUILD time, not per request — every page here is statically
 * prerendered (`○ (Static)` in the build output). A file added to the folder
 * after a build will not appear until the next build. On Vercel that is every
 * deploy, so in practice it is invisible; locally it means restarting `npm run
 * dev` after adding a track.
 * ────────────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';

export type Track = {
  /** Public URL, e.g. `/audio/foo.mp3`. */
  src: string;
  /** Display name — the ID3 title where there is one, else the filename. */
  title: string;
  /** Artist, album, or the film a `from-<x>` filename segment named. */
  subtitle?: string;
  /** Cover art extracted from the ID3 APIC frame, if the file carried one. */
  cover?: string;
};

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
/** Written by scripts/extract-covers.mjs on prebuild/predev. */
const MANIFEST = path.join(process.cwd(), 'public', 'audio-art', 'index.json');

type ManifestEntry = {
  title: string | null;
  artist: string | null;
  album: string | null;
  cover: string | null;
};

/** Extensions a browser might actually play. `.flac`/`.wav` are included for
 *  completeness even though they are a poor choice over the network. */
const AUDIO_EXTS = new Set([
  '.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wav', '.weba', '.webm', '.flac',
]);

/**
 * Junk that download sites staple onto filenames. Dropped wherever it appears.
 * Everything here is lowercase and compared token-by-token, so "Song" and
 * "song" both go, but a real title word like "Songs of Freedom" would only
 * lose the "songs" token — hence the deliberate narrowness of this list.
 */
const NOISE_TOKENS = new Set([
  'ytshorts', 'savetube', 'me', 'com', 'in', 'net',
  'pagalworld', 'pagalfree', 'mrjatt', 'djpunjab', 'wapking', 'masstamilan',
  'song', 'songs', 'audio', 'official', 'video', 'lyrical', 'lyrics',
  'full', 'hd', 'mp3', 'download', 'downloaded', 'free', 'new',
  'tseries', 'tips', 'zeemusic', 'sonymusic',
]);

/** 128 / 192 / 320 … bitrate stamps, and bare kbps markers. */
const BITRATE = /^\d{2,3}(kbps)?$/;

/** Words that stay lowercase in a title unless they lead it. */
const MINOR_WORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'ka', 'ki', 'ke', 'se']);

function titleCase(tokens: string[]): string {
  return tokens
    .map((t, i) => {
      if (/^\d+$/.test(t)) return t;                       // "2" stays "2"
      if (i > 0 && MINOR_WORDS.has(t)) return t;
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(' ');
}

/**
 * Turn a download-site filename into something presentable.
 *
 * The real case this was written against:
 *
 *   ghar-kab-aaoge-from-border-2-gharkabaaoge-border2-ghar-kab-aaoge-border2-song-tseries-128-ytshorts.savetube.me.mp3
 *   → { title: 'Ghar Kab Aaoge', subtitle: 'Border 2' }
 *
 * Those filenames are SEO keyword soup: the title and album repeat several
 * times over, in spaced and squashed spellings. So after splitting on `from`,
 * the album is read only up to the first token that repeats something already
 * seen — including the squashed spelling of the title ("gharkabaaoge"), which
 * is what stops it at "border 2" instead of swallowing the rest.
 *
 * This is a best-effort tidy, not a parser. If it mangles a name, RENAME THE
 * FILE — the filename is the source of truth and a clean one passes through
 * untouched.
 */
function parseName(fileName: string): { title: string; subtitle?: string } {
  const base = fileName.slice(0, fileName.lastIndexOf('.'));

  const tokens = base
    .toLowerCase()
    .split(/[-_.\s]+/)
    .filter((t) => t && !NOISE_TOKENS.has(t) && !BITRATE.test(t));

  if (!tokens.length) return { title: base };

  const fromAt = tokens.indexOf('from');
  if (fromAt <= 0) {
    // No album marker: just drop consecutive repeats and use the lot.
    const flat = tokens.filter((t, i) => t !== tokens[i - 1]);
    return { title: titleCase(flat) };
  }

  const titleTokens = tokens.slice(0, fromAt);
  const squashed = titleTokens.join('');          // "gharkabaaoge"
  const seen = new Set(titleTokens);

  const albumTokens: string[] = [];
  for (const t of tokens.slice(fromAt + 1)) {
    // Stop at the first echo of anything already read — spaced or squashed.
    if (seen.has(t) || t === squashed || t === albumTokens.join('')) break;
    albumTokens.push(t);
    seen.add(t);
  }

  return {
    title: titleCase(titleTokens),
    subtitle: albumTokens.length ? titleCase(albumTokens) : undefined,
  };
}

/**
 * Rip-site branding stapled onto the ID3 title itself, e.g.
 * "Vande Mataram - PagalNew". Matched as a whole trailing segment so a real
 * title is never truncated mid-phrase.
 */
const TITLE_SITE_SUFFIX =
  /\s*[-–—]\s*(pagalnew|pagalworld|pagalfree|mr-?jatt|djpunjab|songspk|wapking|pendujatt|savetube|ytshorts)\s*$/i;

/**
 * Clean an ID3 title. These are better than filenames but not clean: they
 * carry the same site branding, and rippers often append the whole SEO
 * description after a pipe — "…Aye Watan Tere Liye | Desh Bhakti Song |
 * 26 January Song". Everything from the first pipe is descriptive filler.
 */
function cleanTagTitle(raw: string): string {
  const firstSegment = raw.split('|')[0];
  return firstSegment.replace(TITLE_SITE_SUFFIX, '').trim();
}

function readManifest(): Record<string, ManifestEntry> {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Record<string, ManifestEntry>;
  } catch {
    // Not generated yet (or public/audio-art was cleaned). Titles fall back to
    // the filename parser and the dock shows its placeholder artwork — the
    // player still works, it just looks plainer.
    return {};
  }
}

/**
 * Every playable file in `public/audio/`, sorted by filename so the running
 * order is stable and predictable (prefix files `01-`, `02-` to control it).
 *
 * Names come from the ID3 tags where the file has them, and fall back to the
 * filename parser above where it doesn't — of the current six tracks, five are
 * tagged and one carries nothing but the ripper's filename.
 *
 * A missing folder is not an error — it just means no music, and the dock
 * renders nothing.
 */
export function getTracks(): Track[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(AUDIO_DIR);
  } catch {
    return [];
  }

  const manifest = readManifest();

  return entries
    .filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => {
      const meta = manifest[f];
      const fromName = parseName(f);
      const tagged = meta?.title ? cleanTagTitle(meta.title) : '';

      return {
        // encodeURIComponent, not encodeURI: these filenames routinely contain
        // spaces, '&' and '#', all of which break a bare URL.
        src: `/audio/${encodeURIComponent(f)}`,
        title: tagged || fromName.title,
        // Artist first — on a playlist row it identifies the track better than
        // the album, which for film songs is usually just the film again.
        subtitle: meta?.artist || meta?.album || fromName.subtitle,
        cover: meta?.cover ?? undefined,
      };
    });
}
