/* ──────────────────────────────────────────────────────────────────────────
 * Shared helpers for the public Courses pages.
 *
 * Centralised because we want the SAME stock image to appear for a given
 * course on the list page and the detail page — previously the list used
 * `index % images.length` while the detail used `course.id % images.length`,
 * so the same course showed two different photos.
 * ────────────────────────────────────────────────────────────────────────── */

/** Generic coding/learning stock photos used when a course has no `image`. */
export const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop&q=70',
];

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

/**
 * Pick a deterministic stock image for a given course. Using the course `id`
 * (not list-index) means the same course always renders with the same image
 * regardless of where it appears on the site.
 */
export function courseImage(c: Pick<ApiCourse, 'id' | 'image'>): string {
  if (c.image) return c.image;
  // Modulo on id keeps the choice stable across pages.
  const idx = Math.abs(Number(c.id) || 0) % COURSE_IMAGES.length;
  return COURSE_IMAGES[idx];
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
