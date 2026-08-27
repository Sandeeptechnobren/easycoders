# public/rakhi/

Assets for the Raksha Bandhan theme (`?theme=rakhi`). Local only — this theme is
not deployed.

## rakhi-hero.jpg  ← in use

The hero background: the pooja-thali photograph (brass bowls with rice and
kumkum, a rakhi laid beside them).

Referenced from `src/app/rakhi.css` as `--rakhi-hero`. If the file is absent the
`url()` fails silently and the navy `background-color` underneath shows through,
so the hero degrades to the plain themed version rather than breaking. That is
deliberate — but it also means a typo in the filename looks like "the theme
just didn't change", not like an error.

**Converted from `rakhi-hero.png` (the file as supplied): 247 KB → 32 KB, an 87%
saving, at quality 84 progressive.** PNG is lossless and made for flat colour
and sharp edges; this is a photograph, which is exactly the case PNG handles
worst. It is also sitting under a 0.94 navy scrim, so JPEG artefacts have
nowhere to show. `rakhi-hero.png` is no longer referenced by anything and can be
deleted whenever you like — left in place rather than removed unasked.

## Notes

- Source is 511x325 (about 1.57:1). How much gets cropped depends on the
  window: on a 1265px-wide hero almost the whole frame shows; at 1920px the
  hero is about 2.5:1 and `cover` trims roughly 60px from the top and bottom of
  the source. Both crops keep the bowls and the rakhi, which sit in the middle
  band — that is why the vertical position is `center`.
- ⚠️ **511px is small for a full-bleed hero.** It is upscaled about 2.5x at
  1265px wide and about 3.8x at 1920px, so the photograph is soft. The dense
  scrim hides this over the text column, but it is visible toward the right
  where the scrim clears to 0.58. If a larger original exists, drop it in — the
  CSS needs no change. Anything from about 1600px wide would remove the issue.
- **Licensing: cleared by the owner on 2026-08-27** — the licence covers
  commercial web use. (This does NOT extend to the Alamy-derived flag image in
  `public/flag/`, which is a separate and still-open question.)
