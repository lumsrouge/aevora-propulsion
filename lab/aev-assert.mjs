/**
 * The assertions worldflight-assert.mjs could not reach.
 *
 * That script clears the five geometry checks and then crashes on
 * `window.__sc.clips`, a debug hook the shipped v0.3.0 engine does not expose.
 * Everything below measures the same claims off the DOM instead: the playhead,
 * the seam, the copy transform cap, the reduced-motion contract, and this
 * page's own rail.
 *
 *   node lab/aev-assert.mjs --url http://localhost:4512
 */
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(path.join(process.cwd(), "package.json"));
const { chromium } = require("playwright-core");

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const URL = arg("--url", "http://localhost:4512");
const CHROME = [
  process.env.SCROLLCRAFT_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && fs.existsSync(p));

const W = [2.34, 2.34, 2.34, 4.68];
const C = [0, 2.34, 4.68, 7.02];
const TOTAL = 11.7;

let pass = 0, fail = 0;
const ok = (name, cond, note = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}${note ? "  " + note : ""}`); }
  else { fail++; console.log(`  FAIL  ${name}${note ? "  " + note : ""}`); }
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function open(opts = {}) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts,
  });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html.sc-ready", { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  return { page, errs };
}

// ---------------------------------------------------------------- playhead --
{
  console.log("\nPLAYHEAD  leg 0, lerp 0.12");
  const { page, errs } = await open();
  const vh = 900;
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round(0.10 * W[0] * vh));
  await page.waitForTimeout(1600);

  const trace = await page.evaluate((y) => new Promise((res) => {
    const v = document.querySelectorAll("[data-sc-segment] video")[0];
    const s = [];
    scrollTo({ top: y, behavior: "instant" });
    let n = 0;
    (function f() {
      s.push(+v.currentTime.toFixed(4));
      if (++n < 80) requestAnimationFrame(f);
      else res({ s, dur: v.duration });
    })();
  }), Math.round(0.85 * W[0] * vh));

  const seq = trace.s;
  const target = 0.85 * trace.dur;
  const distinct = [...new Set(seq)];
  const monotone = seq.every((v, i) => i === 0 || v >= seq[i - 1] - 1e-6);
  const end = seq[seq.length - 1];
  console.log(`  ${seq[0].toFixed(3)}s -> ${end.toFixed(3)}s  target ${target.toFixed(3)}s  ${distinct.length} distinct`);
  ok("playhead is lerped, not written 1:1", distinct.length >= 4, `${distinct.length} steps over 80 frames`);
  ok("playhead is monotone toward its target", monotone);
  ok("playhead does not overshoot", Math.max(...seq) - target <= 0.03,
    `max excess ${(Math.max(...seq) - target).toFixed(4)}s`);
  ok("playhead converges", Math.abs(end - target) < 0.06, `residual ${Math.abs(end - target).toFixed(4)}s`);
  ok("no console or page errors", errs.length === 0, errs.join(" | "));
  await page.close();
}

// -------------------------------------------------------------------- seam --
{
  console.log("\nSEAMS  band 0.2vh, one-sided crossfade");
  const { page } = await open();
  const vh = 900;
  for (let k = 1; k < W.length; k++) {
    const samples = [];
    for (let d = -0.16; d <= 0.161; d += 0.04) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round((C[k] + d) * vh));
      await page.waitForTimeout(220);
      samples.push(await page.evaluate((i) => {
        const segs = [...document.querySelectorAll("[data-sc-segment]")];
        return {
          inc: +getComputedStyle(segs[i]).opacity,
          out: +getComputedStyle(segs[i - 1]).opacity,
        };
      }, k));
    }
    const inc = samples.map((s) => s.inc);
    const rising = inc.every((v, i) => i === 0 || v >= inc[i - 1] - 0.02);
    const covered = samples.every((s) => s.inc + s.out >= 0.98);
    ok(`seam ${k - 1}->${k}: incoming leg rises monotonically`, rising, inc.map((v) => v.toFixed(2)).join(" "));
    ok(`seam ${k - 1}->${k}: page ground never shows through`, covered);
  }
  await page.close();
}

// -------------------------------------------------- copy transform + rail --
{
  console.log("\nCOPY AND RAIL");
  const { page } = await open();
  const vh = 900;
  let maxT = 0, drawn = [];
  const walk = [];
  for (let t = 0; t < TOTAL; t += 0.3) walk.push(t);
  walk.push(TOTAL);
  for (const t of walk) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round(t * vh));
    await page.waitForTimeout(90);
    const r = await page.evaluate(() => {
      let m = 0;
      document.querySelectorAll("[data-sc-copy]").forEach((el) => {
        const tr = getComputedStyle(el).transform;
        if (tr && tr !== "none") {
          const y = Math.abs(parseFloat(tr.split(",")[5] || "0"));
          if (y > m) m = y;
        }
      });
      const stages = [...document.querySelectorAll(".aev-stage")].map((g) => {
        const p = g.querySelector("path");
        const len = parseFloat(getComputedStyle(p).strokeDasharray) || 1;
        const off = parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
        return +(1 - off / len).toFixed(2);
      });
      return { m, stages, seg: +getComputedStyle(document.documentElement).getPropertyValue("--sc-seg") };
    });
    if (r.m > maxT) maxT = r.m;
    drawn.push(r.stages);
  }
  ok("copy translate stays inside the 4vh cap", maxT <= 0.04 * vh + 1, `max ${maxT.toFixed(1)}px of ${0.04 * vh}px`);

  // A stage that has been drawn stays drawn: the rail accumulates.
  let regress = 0;
  for (let i = 1; i < drawn.length; i++)
    for (let s = 0; s < 4; s++)
      if (drawn[i][s] < drawn[i - 1][s] - 0.02) regress++;
  ok("rail accumulates: no stage un-draws itself", regress === 0, `${regress} regressions`);
  ok("rail is fully drawn by the end", drawn[drawn.length - 1].every((v) => v > 0.98),
    drawn[drawn.length - 1].join(" "));

  // The stops navigate.
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
  await page.click('.aev-stops button[data-leg="3"]');
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => scrollY);
  ok("rail stop 4 jumps into the ignition leg", after > C[3] * vh * 0.9, `scrollY ${Math.round(after)}px`);
  await page.close();
}

// -------------------------------------------------------- reduced motion ---
{
  console.log("\nREDUCED MOTION");
  const { page } = await open({ reducedMotion: "reduce" });
  const reqs = [];
  page.on("request", (r) => { if (/\.mp4/.test(r.url())) reqs.push(r.url()); });
  const vh = 900;
  for (let t = 0; t <= TOTAL; t += 1.2) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round(t * vh));
    await page.waitForTimeout(180);
  }
  ok("no clip is fetched under reduced motion", reqs.length === 0, reqs.join(", "));
  const st = await page.evaluate(() => {
    const c = document.querySelector("[data-sc-copy]");
    const posters = [...document.querySelectorAll(".sc-world__poster")].map((p) => getComputedStyle(p).transform);
    return { copyT: getComputedStyle(c).transform, posters, close: document.querySelector(".aev-rail").getAttribute("data-close") };
  });
  ok("copy carries no transform under reduced motion", st.copyT === "none", st.copyT);
  ok("posters carry no push under reduced motion", st.posters.every((t) => t === "none"));
  ok("rail still resolves at the close", st.close === "1");
  await page.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
