/* ──────────────────────────────────────────────────────────────────────────
 * Pulls the embedded cover art and tags out of every MP3 in public/audio/,
 * writing them to public/audio-art/ alongside an index.json manifest.
 *
 * Runs from `prebuild` and `predev`, so adding a song stays a drag-and-drop
 * job: the art appears on the next build or dev start, same as the track
 * itself (src/lib/tracks.ts already only rescans then).
 *
 * WHY a build step rather than reading the tags at request time: the art is
 * 14-68 KB per track, and the only two alternatives are worse. Inlining it as
 * data: URIs would put ~290 KB of base64 into the HTML of every page on the
 * site, uncacheable. Serving it from a route handler would add the first API
 * route to an app that is otherwise a pure SPA against Laravel, and make an
 * otherwise static page dynamic. Files on disk are cacheable, parallel-
 * loadable, and cost nothing at runtime.
 *
 * Deliberately dependency-free — it parses ID3 by hand rather than pulling in
 * a tag library, and does NOT resize (sharp is only present transitively via
 * Next, so depending on it here would be depending on someone else's
 * dependency). The art ships at whatever size it was embedded at; the dock
 * loads exactly one eagerly and lazy-loads the playlist thumbnails.
 * ────────────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const ART_DIR = path.join(process.cwd(), 'public', 'audio-art');
const MANIFEST = path.join(ART_DIR, 'index.json');

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

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
  // Trim the BOM and any trailing NULs (frames are often NUL-terminated).
  return s.replace(/^﻿/, '').replace(/\0+$/, '').trim();
}

/**
 * Walk the ID3v2 frames of one file.
 * Returns { tags, picture } — picture is { mime, data } or null.
 */
function readId3(buf) {
  const out = { tags: {}, picture: null };
  if (buf.length < 10 || buf.subarray(0, 3).toString('latin1') !== 'ID3') return out;

  const major = buf[3];
  const flags = buf[5];
  const tagSize = syncsafe(buf, 6);
  let p = 10;
  const end = Math.min(10 + tagSize, buf.length);

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
      // MIME type: always latin1, NUL-terminated.
      const mimeEnd = body.indexOf(0, q);
      if (mimeEnd < 0) continue;
      const mime = body.subarray(q, mimeEnd).toString('latin1').toLowerCase();
      q = mimeEnd + 1;
      q += 1; // picture-type byte
      // Description, terminated by one NUL (8-bit encodings) or two (UTF-16).
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

function main() {
  let files;
  try {
    files = fs.readdirSync(AUDIO_DIR).filter((f) => f.toLowerCase().endsWith('.mp3'));
  } catch {
    console.log('[covers] no public/audio directory — nothing to do');
    return;
  }

  fs.mkdirSync(ART_DIR, { recursive: true });

  const manifest = {};
  const written = new Set(['index.json']);

  for (const file of files) {
    const buf = fs.readFileSync(path.join(AUDIO_DIR, file));
    const { tags, picture } = readId3(buf);
    const entry = {
      title: tags.TIT2 || null,
      artist: tags.TPE1 || null,
      album: tags.TALB || null,
      cover: null,
    };

    if (picture) {
      const ext = MIME_EXT[picture.mime] || '.jpg';
      // Same stem as the track, so the pairing is obvious on disk.
      const name = file.replace(/\.mp3$/i, '') + ext;
      fs.writeFileSync(path.join(ART_DIR, name), picture.data);
      written.add(name);
      entry.cover = `/audio-art/${encodeURIComponent(name)}`;
    }

    manifest[file] = entry;
    console.log(
      `[covers] ${file}\n          title=${entry.title ?? '(none)'}  art=${
        picture ? `${(picture.data.length / 1024).toFixed(0)}KB ${picture.mime}` : 'NONE'
      }`,
    );
  }

  // Drop art belonging to tracks that are no longer there, so deleting a song
  // doesn't leave an orphan image shipping forever.
  for (const stale of fs.readdirSync(ART_DIR)) {
    if (!written.has(stale)) {
      fs.unlinkSync(path.join(ART_DIR, stale));
      console.log(`[covers] removed stale ${stale}`);
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`[covers] ${files.length} track(s), manifest written`);
}

main();
