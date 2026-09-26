# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, single-page scroll-driven concept site (GitHub Pages, `.nojekyll`). No build step, no bundler, no framework: `index.html`, two stylesheets, two scripts, and video in `assets/`. `README.md` is the pitch, `MAKING-OF.md` has the design and verification detail, and `BRIEF.md` is the original brief (feeling curve, peak, grammar).

## Commands

```bash
npm install          # only dependency: playwright-core (for the assertion harness)
npm run serve        # static server on http://localhost:4512 (inline node http server in package.json)
npm run assert       # lab/aev-assert.mjs against localhost:4512, 19 assertions; needs `serve` running
```

There is no lint, typecheck, or unit-test setup, and you can't run a single assertion on its own: `aev-assert.mjs` is one top-level script made of blocks (playhead, seams, copy transform cap, rail, reduced motion). The harness looks for a Chrome binary at hard-coded Windows, macOS, and `/usr/bin/google-chrome` paths. Otherwise it uses `SCROLLCRAFT_CHROME`, so in this container run `SCROLLCRAFT_CHROME=/opt/pw-browsers/chromium npm run assert` (point it at the actual executable if that path is a directory).

## Architecture

**`scrollcraft.js` / `scrollcraft.css` are a vendored engine: do not modify them.** They must stay byte-identical to the scroll-craft skill's copies (MAKING-OF says this was checked by checksum). Put all page-specific behaviour in `aevora.js` / `aevora.css`. The header comment in `scrollcraft.js` is the reference for the `data-sc-*` attribute API.

The page uses the engine's **worldflight** mode, not stacked pinned sections:
- `[data-sc-mode="worldflight"]` holds one fixed `[data-sc-world]` stage with four `[data-sc-segment]` video legs (Core, Architecture, Craft, Ignition), one fixed `[data-sc-world-copy]` layer, and an empty `[data-sc-spacer]` whose height provides the scroll track.
- Each leg has a weight `data-sc-w` in viewport-heights (2.34 / 2.34 / 2.34 / 4.68; Ignition gets exactly double), `data-sc-src` and `data-sc-src-mobile` encodes, and a `data-sc-waypoint` name. Also set: `data-sc-seam="0.2"` crossfade and `data-sc-lerp="0.12"` playhead smoothing.
- Copy blocks use `data-sc-copy` with `data-sc-window="from to [rIn rOut]"` as track fractions (0..1), or the named windows `hero` / `finale`. The gap between 0.545 and 0.655 has no copy on purpose (the "authored silence"). Keep it empty.

**`aevora.js`** (the `Aevora` IIFE) reads the engine's published state, meaning the CSS vars `--sc-seg` / `--sc-segp` and the `sc:waypoint` event. It uses that state to drive the SVG axial cutaway rail at the bottom (stages draw via `stroke-dashoffset` and stay accumulated; it zooms its `viewBox` into the combustor on Craft and lifts onto the CTA at the finale), the rail's `<button data-leg>` stops (the site's only navigation), the windowed scrims, and the pointer-parallax atmosphere planes. Scrims reimplement the engine's window math deliberately: a scrim must not be `[data-sc-copy]`, because the verification pass hides those elements.

**The leg weights are duplicated.** `W`, `C` (cumulative starts) and `TOTAL = 11.70` are hard-coded in `index.html` (`data-sc-w`), `aevora.js`, and `lab/aev-assert.mjs`. Change all three together. `BRIEF.md`'s worldflight score (3 legs, ~8.02vh) predates the final build. The code is the source of truth.

**Phones get a different composition, not a scaled one.** Mobile shows the film as a full-width band in the upper screen, with the copy below on the page ground. It was verified at 390×844 and 360×640.

**Reduced motion** is a contract: no clip is fetched, the posters carry the story, and all transforms are dropped. The assert harness checks this.

## Assets and lab

- `assets/`: scrub-optimised encodes, GOP 8 for desktop and GOP 4 for mobile (`-m.mp4`), plus `p0N.webp` posters. The dense keyframes are intentional so seeking stays responsive. Don't re-encode with normal web GOP settings.
- `out/`: raw generation masters, rejected takes, and `KIE-LEDGER.md` (kie.ai spend). Reference only.
- `lab/`: `aev-assert.mjs` plus verification contact sheets. Per-frame screenshots (`lab/*/[0-9][0-9].png`) are gitignored.
- `docs/`: webp images used by the README and MAKING-OF.

The copy is international English and deliberately contains no performance figures for the fictional company.
