# AEVORA Propulsion

**A jet engine assembles under your hand, then ignites.**

One page, one continuous camera move through one test cell. You scroll, an engine
builds itself from a bare shaft, the camera travels inside it, and then it lights.

**→ [See it running](https://lumsrouge.github.io/aevora-propulsion/)**

![The hero](docs/hero.webp)

AEVORA doesn't exist. It has never certified an engine and `projects@aevora.example`
will not write back. It's a concept build from **Oberlab**, made to find out how far
a site can go when scroll is the only interaction. You won't find a single
performance figure anywhere on the page — inventing thrust ratings for a fictional
aerospace supplier felt like the express lane to someone's legal department.

## The idea

Scroll is the one input every visitor already knows how to use. So here the wheel
is a scrubber and the page is a film, with real, selectable, translatable HTML
sitting on top of it.

No sections, no pinning, no seams sliding up the screen. One fixed stage, four
video legs mounted at once, one copy layer, and an empty spacer that provides the
scroll track. Four acts — Core, Architecture, Craft, Ignition — and Ignition gets
exactly twice the scroll of the other three, because people remember one peak and
the ending. Everything before it is deliberately quieter so that it can land.

There's also a stretch in the middle, about 1.3 screen-heights, where nothing is
written at all. The camera has come to rest inside the engine and nobody is
talking. That silence is authored, not a page that failed to load.

Fixed to the bottom edge is a longitudinal cutaway of the engine that draws itself
stage by stage as you scroll, follows the camera inside on the Craft leg, and then
lifts off to settle under the final CTA. It's also the navigation — four buttons,
because there is no nav bar anywhere on this site.

## The part I'm not proud of

![The close](docs/close.webp)

For roughly the middle third of the ignition clip, **flame comes out of the intake.**

On a real turbofan, air goes *in* at the front. Fire coming back out of it is a
compressor stall, comfortably the least reassuring thing an engine can do in front
of a customer. So the finale is a spectacular failure mode being presented here as
a triumphant first run.

I spent exactly one reroll trying to fix it. It came back with the camera pushing
in instead of withdrawing, the test cell having spontaneously grown LED strip
lighting, and the intake flame worse. The first take stayed. Both are in `out/` if
you'd like to judge for yourself.

That's the honest edge of the tool: you can hold an image-to-video model to a start
frame and a camera move. You cannot hold it to a causal model of airflow.

## Run it

```bash
npm install
npm run serve    # http://localhost:4512
npm run assert   # 19 assertions, if you're curious
```

No build step, no bundler, no framework. An HTML file, two stylesheets, two
scripts, and some video.

## Going deeper

- **[MAKING-OF.md](MAKING-OF.md)** — the cutaway rail, why phones got a different
  layout entirely, the verification harness and what it caught, the encoding rabbit
  hole, the stack and what it all cost.
- **[BRIEF.md](BRIEF.md)** — the original brief, the feeling curve, the peak.

Built at Oberlab with [Claude Code](https://claude.com/claude-code). Code is MIT;
the imagery is a fictional engine for a fictional company, for portfolio use.
