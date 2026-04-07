/**
 * Motto Appraisal — Hero Canvas Background
 * Pure vanilla 2D canvas. No CDN dependencies.
 * 
 * What it renders:
 * - DFW-inspired node network (lat/lon grid approximating DFW metro intersections)
 * - Glowing pulsing nodes (property valuation points)
 * - Animated connection lines with opacity based on mouse proximity
 * - Floating data fragments (appraisal numbers: $/sqft, cap rates)
 * - Scroll-driven parallax depth shift
 * - Mouse parallax — geometry tilts toward cursor
 */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var hero = document.querySelector('.hero');
  var ctx = canvas.getContext('2d');

  // Sizing
  function resize() {
    var rect = (hero || canvas.parentElement).getBoundingClientRect();
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', function () { resize(); rebuildNodes(); }, { passive: true });

  // Mouse state
  var mouse = { x: canvas.width / 2, y: canvas.height / 2, active: false };
  (hero || document).addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }, { passive: true });
  document.addEventListener('mouseleave', function () { mouse.active = false; });

  // Scroll state
  var scrollY = 0;
  window.addEventListener('scroll', function () { scrollY = window.pageYOffset; }, { passive: true });

  // Color palette — brand blues
  var ACCENT  = 'rgba(0, 168, 232,';   // --accent
  var ACCENT2 = 'rgba(0, 102, 204,';   // --accent-2
  var DIM     = 'rgba(20, 50, 80,';

  // ── NODES ──────────────────────────────────────────────────────────
  // Approximate DFW metro grid — 7×5 sparse grid with jitter
  var nodes = [];
  var LINK_DIST = 160;

  function rebuildNodes() {
    nodes = [];
    var cols = 11, rows = 7;
    var W = canvas.width, H = canvas.height;
    var padX = W * 0.05, padY = H * 0.08;
    var cellW = (W - padX * 2) / (cols - 1);
    var cellH = (H - padY * 2) / (rows - 1);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // Skip ~30% for irregular DFW-map feel
        if (Math.random() < 0.28) continue;
        var bx = padX + c * cellW;
        var by = padY + r * cellH;
        // Jitter
        var jx = (Math.random() - 0.5) * cellW * 0.55;
        var jy = (Math.random() - 0.5) * cellH * 0.55;
        nodes.push({
          x: bx + jx,
          y: by + jy,
          baseX: bx + jx,
          baseY: by + jy,
          r: 1.5 + Math.random() * 2.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.6,
          bright: Math.random() > 0.82,  // accent nodes
          drift: { x: (Math.random() - 0.5) * 0.18, y: (Math.random() - 0.5) * 0.12 }
        });
      }
    }
  }
  rebuildNodes();

  // ── FLOATING DATA FRAGMENTS ────────────────────────────────────────
  var fragments = [];
  var FRAGMENT_POOL = [
    '$218/sqft', '$2.1M', 'CAP 6.2%', '$187/sqft', 'LTV 75%',
    '$340k', 'NOI $42k', 'DSCR 1.28', '$224/sqft', '$875k',
    'GRM 12.4', '$195/sqft', 'ARV $410k'
  ];

  function spawnFragment() {
    var i = Math.floor(Math.random() * FRAGMENT_POOL.length);
    fragments.push({
      text: FRAGMENT_POOL[i],
      x: Math.random() * canvas.width,
      y: canvas.height + 20,
      vy: -(0.18 + Math.random() * 0.22),
      opacity: 0,
      maxOpacity: 0.09 + Math.random() * 0.08,
      size: 9 + Math.random() * 5
    });
  }

  // Seed initial fragments
  for (var fi = 0; fi < 6; fi++) {
    spawnFragment();
    fragments[fi].y = Math.random() * canvas.height;
    fragments[fi].opacity = fragments[fi].maxOpacity * Math.random();
  }

  var fragTimer = 0;

  // ── ANIMATION LOOP ─────────────────────────────────────────────────
  var t = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    requestAnimationFrame(draw);
    t += 0.016;
    fragTimer += 0.016;

    var W = canvas.width, H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Parallax shift based on mouse + scroll
    var parallaxX = mouse.active ? (mouse.x / W - 0.5) * 18 : 0;
    var parallaxY = mouse.active ? (mouse.y / H - 0.5) * 10 : 0;
    var scrollShift = (scrollY * 0.08) % H;

    // ── Update + Draw connection lines ──────────────────────────────
    for (var a = 0; a < nodes.length; a++) {
      var na = nodes[a];
      for (var b = a + 1; b < nodes.length; b++) {
        var nb = nodes[b];
        var dx = na.x - nb.x;
        var dy = na.y - nb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > LINK_DIST) continue;

        // Opacity falloff by distance
        var baseOp = (1 - dist / LINK_DIST) * 0.14;

        // Brighten lines near mouse
        var mx = (na.x + nb.x) / 2 + parallaxX;
        var my = (na.y + nb.y) / 2 + parallaxY;
        var mdist = Math.sqrt(Math.pow(mx - mouse.x, 2) + Math.pow(my - mouse.y, 2));
        var mouseFactor = mouse.active ? Math.max(0, 1 - mdist / 200) * 0.25 : 0;

        var op = Math.min(baseOp + mouseFactor, 0.42);

        var ax = na.x + parallaxX;
        var ay = na.y + parallaxY - scrollShift * 0.15;
        var bx = nb.x + parallaxX;
        var by = nb.y + parallaxY - scrollShift * 0.15;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);

        // Gradient line — brighter at nodes
        var grad = ctx.createLinearGradient(ax, ay, bx, by);
        var c1 = (na.bright || nb.bright) ? ACCENT : ACCENT2;
        grad.addColorStop(0, c1 + op + ')');
        grad.addColorStop(0.5, DIM + (op * 0.6) + ')');
        grad.addColorStop(1, c1 + op + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = na.bright || nb.bright ? 0.8 : 0.5;
        ctx.stroke();
      }
    }

    // ── Update + Draw nodes ─────────────────────────────────────────
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      if (!reduceMotion) {
        // Gentle drift
        n.x += n.drift.x;
        n.y += n.drift.y;
        // Bounce at edges
        var pad = 40;
        if (n.x < pad || n.x > W - pad) n.drift.x *= -1;
        if (n.y < pad || n.y > H - pad) n.drift.y *= -1;
      }

      var nx = n.x + parallaxX;
      var ny = n.y + parallaxY - scrollShift * 0.15;

      // Pulse
      var pulse = Math.sin(t * n.speed + n.phase);
      var r = n.r + pulse * 1.2;
      var coreOpacity = n.bright ? 0.85 + pulse * 0.15 : 0.45 + pulse * 0.15;

      // Glow ring
      if (n.bright) {
        var grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 5);
        grd.addColorStop(0, ACCENT + '0.18)');
        grd.addColorStop(1, ACCENT + '0)');
        ctx.beginPath();
        ctx.arc(nx, ny, r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = n.bright
        ? ACCENT + coreOpacity + ')'
        : ACCENT2 + coreOpacity + ')';
      ctx.fill();
    }

    // ── Data fragments ──────────────────────────────────────────────
    if (fragTimer > 4.5 && fragments.length < 12) {
      spawnFragment();
      fragTimer = 0;
    }

    ctx.font = '11px "JetBrains Mono", "Courier New", monospace';
    ctx.textBaseline = 'middle';

    for (var fi2 = fragments.length - 1; fi2 >= 0; fi2--) {
      var fr = fragments[fi2];
      fr.y += fr.vy;
      // Fade in/out
      if (fr.y > H * 0.7) {
        fr.opacity = Math.min(fr.opacity + 0.004, fr.maxOpacity);
      } else if (fr.y < H * 0.2) {
        fr.opacity -= 0.006;
      }
      if (fr.opacity <= 0 || fr.y < -30) {
        fragments.splice(fi2, 1);
        continue;
      }
      ctx.fillStyle = ACCENT + fr.opacity + ')';
      ctx.fillText(fr.text, fr.x + parallaxX * 0.5, fr.y + parallaxY * 0.3);
    }
  }

  draw();

})();
