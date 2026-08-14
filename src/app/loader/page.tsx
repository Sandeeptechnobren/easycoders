'use client';

import Loader from '@/components/Loader';

/**
 * The `/loader` ROUTE.
 *
 * The real implementation now lives in `@/components/Loader`. This file used to
 * BE the component — four pages imported it directly, which meant every caller
 * got a hardcoded `min-height:100vh` takeover even when the spinner belonged
 * inside a card, and it shipped a render-blocking font `@import` inside a
 * `<style>` tag.
 *
 * Kept as a thin wrapper so the existing `/loader` URL does not start 404ing.
 * New code should import `@/components/Loader` directly and pass the props it
 * needs.
 */
export default function LoaderRoute() {
  return <Loader fullscreen label="Loading…" />;
}
