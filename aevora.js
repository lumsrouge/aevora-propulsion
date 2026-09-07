/* AEVORA Propulsion, page-local behaviour.
   Reads the worldflight's published state (--sc-seg, --sc-segp, sc:waypoint)
   and drives four things the engine deliberately does not draw:

     1. the axial cutaway rail, which assembles itself stage by stage,
     2. its zoom into the combustor on the Craft leg, so the map follows the
        camera inside the machine,
     3. its lift at the close, where the finished section holds the action,
     4. the windowed scrims and the atmosphere planes.

   scrollcraft.js and scrollcraft.css are the mechanism and are not touched. */

var Aevora = (function () {
  'use strict';

  // The score, in the same unit the markup writes weights in.
  var W = [2.34, 2.34, 2.34, 4.68];
  var C = [0, 2.34, 4.68, 7.02];
  var TOTAL = 11.70;

  var VB_WIDE = [0, 0, 1200, 75];
  var VB_CORE = [475, 21.9, 500, 31.25];  // the combustor, at the same aspect

  var reduce = false;
  var root, rail, svg, stages, marker, stops, spacer, scrims, copies;
  var mx = 0, my = 0, pmx = 0, pmy = 0;
  var last = {};

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
  function ramp(v, a, b) { return smooth((v - a) / (b - a || 1e-6)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function num(name) { return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0; }

  // Same window contract the engine applies to [data-sc-copy], reimplemented
  // here because a scrim must not be a [data-sc-copy]: the verification pass
  // hides those to photograph the frame underneath, and a hidden scrim is a
  // scrim that never gets measured.
  function parseWindow(spec) {
    if (spec === 'hero') {
      return { from: 0, to: (0.62 * W[0]) / TOTAL, rIn: 0, rOut: 0.65 };
    }
    if (spec === 'finale') {
      var l = W.length - 1;
      return { from: (C[l] + 0.4 * W[l]) / TOTAL, to: 1, rIn: 0.55, rOut: 0 };
    }
    var n = spec.split(/\s+/).map(parseFloat);
    return {
      from: n[0] || 0,
      to: isNaN(n[1]) ? 1 : n[1],
      rIn: isNaN(n[2]) ? 0.3 : n[2],
      rOut: isNaN(n[3]) ? 0.3 : n[3]
    };
  }

  function windowOpacity(q, pr) {
    var win = Math.max(q.to - q.from, 0.001);
    var inEnd = q.from + win * q.rIn;
    var outStart = q.to - win * q.rOut;
    if (pr < q.from) return 0;
    if (pr < inEnd) return smooth((pr - q.from) / Math.max(inEnd - q.from, 0.001));
    if (pr <= outStart) return 1;
    return clamp01(smooth(1 - (pr - outStart) / Math.max(q.to - outStart, 0.001)));
  }

  // Every stroke in a stage group draws itself from its own start. Lengths are
  // measured once, after layout, rather than hand-computed.
  // Place each label under the part of the section it names. The SVG is scaled
  // by preserveAspectRatio, so the only honest source for that x is the drawn
  // geometry itself, measured in the unzoomed viewBox.
  function placeStops() {
    var box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    var s = Math.min(box.width / VB_WIDE[2], box.height / VB_WIDE[3]);
    var ox = box.left + (box.width - VB_WIDE[2] * s) / 2;
    var railLeft = rail.getBoundingClientRect().left;
    var centres = [185, 475, 725, 995];
    stops.forEach(function (b, i) {
      b.parentNode.style.left = (ox + centres[i] * s - railLeft).toFixed(1) + 'px';
    });
  }

  function measure() {
    stages.forEach(function (g) {
      g.shapes = [];
      Array.prototype.forEach.call(g.el.querySelectorAll('path,circle,line'), function (s) {
        var len = 0;
        try { len = s.getTotalLength(); } catch (e) { len = 0; }
        if (!len) return;
        s.style.strokeDasharray = len + ' ' + len;
        s.style.strokeDashoffset = len;
        g.shapes.push({ el: s, len: len });
      });
    });
  }

  function drawStages(seg, segp) {
    stages.forEach(function (g, i) {
      // A completed stage stays drawn. That accumulation is the whole point:
      // arriving at ignition means holding a finished section, not a footer.
      var f = seg > i ? 1 : seg < i ? 0 : clamp01(segp);
      if (f === g.f) return;
      g.f = f;
      g.shapes.forEach(function (s) {
        s.el.style.strokeDashoffset = (s.len * (1 - f)).toFixed(2);
      });
      if (i === seg && f > 0.02) g.el.setAttribute('data-current', '');
      else g.el.removeAttribute('data-current');
    });
  }

  function set(el, prop, value) {
    if (last[prop] === value) return;
    last[prop] = value;
    el.style.setProperty(prop, value);
  }

  function frame() {
    var seg = Math.round(num('--sc-seg'));
    var segp = num('--sc-segp');
    if (!isFinite(seg) || seg < 0) seg = 0;
    if (seg > W.length - 1) seg = W.length - 1;
    var pr = clamp01((C[seg] + clamp01(segp) * W[seg]) / TOTAL);

    drawStages(seg, clamp01(segp));

    // Marker travels the axis, intake to exhaust, at overall track progress.
    var x = 24 + 1152 * pr;
    var mt = 'translate(' + x.toFixed(1) + ',0)';
    if (last.marker !== mt) { last.marker = mt; marker.setAttribute('transform', mt); }

    // The map goes where the camera goes. In on the Craft leg, out as the
    // ignition leg opens.
    var z = 0;
    if (!reduce) {
      if (pr >= 0.42) z = ramp(pr, 0.42, 0.52);
      if (pr > 0.60) z = 1 - ramp(pr, 0.60, 0.648);
      if (pr < 0.42) z = 0;
      z = clamp01(z);
    }
    var vb = VB_WIDE.map(function (v, i) { return lerp(v, VB_CORE[i], z).toFixed(1); }).join(' ');
    if (last.vb !== vb) { last.vb = vb; svg.setAttribute('viewBox', vb); }
    var zoomOn = z > 0.15 ? '1' : '0';
    if (last.zoom !== zoomOn) { last.zoom = zoomOn; rail.setAttribute('data-zoom', zoomOn); }

    var closeOn = pr >= 0.78 ? '1' : '0';
    if (last.close !== closeOn) { last.close = closeOn; rail.setAttribute('data-close', closeOn); }

    // A copy block that is not on screen must not be a tab stop. The engine
    // hands back pointer events above 0.5 opacity but leaves focusability
    // alone, so a keyboard user could otherwise land on the closing CTA from
    // the hero, on an element nobody can see.
    copies.forEach(function (c) {
      var on = parseFloat(c.el.style.opacity || '0') > 0.35;
      if (on === c.on) return;
      c.on = on;
      if (on) c.el.removeAttribute('inert');
      else c.el.setAttribute('inert', '');
    });

    scrims.forEach(function (s) {
      var o = windowOpacity(s.q, pr).toFixed(3);
      if (s.o === o) return;
      s.o = o;
      s.el.style.opacity = o;
    });

    if (!reduce) {
      // Three atmosphere planes at three rates, plus a small pointer response
      // on fine pointers. Additive: the composition is complete with all of it
      // stopped, which is what reduced motion gets.
      pmx += (mx - pmx) * 0.06;
      pmy += (my - pmy) * 0.06;
      var d = pr - 0.5;
      set(root, '--aev-haze-x', (d * -64 + pmx * 16).toFixed(1) + 'px');
      set(root, '--aev-haze-y', (d * 34 + pmy * 12).toFixed(1) + 'px');
      set(root, '--aev-shaft-x', (d * 128 + pmx * -26).toFixed(1) + 'px');
      set(root, '--aev-dust-x', (d * -186 + pmx * 40).toFixed(1) + 'px');
      set(root, '--aev-dust-y', (d * 58 + pmy * 28).toFixed(1) + 'px');
    }

    requestAnimationFrame(frame);
  }

  function jump(i) {
    var top = spacer.getBoundingClientRect().top + window.scrollY;
    var y = top + (C[i] + W[i] * 0.2) * window.innerHeight;
    window.scrollTo({ top: Math.round(y), behavior: reduce ? 'auto' : 'smooth' });
  }

  function relayout() { window.dispatchEvent(new Event('resize')); }

  // The close lives in a fixed layer, so an href="#commission" anchor jump has
  // nowhere to travel to. Send the page to the finale instead, then hand focus
  // to the action once it is actually on screen.
  function toCommission(e) {
    e.preventDefault();
    var top = spacer.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.round(top + 10.6 * window.innerHeight), behavior: reduce ? 'auto' : 'smooth' });
    var tries = 0;
    (function settle() {
      var cta = document.querySelector('.aev-cta--close');
      if (cta && !cta.closest('[inert]')) { cta.focus(); return; }
      if (++tries < 90) requestAnimationFrame(settle);
    })();
  }

  function mount() {
    root = document.documentElement;
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    rail = document.querySelector('.aev-rail');
    svg = rail.querySelector('.aev-rail__svg');
    marker = rail.querySelector('.aev-marker');
    spacer = document.querySelector('[data-sc-spacer]');
    if (!rail || !svg || !spacer) return;

    stages = Array.prototype.map.call(
      svg.querySelectorAll('.aev-stage'),
      function (el) { return { el: el, shapes: [], f: -1 }; }
    );

    scrims = Array.prototype.map.call(
      document.querySelectorAll('[data-aev-scrim]'),
      function (el) { return { el: el, q: parseWindow(el.getAttribute('data-aev-scrim')), o: null }; }
    );

    copies = Array.prototype.map.call(
      document.querySelectorAll('[data-sc-copy]'),
      function (el) { return { el: el, on: null }; }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll('a[href="#commission"], .aev-skip'),
      function (a) { a.addEventListener('click', toCommission); }
    );

    stops = Array.prototype.slice.call(rail.querySelectorAll('.aev-stops button'));
    stops.forEach(function (b) {
      b.addEventListener('click', function () { jump(+b.dataset.leg); });
    });
    function markStop(i) {
      stops.forEach(function (b) {
        b.setAttribute('aria-current', String(+b.dataset.leg === i));
      });
    }
    markStop(0);
    addEventListener('sc:waypoint', function (e) { markStop(e.detail.index); });

    measure();
    placeStops();
    addEventListener('resize', function () { measure(); placeStops(); });

    if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      addEventListener('pointermove', function (e) {
        mx = (e.clientX / innerWidth) * 2 - 1;
        my = (e.clientY / innerHeight) * 2 - 1;
      }, { passive: true });
    }

    requestAnimationFrame(frame);

    // The spacer is sized once at mount, and a zero innerHeight at that moment
    // silently produces a page with no scroll track. One resize re-measures it.
    addEventListener('load', relayout);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { relayout(); placeStops(); });
    }
  }

  return { mount: mount };
})();
