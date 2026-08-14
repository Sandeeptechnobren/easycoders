/* ──────────────────────────────────────────────────────────────────────────
 * Prepares the music library for upload to the backend server.
 *
 *   in :  public/audio/*.mp3        (local masters — gitignored, never deployed)
 *   out:  .music-dist/art/*.jpg     cover art pulled from each file's ID3 APIC
 *         .music-dist/index.json    resolved title / subtitle / cover per track
 *
 * The audio is hosted on the Laravel box, not shipped with the frontend — 39 MB
 * of MP3 in a Vercel deploy is 39 MB re-uploaded on every build for files that
 * never change. Upload target and procedure are in docs/DEPLOY_LOG.md.
 *
 * THE MANIFEST IS FULLY RESOLVED HERE, on purpose: `title` and `subtitle` are
 * final display strings, so the PHP endpoint that serves this needs no parsing
 * logic of its own and the messy tag/filename handling lives in exactly one
 * place. Adding a song is: drop it in public/audio/, run this, upload.
 *
 * Deliberately dependency-free — it parses ID3 by hand rather than pulling in a
 * tag library, and does not resize (sharp is only present transitively via
 * Next, so depending on it here would be depending on someone else's
 * dependency).
 *
 * Run: npm run music
 * ────────────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'public', 'audio');
const DIST_DIR = path.join(process.cwd(), '.music-dist');
const ART_DIR = path.join(DIST_DIR, 'art');

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/* ── ID3 ──────────────────────────────────────────────────────────────────── */

/** ID3v2.4 sizes are "syncsafe": 7 bits per byte, top bit always clear. */
const syncsafe = (b, o) =>
  ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);

/** Decode an ID3 text payload given its leading encoding byte. */
function decodeText(buf) {
  if (!buf.length) return '';
  const enc = buf[0];
  const body = buf.subarray(1);
  let s;
  if (enc === 0) s = body.toString('latin1');
  else if (enc === 1) s = body.toString('utf16le'); // BOM-prefixed; stripped below
  else if (enc === 2) s = body.swap16().toString('utf16le'); // UTF-16BE
  else s = body.toString('utf8');
  return s.replace(/^﻿/, '').replace(/\0+$/, '').trim();
}

/** Walk one file's ID3v2 frames → { tags, picture }. */
function readId3(buf) {
  const out = { tags: {}, picture: null };
  if (buf.length < 10 || buf.subarray(0, 3).toString('latin1') !== 'ID3') return out;

  const major = buf[3];
  const flags = buf[5];
  let p = 10;
  const end = Math.min(10 + syncsafe(buf, 6), buf.length);

  // Skip the extended header if present (flag 0x40).
  if (flags & 0x40 && p + 4 <= end) p += major >= 4 ? syncsafe(buf, p) : buf.readUInt32BE(p) + 4;

  while (p + 10 <= end) {
    const id = buf.subarray(p, p + 4).toString('latin1');
    // Padding at the end of the tag reads as NUL bytes — that's the stop signal.
    if (!/^[A-Z0-9]{4}$/.test(id)) break;

    // v2.4 uses syncsafe frame sizes; v2.3 uses plain big-endian.
    const size = major >= 4 ? syncsafe(buf, p + 4) : buf.readUInt32BE(p + 4);
    const body = buf.subarray(p + 10, p + 10 + size);
    p += 10 + size;
    if (size <= 0 || !body.length) continue;

    if (id === 'TIT2' || id === 'TPE1' || id === 'TALB') {
      out.tags[id] = decodeText(body);
    } else if (id === 'APIC' && !out.picture) {
      const enc = body[0];
      let q = 1;
      const mimeEnd = body.indexOf(0, q); // MIME is always latin1, NUL-terminated
      if (mimeEnd < 0) continue;
      const mime = body.subarray(q, mimeEnd).toString('latin1').toLowerCase();
      q = mimeEnd + 2; // + the picture-type byte
      // Description: one NUL terminator for 8-bit encodings, two for UTF-16.
      if (enc === 1 || enc === 2) {
        while (q + 1 < body.length && !(body[q] === 0 && body[q + 1] === 0)) q += 2;
        q += 2;
      } else {
        const d = body.indexOf(0, q);
        if (d < 0) continue;
        q = d + 1;
      }
      const data = body.subarray(q);
      if (data.length > 100) out.picture = { mime, data };
    }
  }
  return out;
}

/* ── Naming ───────────────────────────────────────────────────────────────── */

/** Junk that download sites staple onto filenames. Compared token-by-token. */
const NOISE_TOKENS = new Set([
  'ytshorts', 'savetube', 'me', 'com', 'in', 'net',
  'pagalworld', 'pagalfree', 'pagalnew', 'mrjatt', 'djpunjab', 'wapking', 'masstamilan',
  'song', 'songs', 'audio', 'official', 'video', 'lyrical', 'lyrics',
  'full', 'hd', 'mp3', 'kbps', 'download', 'downloaded', 'free', 'new',
  'tseries', 'tips', 'zeemusic', 'sonymusic',
]);

