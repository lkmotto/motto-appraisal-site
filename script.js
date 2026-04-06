/**
 * Motto Appraisal Service — Parallax + Animation Engine
 * Zero dependencies. Vanilla JS.
 * Handles:
 * - Parallax scroll effects (hero bg, section elements)
 * - Logo SVG stroke draw animation
 * - Counter animations (count-up on scroll)
 * - Scroll-triggered reveal animations (Intersection Observer)
 * - Mobile navigation toggle
 * - Navbar scroll state
 * - AVM bar chart animation
 * - Dynamic year in footer
 */

(function () {
  'use strict';

  /* ── PARALLAX SCROLL HANDLER ──────────────────────── */

  const heroBg = document.querySelector('.hero-bg');
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function updateParallax() {
    const scrolled = window.pageYOffset;

    // Hero background moves at 40% scroll speed
    if (heroBg) {
      heroBg.style.transform = 'translateY(' + (scrolled * 0.4) + 'px)';
    }

    // Any element with data-parallax attribute
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    parallaxEls.forEach(function (el) {
      const rate = parseFloat(el.dataset.parallax) || 0.2;
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = (rect.top + scrolled) * rate;
        el.style.transform = 'translateY(' + (offset * 0.1) + 'px)';
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });


  /* ── SCROLL-TRIGGERED REVEAL ANIMATIONS ────────────── */

  const revealElements = document.querySelectorAll(
    '.reveal-el, .slide-in-right, .fade-in, .fade-in-left, .fade-in-right'
  );

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }


  /* ── COUNTER ANIMATIONS ────────────────────────────── */

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.floor(current).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure final value is exact
        if (isDecimal) {
          el.textContent = target.toFixed(1) + suffix;
        } else {
          el.textContent = target.toLocaleString() + suffix;
        }
      }
    }

    requestAnimationFrame(update);
  }

  // Observe counters for scroll trigger
  const counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  // Counter in hero title (the 2,000+ inline)
  const inlineCounters = document.querySelectorAll('.counter-inline');
  if ('IntersectionObserver' in window && inlineCounters.length) {
    const inlineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const duration = 1500;
            const startTime = performance.now();

            function update(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(eased * target);
              el.textContent = current.toLocaleString() + suffix;

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                el.textContent = target.toLocaleString() + suffix;
              }
            }

            requestAnimationFrame(update);
            inlineObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    inlineCounters.forEach(function (el) {
      inlineObserver.observe(el);
    });
  }


  /* ── AVM BAR ANIMATION ─────────────────────────────── */

  const avmSection = document.querySelector('.avm-section');
  if (avmSection && 'IntersectionObserver' in window) {
    const barObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            avmSection.classList.add('bars-animated');
            barObserver.unobserve(avmSection);
          }
        });
      },
      { threshold: 0.3 }
    );
    barObserver.observe(avmSection);
  }


  /* ── MOBILE NAVIGATION ─────────────────────────────── */

  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }


  /* ── NAVBAR SCROLL STATE ───────────────────────────── */

  const nav = document.querySelector('.nav');

  if (nav) {
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 50) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      },
      { passive: true }
    );
  }


  /* ── DYNAMIC YEAR ──────────────────────────────────── */

  var yearElements = document.querySelectorAll('#year');
  var currentYear = new Date().getFullYear();
  yearElements.forEach(function (el) {
    el.textContent = currentYear;
  });


  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ────────────────── */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ── THREE.JS HERO PARTICLES ─────────────────────────── */

  function initHeroParticles() {
    if (window.innerWidth < 768) return; // Skip on mobile

    var canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Create particles
    var geometry = new THREE.BufferGeometry();
    var count = 120;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      color: 0x00A0DE,
      size: 0.06,
      transparent: true,
      opacity: 0.3,
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 8;

    var animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      particles.rotation.x += 0.0003;
      particles.rotation.y += 0.0005;
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', function () {
      if (window.innerWidth < 768) {
        cancelAnimationFrame(animId);
        renderer.domElement.style.display = 'none';
        return;
      }
      renderer.domElement.style.display = '';
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    });

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(animId);
    }
  }

  // Initialize particles after DOM is ready
  initHeroParticles();

})();
