# FF6 Brave New World Web Patcher

A browser-based IPS patcher for Final Fantasy VI: Brave New World. Users
upload an unmodified Final Fantasy III (US) ROM, pick optional patches,
and download a patched copy. Everything happens client-side — no ROM is
ever uploaded to a server.

Built with Next.js (Pages Router).

## Running it locally

You need [Node.js](https://nodejs.org) (LTS).

```
npm install
npm run dev
```

Then open http://localhost:3000

Create a `.env.local` in the project root with the unlock hash:

```
NEXT_PUBLIC_CUSTOM_OPTIONS_HASH=<sha256 of the password>
```

Generate a hash with:

```
node -e "console.log(require('crypto').createHash('sha256').update('yourpassword').digest('hex'))"
```

The dev server only reads `.env.local` at startup, so restart it after
changing that file.

## How patches are loaded

Nothing about the patch list lives in code. Each category is a `.zip` in
`public/`, and every `.ips` inside becomes one option box.

**The `.ips` filename is the label shown on the site**, verbatim — minus
the `.ips`. `T-Edition.ips` shows as "T-Edition". Capitalisation,
hyphens, spaces and punctuation are all preserved, so name files exactly
as they should appear.

| Category | Zip in `public/` |
|---|---|
| Diary Expansion | `Expansion.zip` |
| Dialogue | `Dialogue.zip` |
| Accessibility | `Accessibility.zip` |
| Gameplay | `Gameplay.zip` |
| Wallpapers | `Wallpapers.zip` |
| Character Portraits | `Character Portraits.zip` |
| Sprites & Graphics | `Character Sprites and Graphics.zip` |
| Menu Font | `Menu Fonts - Requires Diary Expansion.zip` |
| Dialogue Font | `Dialogue Fonts - Requires Diary Expansion.zip` |
| Music | `Music.zip` |

The base patches live in `public/FF6BNW.zip`. Those are matched by
checksum, so each one is named for the CRC32 of the source ROM it
applies to — `C0FA0464.ips`, not a descriptive name.

## Adding or updating a patch

1. **Drop the `.ips` into the right zip** in `public/`, named as it
   should appear on the site.

2. **Write a description** at `public/manifests/<same name>.txt`. This
   shows in the Information popup. Blank lines become paragraph breaks.
   End with a `Credit:` line where someone deserves one.

3. **Add a screenshot** at `public/previews/<same name>.png`. Without
   one, the Information button doesn't appear on that box.

4. **Add the name to the category's `order` array** in
   `components/MainPatcher.tsx`. This controls both display order and
   the order patches are applied in.

All four names must match exactly. A mismatch fails quietly — the box
appears with no description, or sorts to the bottom.

## Patch order matters

IPS patches overwrite bytes. When two patches touch the same address,
whichever is applied last wins. Apply order is the `order` array, read
top to bottom, category by category down `optionalPatchesConfig`.

Practical consequences:

- The Diary goes first, since it expands the ROM.
- `notext` goes after the translations, because it clears text they set.
- Broad sprite sets (T-Edition, Side-B) go before narrow single-sprite
  patches, so the narrow ones aren't overwritten.

To check, open the browser console and hit download. Every patch is
logged in the order it's applied.

## Rules between patches

Two tables at the top of `components/MainPatcher.tsx`:

**`EXCLUSIVE_GROUPS`** — patches sharing a tag can't both be selected.
Selecting one clears the other, even across categories. A patch can
carry several tags: `Slots Menu` is in both `SLOTS A` and `SLOTS B`, so
it blocks Forgiving Slots and Slow Reels while those two remain
compatible with each other.

**`PATCH_REQUIRES`** — patches that need something else selected first.
All fonts require `DIARY`. A tag counts as satisfied when any selected
patch carries it in `EXCLUSIVE_GROUPS`, so either Diary works.
Unsatisfied options render greyed out and disabled, and deselecting the
Diary automatically clears any fonts that depended on it.

Note that a category set to `allowMultiple: false` makes *every* box in
it mutually exclusive, overriding the tag system. Where a category holds
one freely combinable option — Dialogue holds `notext` — set it to
`true` and let the tags handle exclusivity.

## ROM size

Output is 3MB by default and 4MB when a patch listed in
`EXPANDING_PATCH_NAMES` is selected (currently the two Diary patches).

`lib/patcher.ts` throws if a patch tries to write past the end of the
ROM, naming the size it needed. If you add a patch that requires the
expansion, that error is how you'll find out — add its name to
`EXPANDING_PATCH_NAMES`.

## Locked patches

Names in `lockedPatchNames` (passed to `CustomOptionsPanel` in
`MainPatcher.tsx`) are hidden behind a password, meant as a
spoiler gate for post-completion content.

This is a speed bump, not security. The patches sit in the same public
zips as everything else and can be downloaded directly by anyone who
guesses the URL.

## Project layout

```
components/     UI. MainPatcher.tsx holds all patch configuration.
hooks/          useOptionalPatches.ts — loads and sorts the zips.
lib/            patcher.ts (IPS application), crc32.ts.
pages/          Routes. index.tsx is the patcher, guides.tsx the docs.
public/         Zips, manifests, previews, images, fonts.
global.css      All styling except ImagePreviewModal, which is scoped.
```

## Gotchas

- `global.css` has `main div { width: 100%; min-width: 100% }`, which
  applies to every div at any depth inside `<main>`. New components that
  shouldn't be full-width need `min-width: 0` on a class, which
  outranks it.
- The site font (ChicagoFLF) renders badly at fractional pixel sizes.
  The base is 20px, so keep `rem` values that multiply to whole numbers:
  `0.8`, `1`, `1.2` are fine; `0.85`, `1.15` are not.
- Favicons cache hard. Bump the `?v=` in `pages/_document.tsx` after
  changing one.