/** 128 / 192 / 320 … bitrate stamps. */
const BITRATE = /^\d{2,3}(kbps)?$/;

/** Words that stay lowercase in a title unless they lead it. */
const MINOR_WORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'ka', 'ki', 'ke', 'se']);

/**
 * Rip-site branding stapled onto the ID3 title itself, e.g.
 * "Vande Mataram - PagalNew". Matched as a whole trailing segment so a real
 * title is never truncated mid-phrase.
 */
const TITLE_SITE_SUFFIX =
  /\s*[-–—]\s*(pagalnew|pagalworld|pagalfree|mr-?jatt|djpunjab|songspk|wapking|pendujatt|savetube|ytshorts)\s*$/i;

function titleCase(tokens) {
  return tokens
    .map((t, i) => {
      if (/^\d+$/.test(t)) return t; // "2" stays "2"
      if (i > 0 && MINOR_WORDS.has(t)) return t;
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(' ');
}

/**
 * Turn a download-site filename into something presentable. Used only when the
 * file has no usable ID3 title.
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
 * Best-effort, not a parser. If it mangles a name, RENAME THE FILE — a clean
 * filename passes through untouched.
 */
function parseName(fileName) {
  const base = fileName.slice(0, fileName.lastIndexOf('.'));
  const tokens = base
    .toLowerCase()
    .split(/[-_.\s]+/)
    .filter((t) => t && !NOISE_TOKENS.has(t) && !BITRATE.test(t));

  if (!tokens.length) return { title: base, subtitle: null };

  const fromAt = tokens.indexOf('from');
  if (fromAt <= 0) {
    const flat = tokens.filter((t, i) => t !== tokens[i - 1]);
    return { title: titleCase(flat), subtitle: null };
  }

  const titleTokens = tokens.slice(0, fromAt);
  const squashed = titleTokens.join('');
  const seen = new Set(titleTokens);
  const albumTokens = [];
  for (const t of tokens.slice(fromAt + 1)) {
    // Stop at the first echo of anything already read — spaced or squashed.
    if (seen.has(t) || t === squashed || t === albumTokens.join('')) break;
    albumTokens.push(t);
    seen.add(t);
  }

  return {
    title: titleCase(titleTokens),
    subtitle: albumTokens.length ? titleCase(albumTokens) : null,
  };
}

/**
 * Clean an ID3 title. Better than a filename but not clean: the same site
 * branding turns up here, and rippers often append the whole SEO description
 * after a pipe — "…Aye Watan Tere Liye | Desh Bhakti Song | 26 January Song".
 */
function cleanTagTitle(raw) {
  return raw.split('|')[0].replace(TITLE_SITE_SUFFIX, '').trim();
}

/* ── Build ────────────────────────────────────────────────────────────────── */

function main() {
  let files;
  try {
    files = fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.mp3'));
  } catch {
    console.error(`[music] no ${path.relative(process.cwd(), SRC_DIR)} directory — nothing to do`);
    process.exit(0);
  }

  // Rebuild from scratch so deleted songs can't leave orphan art behind.
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(ART_DIR, { recursive: true });

  const manifest = {};
  let withArt = 0;
  let bytes = 0;

  for (const file of files.sort((a, b) => a.localeCompare(b))) {
    const buf = fs.readFileSync(path.join(SRC_DIR, file));
    bytes += buf.length;
    const { tags, picture } = readId3(buf);

    const fromName = parseName(file);
    const tagged = tags.TIT2 ? cleanTagTitle(tags.TIT2) : '';

    let cover = null;
    if (picture) {
      // Same stem as the track, so the pairing is obvious on disk.
      cover = file.replace(/\.mp3$/i, '') + (MIME_EXT[picture.mime] || '.jpg');
      fs.writeFileSync(path.join(ART_DIR, cover), picture.data);
      withArt++;
    }

    manifest[file] = {
      title: tagged || fromName.title,
      // Artist first — on a playlist row it identifies the track better than
      // the album, which for film songs is usually just the film again.
      subtitle: tags.TPE1 || tags.TALB || fromName.subtitle,
      cover,
    };

    console.log(
      `[music] ${manifest[file].title}${manifest[file].subtitle ? ` — ${manifest[file].subtitle}` : ''}` +
        `  ${picture ? `art ${(picture.data.length / 1024).toFixed(0)}KB` : 'NO ART'}`,
    );
  }

  fs.writeFileSync(path.join(DIST_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(
    `\n[music] ${files.length} track(s), ${withArt} with art, ${(bytes / 1048576).toFixed(1)}MB of audio`,
  );
  console.log('[music] upload public/audio/*.mp3 and .music-dist/ — see docs/DEPLOY_LOG.md');
}

main();
