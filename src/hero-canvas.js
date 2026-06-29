/**
 * Motto Appraisal Service — Hero Canvas v4
 * Completely self-sizing. Zero CDN. Zero parent-height dependency.
 * Mounts directly on window dimensions.
 */
(function () {
  'use strict';

  /* ── Find or create the canvas ─────────────────────────────────── */
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');

  /* ── Always size to the hero section or full viewport ──────────── */
  function getHero() {
    return document.getElementById('hero') || document.querySelector('.hero') || document.body;
  }

  function resize() {
    var hero = getHero();
    var W = hero.offsetWidth  || window.innerWidth;
    var H = hero.offsetHeight || window.innerHeight;
    // Fallback to viewport if element gives 0
    if (W < 10) W = window.innerWidth;
    if (H < 10) H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    return { W: W, H: H };
  }

  /* ── State ─────────────────────────────────────────────────────── */
  var dims    = resize();
  var W = dims.W, H = dims.H;
  var mouseX  = W * 0.5;
  var mouseY  = H * 0.5;
  var scrollY = 0;
  var nodes   = [];
  var pulses  = [];
  var floaters = [];
  var floatTimer = 0;
  var t       = 0;
  var LINK_DIST;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Colours ────────────────────────────────────────────────────── */
  // Electric blue #00A8E8 → rgb(0, 168, 232)
  // Deep blue    #0066CC → rgb(0, 102, 204)
  var A1r = 0,  A1g = 168, A1b = 232;   // accent 1 — electric blue
  var A2r = 0,  A2g = 120, A2b = 255;   // accent 2 — vivid blue
  function c(r, g, b, a) { return 'rgba('+r+','+g+','+b+','+a+')'; }

  /* ── Node builder ───────────────────────────────────────────────── */
  function buildNodes() {
    nodes  = [];
    pulses = [];
    LINK_DIST = Math.min(W, H) * 0.30;

    var COLS = 11, ROWS = 7;
    var padX = W * 0.04, padY = H * 0.08;
    var cw = (W - padX * 2) / (COLS - 1);
    var ch = (H - padY * 2) / (ROWS - 1);

    for (var r = 0; r < ROWS; r++) {
      for (var cc = 0; cc < COLS; cc++) {
        if (Math.random() < 0.20) continue;
        var bx = padX + cc * cw + (Math.random() - 0.5) * cw * 0.5;
        var by = padY + r  * ch + (Math.random() - 0.5) * ch * 0.5;
        var accent = Math.random() < 0.18;
        nodes.push({
          x: bx, y: by, bx: bx, by: by,
          r: accent ? 5 : 2.5,
          accent: accent,
          phase: Math.random() * Math.PI * 2,
          pSpeed: 0.5 + Math.random() * 0.7,
          dx: (Math.random() - 0.5) * 0.16,
          dy: (Math.random() - 0.5) * 0.10,
        });
      }
    }

    // seed pulses
    for (var i = 0; i < 10; i++) spawnPulse(Math.random());
  }

  /* ── Pulse spawner ──────────────────────────────────────────────── */
  function spawnPulse(startT) {
    if (nodes.length < 2) return;
    var tries = 0;
    while (tries++ < 10) {
      var a = (Math.random() * nodes.length) | 0;
      var b = (Math.random() * nodes.length) | 0;
      if (a === b) continue;
      var dx = nodes[b].bx - nodes[a].bx, dy = nodes[b].by - nodes[a].by;
      if (Math.sqrt(dx*dx+dy*dy) < LINK_DIST * 1.1) {
        pulses.push({ a: a, b: b, t: startT || 0, speed: 0.004 + Math.random()*0.005, bright: Math.random()<0.3 });
        return;
      }
    }
  }

  /* ── Floater spawner ────────────────────────────────────────────── */
  var LABELS = [
    '$218/sqft','$2.1M','CAP 6.2%','DSCR 1.28','LTV 75%',
    '$340K','NOI $42K','$224/sqft','ARV $410K','$195/sqft',
    'GRM 12.1','7.5% off','$251K','DSCR 1.31','$596K',
    'CAP 5.8%','$312/sqft','$875K'
  ];
  function spawnFloater() {
    var txt = LABELS[(Math.random() * LABELS.length) | 0];
    var fromBottom = Math.random() < 0.6;
    floaters.push({
      txt: txt,
      x: fromBottom ? Math.random() * W : (Math.random() < 0.5 ? -60 : W + 60),
      y: fromBottom ? H + 12 : Math.random() * H,
      vx: fromBottom ? (Math.random()-0.5)*0.22 : (Math.random()<0.5 ? 0.25 : -0.25),
      vy: fromBottom ? -(0.28 + Math.random()*0.32) : (Math.random()-0.5)*0.12,
      op: 0,
      maxOp: 0.38 + Math.random() * 0.22,   // much brighter than before
      sz: 11 + Math.random() * 4,
    });
  }

  // seed floaters mid-screen so they're visible on load
  for (var fi = 0; fi < 12; fi++) {
    spawnFloater();
    floaters[fi].y = H * 0.1 + Math.random() * H * 0.8;
    floaters[fi].op = floaters[fi].maxOp * (0.3 + Math.random() * 0.7);
  }

  /* ── Main draw loop ─────────────────────────────────────────────── */
  function draw() {
    requestAnimationFrame(draw);
    t += 0.016;
    floatTimer += 0.016;

    ctx.clearRect(0, 0, W, H);

    // Parallax offset
    var px = ((mouseX / W) - 0.5) * 28;
    var py = ((mouseY / H) - 0.5) * 14;
    var sy = scrollY * 0.05;

    ctx.save();
    ctx.translate(px, py - sy);

    /* Drift nodes */
    if (!reduceMotion) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.dx; n.y += n.dy;
        if (n.x < -60 || n.x > W+60) n.dx *= -1;
        if (n.y < -60 || n.y > H+60) n.dy *= -1;
      }
    }

    /* ── Edges ─────────────────────────────────────────────────── */
    for (var a = 0; a < nodes.length; a++) {
      var na = nodes[a];
      for (var b = a+1; b < nodes.length; b++) {
        var nb = nodes[b];
        var ddx = na.x-nb.x, ddy = na.y-nb.y;
        var dist = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dist > LINK_DIST) continue;

        var baseOp = (1 - dist/LINK_DIST) * 0.30;

        // Mouse proximity boost
        var emx = (na.x+nb.x)/2, emy = (na.y+nb.y)/2;
        var md  = Math.sqrt(Math.pow(emx+px-mouseX,2)+Math.pow(emy+py-mouseY,2));
        if (md < 250) baseOp += (1-md/250)*0.45;
        baseOp = Math.min(baseOp, 0.70);

        var col = (na.accent||nb.accent) ? A1r : A2r;
        var colg = (na.accent||nb.accent) ? A1g : A2g;
        var colb = (na.accent||nb.accent) ? A1b : A2b;

        var g = ctx.createLinearGradient(na.x,na.y,nb.x,nb.y);
        g.addColorStop(0,   c(col,colg,colb, baseOp));
        g.addColorStop(0.5, c(col,colg,colb, baseOp*0.35));
        g.addColorStop(1,   c(col,colg,colb, baseOp));
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = (na.accent||nb.accent) ? 1.2 : 0.7;
        ctx.stroke();
      }
    }

    /* ── Pulses ────────────────────────────────────────────────── */
    for (var pi = pulses.length-1; pi >= 0; pi--) {
      var p = pulses[pi];
      p.t += p.speed;
      if (p.t >= 1) {
        pulses.splice(pi,1);
        if (pulses.length < 14) spawnPulse(0);
        continue;
      }
      var na2 = nodes[p.a], nb2 = nodes[p.b];
      if (!na2||!nb2) { pulses.splice(pi,1); continue; }
      var ppx = na2.x + (nb2.x-na2.x)*p.t;
      var ppy = na2.y + (nb2.y-na2.y)*p.t;
      var radi = p.bright ? 12 : 7;
      var opC  = p.bright ? 0.85 : 0.55;

      var grd = ctx.createRadialGradient(ppx,ppy,0,ppx,ppy,radi);
      grd.addColorStop(0, c(A1r,A1g,A1b, opC));
      grd.addColorStop(1, c(A1r,A1g,A1b, 0));
      ctx.beginPath();
      ctx.arc(ppx,ppy,radi,0,Math.PI*2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ppx,ppy, p.bright?3.5:2,0,Math.PI*2);
      ctx.fillStyle = c(255,255,255,0.95);
      ctx.fill();
    }

    /* ── Nodes ─────────────────────────────────────────────────── */
    for (var ni = 0; ni < nodes.length; ni++) {
      var n2 = nodes[ni];
      var pulse = Math.sin(t*n2.pSpeed+n2.phase);
      var r2 = n2.r + (n2.accent ? pulse*2.2 : pulse*0.9);

      var ndx = n2.x+px-mouseX, ndy = n2.y+py-mouseY;
      var hDist = Math.sqrt(ndx*ndx+ndy*ndy);
      var hBoost = hDist < 120 ? (1-hDist/120) : 0;

      if (n2.accent) {
        /* outer glow ring */
        var gr1 = ctx.createRadialGradient(n2.x,n2.y,0,n2.x,n2.y,r2*6+hBoost*24);
        gr1.addColorStop(0, c(A1r,A1g,A1b, 0.30+hBoost*0.25));
        gr1.addColorStop(1, c(A1r,A1g,A1b, 0));
        ctx.beginPath(); ctx.arc(n2.x,n2.y,r2*6+hBoost*24,0,Math.PI*2);
        ctx.fillStyle = gr1; ctx.fill();

        /* mid ring */
        var gr2 = ctx.createRadialGradient(n2.x,n2.y,0,n2.x,n2.y,r2*2.8);
        gr2.addColorStop(0, c(A1r,A1g,A1b, 0.65+hBoost*0.3));
        gr2.addColorStop(1, c(A1r,A1g,A1b, 0.04));
        ctx.beginPath(); ctx.arc(n2.x,n2.y,r2*2.8,0,Math.PI*2);
        ctx.fillStyle = gr2; ctx.fill();
      } else if (hBoost > 0) {
        var grH = ctx.createRadialGradient(n2.x,n2.y,0,n2.x,n2.y,r2*4);
        grH.addColorStop(0, c(A2r,A2g,A2b, hBoost*0.40));
        grH.addColorStop(1, c(A2r,A2g,A2b, 0));
        ctx.beginPath(); ctx.arc(n2.x,n2.y,r2*4,0,Math.PI*2);
        ctx.fillStyle = grH; ctx.fill();
      }

      /* core dot */
      var cOp = n2.accent ? (0.90+pulse*0.10) : (0.60+pulse*0.15+hBoost*0.30);
      ctx.beginPath();
      ctx.arc(n2.x, n2.y, Math.max(r2,0.5), 0, Math.PI*2);
      ctx.fillStyle = n2.accent ? c(A1r,A1g,A1b,cOp) : c(A2r,A2g,A2b,cOp);
      ctx.fill();
    }

    ctx.restore();  // end parallax translate

    /* ── Floaters (no parallax — they float freely) ────────────── */
    if (floatTimer > 3.0 && floaters.length < 18) { spawnFloater(); floatTimer = 0; }

    ctx.font = '600 12px "Geist","JetBrains Mono",monospace';
    ctx.textBaseline = 'middle';

    for (var li = floaters.length-1; li >= 0; li--) {
      var fl = floaters[li];
      if (!reduceMotion) { fl.x += fl.vx; fl.y += fl.vy; }

      var inV = fl.x>-100 && fl.x<W+100 && fl.y>-30 && fl.y<H+30;
      if (inV  && fl.op < fl.maxOp) fl.op = Math.min(fl.op+0.006, fl.maxOp);
      if (!inV) fl.op -= 0.012;
      if (fl.op <= 0) { floaters.splice(li,1); continue; }

      ctx.fillStyle = c(A1r,A1g,A1b, fl.op);
      ctx.fillText(fl.txt, fl.x, fl.y);
    }
  }

  /* ── Event listeners ────────────────────────────────────────────── */
  window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX; mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('scroll', function() {
    scrollY = window.pageYOffset;
  }, { passive: true });

  window.addEventListener('resize', function() {
    W = canvas.width  = getHero().offsetWidth  || window.innerWidth;
    H = canvas.height = getHero().offsetHeight || window.innerHeight;
    if (W<10) W = window.innerWidth;
    if (H<10) H = window.innerHeight;
    buildNodes();
  }, { passive: true });

  /* ── Bootstrap ──────────────────────────────────────────────────── */
  buildNodes();
  draw();

})();
