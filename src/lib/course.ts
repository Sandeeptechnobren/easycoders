/* ──────────────────────────────────────────────────────────────────────────
 * Shared helpers for the public Courses pages.
 *
 * Centralised because we want the SAME stock image to appear for a given
 * course on the list page and the detail page — previously the list used
 * `index % images.length` while the detail used `course.id % images.length`,
 * so the same course showed two different photos.
 * ────────────────────────────────────────────────────────────────────────── */

/* Course images now fall back to a *branded* navy panel (see brandedCoursePanel
 * below) instead of generic Unsplash stock photos — those carried no brand
 * colour, cycled visible duplicates across a grid, and read as a template.
 * The panel is a self-contained SVG (navy gradient + gold/teal program glyph),
 * so fallback cards always look designed and never depend on an external CDN. */

/** Loose shape of a course as returned by `/api/courses` and `/api/courses/{id}`. */
export type ApiCourse = {
  id: number;
  category_id?: number;
  title: string;
  description?: string;
  original_price?: string | number;
  discounted_price?: string | number;
  offer?: string;
  duration?: string;
  level?: string;
  image?: string;
  category?: {
    id: number;
    name: string;
    features?: Array<{ id: number; feature: string }>;
  };
};

/** Up-to-two-letter initials from a course title, for the branded panel. */
function courseInitials(title: string | undefined): string {
  const words = (title || 'Easy Coders').trim().split(/\s+/).filter(Boolean);
  const a = words[0]?.[0] ?? 'E';
  const b = words[1]?.[0] ?? words[0]?.[1] ?? 'C';
  return (a + b).toUpperCase();
}

/**
 * A self-contained, on-brand placeholder for courses with no real image.
 * Renders a navy gradient panel lit by the brand's own gold/teal accent
 * (alternating per course id) with the program's initials in a serif display
 * face and a quiet "EASY CODERS" wordmark — so every fallback card looks
 * deliberately designed rather than like a recycled stock photo.
 * Returned as a data-URI SVG so it needs no network request and no CDN.
 */
export function brandedCoursePanel(c: Pick<ApiCourse, 'id' | 'title'>): string {
  const goldKey = Math.abs(Number(c.id) || 0) % 2 === 0;
  const glow = goldKey ? 'rgba(232,160,32,0.32)' : 'rgba(26,165,187,0.36)';
  const mark = goldKey ? '#F0AE33' : '#2BB6CC';
  const ini = courseInitials(c.title);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="338" viewBox="0 0 600 338">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#0B1B3A"/><stop offset="1" stop-color="#16305E"/>` +
    `</linearGradient>` +
    `<radialGradient id="r" cx="78%" cy="26%" r="62%">` +
    `<stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="rgba(11,27,58,0)"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="600" height="338" fill="url(#g)"/>` +
    `<rect width="600" height="338" fill="url(#r)"/>` +
    `<circle cx="506" cy="262" r="150" fill="none" stroke="${mark}" stroke-opacity="0.18" stroke-width="1.5"/>` +
    `<circle cx="506" cy="262" r="104" fill="none" stroke="${mark}" stroke-opacity="0.10" stroke-width="1.5"/>` +
    `<text x="300" y="178" text-anchor="middle" font-family="Georgia,'Playfair Display',serif" font-size="118" font-weight="700" fill="${mark}" fill-opacity="0.95">${ini}</text>` +
    `<text x="300" y="242" text-anchor="middle" font-family="'DM Sans',system-ui,sans-serif" font-size="16" font-weight="600" letter-spacing="7" fill="#ffffff" fill-opacity="0.6">EASY CODERS</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Resolve the image for a course: its real image if set, otherwise the
 * branded navy panel. Stable per course id, so the same course always shows
 * the same artwork wherever it appears on the site.
 */
export function courseImage(c: Pick<ApiCourse, 'id' | 'image' | 'title'>): string {
  if (c.image) return c.image;
  return brandedCoursePanel(c);
}

/**
 * Format a price as Indian-locale rupees with a thousands separator
 * (e.g. `14000` → `₹14,000`). Accepts string or number.
 * Returns an empty string when the input is missing/invalid.
 */
export function formatINR(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return '';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Capitalise the first letter of a string. Backend returns `"beginner"`,
 * we want `"Beginner"` for display. Safe on empty/undefined. */
export function titleCase(value: string | undefined | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Truncate a description at a word boundary near `maxChars`, appending an
 * ellipsis. Prevents the mid-word cuts the old `.slice(0, 90) + '…'` produced. */
export function clipAtWord(text: string | undefined | null, maxChars = 110): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

/** Slugify a category name to use it as a URL query value. */
export function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
