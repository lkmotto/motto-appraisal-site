/**
 * Motto Appraisal Service — Hero Canvas Engine v3
 * Pure vanilla Canvas 2D. Zero CDN dependencies. Always loads.
 *
 * Visualization: DFW property network
 * - Glowing node grid (property valuation points across DFW metro)
 * - Animated connecting lines with data pulses traveling along them
 * - Floating appraisal data labels ($PSF, values, DSCR ratios)
 * - Mouse parallax — entire scene responds to cursor
 * - Scroll parallax — scene shifts as page scrolls
 * - Breathing pulse on accent nodes
 */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;

  // ── Sizing ─────────────────────────────────────────────────────────
  function resize() {
    var hero = canvas.closest('.hero') || canvas.parentElement.parentElement;
    W = canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
    H = canvas.height = hero ? hero.offsetHeight : window.innerHeight;
  }

  // ── Mouse & scroll state ───────────────────────────────────────────
  var mx = 0, my = 0, scrollY = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    scrollY = window.pageYOffset;
  }, { passive: true });

  window.addEventListener('resize', function () {
    resize();
    buildNodes();
  }, { passive: true });

  // ── Colour helpers ─────────────────────────────────────────────────
  // Brand accent: #00A8E8 (0, 168, 232)   accent-2: #0066CC (0,102,204)
  function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
  var C1 = { r: 0,   g: 168, b: 232 };   // electric blue
  var C2 = { r: 0,   g: 102, b: 204 };   // deeper blue
  var CD = { r: 10,  g: 30,  b: 60  };   // dim navy

  // ── Nodes ──────────────────────────────────────────────────────────
  var nodes = [];
  var COLS = 10, ROWS = 6;
  var LINK_DIST;

  function buildNodes() {
    nodes = [];
    LINK_DIST = Math.min(W, H) * 0.28;

    var padX = W * 0.06, padY = H * 0.10;
    var cw = (W - padX * 2) / (COLS - 1);
    var ch = (H - padY * 2) / (ROWS - 1);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (Math.random() < 0.22) continue;   // sparse gaps

        var bx = padX + c * cw + (Math.random() - 0.5) * cw * 0.45;
        var by = padY + r * ch + (Math.random() - 0.5) * ch * 0.45;
        var accent = Math.random() < 0.15;     // 15% bright accent nodes

        nodes.push({
          bx: bx, by: by,          // base position
          x: bx,  y: by,           // current (with drift)
          r: accent ? 4 : 2.2,
          accent: accent,
          phase:  Math.random() * Math.PI * 2,
          pSpeed: 0.4 + Math.random() * 0.5,  // pulse speed
          dx: (Math.random() - 0.5) * 0.14,   // drift velocity
          dy: (Math.random() - 0.5) * 0.10,
        });
      }
    }

    buildPulses();
  }

  // ── Pulses (data packets travelling along edges) ───────────────────
  var pulses = [];

  function buildPulses() {
    pulses = [];
    // seed a handful of pulses
    for (var i = 0; i < 8; i++) spawnPulse(Math.random());
  }

  function spawnPulse(progress) {
    if (nodes.length < 2) return;
    var a = Math.floor(Math.random() * nodes.length);
    var b;
    do { b = Math.floor(Math.random() * nodes.length); } while (b === a);

    var dx = nodes[b].bx - nodes[a].bx;
    var dy = nodes[b].by - nodes[a].by;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > LINK_DIST * 1.1) { spawnPulse(0); return; }

    pulses.push({
      a: a, b: b,
      t: progress || 0,
      speed: 0.003 + Math.random() * 0.004,
      bright: Math.random() < 0.3,
    });
  }

  // ── Floating labels ────────────────────────────────────────────────
  var LABELS = [
    '$218/sqft','$2.1M','CAP 6.2%','$187/sqft','LTV 75%',
    '$340K','NOI $42K','DSCR 1.28','$224/sqft','ARV $410K',
    '$195/sqft','GRM 12.1','$875K','7.5% off','DSCR 1.31',
    '$251K','REO —14%','$312/sqft','$596K','CAP 5.8%'
  ];

  var floaters = [];

  function spawnFloater() {
    var txt = LABELS[Math.floor(Math.random() * LABELS.length)];
    var side = Math.random();
    var x, y, vx, vy;
    if (side < 0.5) {
      x  = Math.random() * W;
      y  = H + 10;
      vx = (Math.random() - 0.5) * 0.2;
      vy = -(0.25 + Math.random() * 0.3);
    } else {
      x  = Math.random() < 0.5 ? -80 : W + 80;
      y  = Math.random() * H;
      vx = x < 0 ? (0.2 + Math.random() * 0.2) : -(0.2 + Math.random() * 0.2);
      vy = (Math.random() - 0.5) * 0.15;
    }
    floaters.push({ txt: txt, x: x, y: y, vx: vx, vy: vy, op: 0, maxOp: 0.18 + Math.random() * 0.14, sz: 10 + Math.random() * 4 });
  }

  for (var fi = 0; fi < 10; fi++) {
    spawnFloater();
    floaters[fi].y = Math.random() * H;
    floaters[fi].op = floaters[fi].maxOp * Math.random();
  }

  var floatTimer = 0;

  // ── Main animation loop ────────────────────────────────────────────
  var t = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    requestAnimationFrame(draw);
    if (!W) return;

    t += 0.016;
    floatTimer += 0.016;

    ctx.clearRect(0, 0, W, H);

    // Parallax offset — scene shifts toward mouse + drifts on scroll
    var px = ((mx / (window.innerWidth  || 1)) - 0.5) * 22;
    var py = ((my / (window.innerHeight || 1)) - 0.5) * 12;
    var sy = scrollY * 0.06;   // scroll-driven vertical shift

    ctx.save();
    ctx.translate(px, py - sy);

    // ── Drift nodes ────────────────────────────────────────────────
    if (!reduceMotion) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.dx;
        n.y += n.dy;
        // soft boundary
        var pad = 50;
        if (n.x < -pad || n.x > W + pad) n.dx *= -1;
        if (n.y < -pad || n.y > H + pad) n.dy *= -1;
      }
    }

    // ── Draw edges ─────────────────────────────────────────────────
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var na = nodes[a], nb = nodes[b];
        var dx = na.x - nb.x, dy = na.y - nb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > LINK_DIST) continue;

        // Opacity: stronger when nodes closer + mouse proximity boost
        var edgeOp = (1 - dist / LINK_DIST) * 0.22;
        // Mouse proximity boost
        var emx = (na.x + nb.x) / 2, emy = (na.y + nb.y) / 2;
        var mdist = Math.sqrt(Math.pow(emx + px - mx, 2) + Math.pow(emy + py - my, 2));
        if (mdist < 220) edgeOp += (1 - mdist / 220) * 0.35;
        edgeOp = Math.min(edgeOp, 0.55);

        var col = (na.accent || nb.accent) ? C1 : C2;
        var g = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        g.addColorStop(0,   rgba(col.r, col.g, col.b, edgeOp));
        g.addColorStop(0.5, rgba(CD.r,  CD.g,  CD.b,  edgeOp * 0.4));
        g.addColorStop(1,   rgba(col.r, col.g, col.b, edgeOp));

        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = (na.accent || nb.accent) ? 1.0 : 0.6;
        ctx.stroke();
      }
    }

    // ── Draw pulses ────────────────────────────────────────────────
    for (var pi = pulses.length - 1; pi >= 0; pi--) {
      var p = pulses[pi];
      p.t += p.speed;
      if (p.t >= 1) {
        pulses.splice(pi, 1);
        if (pulses.length < 12) spawnPulse(0);
        continue;
      }
      var na2 = nodes[p.a], nb2 = nodes[p.b];
      if (!na2 || !nb2) { pulses.splice(pi, 1); continue; }

      var px2 = na2.x + (nb2.x - na2.x) * p.t;
      var py2 = na2.y + (nb2.y - na2.y) * p.t;

      // Tail glow
      var tailOp = p.bright ? 0.7 : 0.45;
      var grd = ctx.createRadialGradient(px2, py2, 0, px2, py2, p.bright ? 10 : 6);
      grd.addColorStop(0, rgba(C1.r, C1.g, C1.b, tailOp));
      grd.addColorStop(1, rgba(C1.r, C1.g, C1.b, 0));
      ctx.beginPath();
      ctx.arc(px2, py2, p.bright ? 10 : 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(px2, py2, p.bright ? 3 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = rgba(C1.r, C1.g, C1.b, 1);
      ctx.fill();
    }

    // ── Draw nodes ─────────────────────────────────────────────────
    for (var ni = 0; ni < nodes.length; ni++) {
      var n2 = nodes[ni];
      var pulse = Math.sin(t * n2.pSpeed + n2.phase);
      var r = n2.r + (n2.accent ? pulse * 1.8 : pulse * 0.7);

      // Check mouse proximity for hover glow
      var nodeMdist = Math.sqrt(Math.pow(n2.x + px - mx, 2) + Math.pow(n2.y + py - my, 2));
      var hoverBoost = nodeMdist < 100 ? (1 - nodeMdist / 100) : 0;

      if (n2.accent) {
        // Outer halo
        var halo = ctx.createRadialGradient(n2.x, n2.y, 0, n2.x, n2.y, r * 5 + hoverBoost * 20);
        halo.addColorStop(0, rgba(C1.r, C1.g, C1.b, 0.22 + hoverBoost * 0.2));
        halo.addColorStop(1, rgba(C1.r, C1.g, C1.b, 0));
        ctx.beginPath();
        ctx.arc(n2.x, n2.y, r * 5 + hoverBoost * 20, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Mid ring
        var ring = ctx.createRadialGradient(n2.x, n2.y, 0, n2.x, n2.y, r * 2.5);
        ring.addColorStop(0, rgba(C1.r, C1.g, C1.b, 0.55 + hoverBoost * 0.3));
        ring.addColorStop(1, rgba(C1.r, C1.g, C1.b, 0.05));
        ctx.beginPath();
        ctx.arc(n2.x, n2.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = ring;
        ctx.fill();
      } else if (hoverBoost > 0) {
        // Regular node hover glow
        var hov = ctx.createRadialGradient(n2.x, n2.y, 0, n2.x, n2.y, r * 4);
        hov.addColorStop(0, rgba(C2.r, C2.g, C2.b, hoverBoost * 0.3));
        hov.addColorStop(1, rgba(C2.r, C2.g, C2.b, 0));
        ctx.beginPath();
        ctx.arc(n2.x, n2.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = hov;
        ctx.fill();
      }

      // Core dot
      var coreOp = n2.accent ? (0.82 + pulse * 0.18) : (0.55 + pulse * 0.12 + hoverBoost * 0.3);
      ctx.beginPath();
      ctx.arc(n2.x, n2.y, Math.max(r, 1), 0, Math.PI * 2);
      ctx.fillStyle = n2.accent
        ? rgba(C1.r, C1.g, C1.b, coreOp)
        : rgba(C2.r, C2.g, C2.b, coreOp);
      ctx.fill();
    }

    ctx.restore();   // undo parallax translate for floaters

    // ── Floating data labels ───────────────────────────────────────
    if (floatTimer > 3.5 && floaters.length < 16) { spawnFloater(); floatTimer = 0; }

    ctx.font = '500 11px "Geist", "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    for (var li = floaters.length - 1; li >= 0; li--) {
      var fl = floaters[li];
      if (!reduceMotion) { fl.x += fl.vx; fl.y += fl.vy; }

      // Fade in when entering, fade out when leaving
      var inView = fl.x > -100 && fl.x < W + 100 && fl.y > -30 && fl.y < H + 30;
      if (inView && fl.op < fl.maxOp) fl.op = Math.min(fl.op + 0.003, fl.maxOp);
      else if (!inView) fl.op -= 0.008;

      if (fl.op <= 0) { floaters.splice(li, 1); continue; }

      ctx.fillStyle = rgba(C1.r, C1.g, C1.b, fl.op);
      ctx.fillText(fl.txt, fl.x, fl.y);
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────
  resize();
  buildNodes();
  draw();

})();
