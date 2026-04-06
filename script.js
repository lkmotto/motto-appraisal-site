/**
 * Motto Appraisal Service — Site JavaScript
 * Minimal, no dependencies. Handles:
 * - Scroll-triggered fade-in animations (Intersection Observer)
 * - Mobile navigation toggle
 * - Navbar scroll state
 * - Dynamic year in footer
 * - Recent posts rendering (JSON)
 */

(function () {
  'use strict';

  /* ── SCROLL ANIMATIONS ────────────────────────────── */

  const animatedElements = document.querySelectorAll(
    '.fade-in, .fade-in-left, .fade-in-right'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    animatedElements.forEach((el) => el.classList.add('visible'));
  }


  /* ── MOBILE NAVIGATION ────────────────────────────── */

  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }


  /* ── NAVBAR SCROLL STATE ──────────────────────────── */

  const nav = document.querySelector('.nav');

  if (nav) {
    let lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener(
      'scroll',
      () => {
        const currentScroll = window.scrollY;

        if (currentScroll > scrollThreshold) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
      },
      { passive: true }
    );
  }


  /* ── DYNAMIC YEAR ─────────────────────────────────── */

  const yearElements = document.querySelectorAll('#year');
  const currentYear = new Date().getFullYear();
  yearElements.forEach((el) => {
    el.textContent = currentYear;
  });


  /* ── RECENT POSTS (Home Page) ─────────────────────── */

  const postsContainer = document.getElementById('recent-posts');

  if (postsContainer) {
    const posts = [
      {
        date: 'January 2025',
        title: 'Why Your Zestimate Dropped $15K Overnight (And Why It Doesn\'t Matter)',
        excerpt:
          'AVMs recalibrate constantly. A sudden Zestimate drop doesn\'t mean your house lost value — it means the algorithm got new data. Here\'s what actually happened.',
        link: '#',
      },
      {
        date: 'December 2024',
        title: 'DFW Year-End Market Recap: What the Numbers Actually Say',
        excerpt:
          'Median prices, inventory levels, and days on market — a data-driven breakdown of 2024 in DFW residential real estate.',
        link: '#',
      },
      {
        date: 'December 2024',
        title: 'The DSCR Appraisal: What Investors Need to Know Before Ordering',
        excerpt:
          'DSCR loans require a specific type of appraisal with rent surveys and income analysis. Here\'s what to expect and how to avoid delays.',
        link: '#',
      },
    ];

    const postsHTML = posts
      .map(
        (post, i) => `
      <article class="post-card fade-in stagger-${i + 1}">
        <div class="post-card__date">${post.date}</div>
        <h3 class="post-card__title">${post.title}</h3>
        <p class="post-card__excerpt">${post.excerpt}</p>
        <a href="${post.link}" class="post-card__link">
          Read more
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </a>
      </article>
    `
      )
      .join('');

    postsContainer.innerHTML = postsHTML;

    // Re-observe dynamically added elements
    if ('IntersectionObserver' in window) {
      const newElements = postsContainer.querySelectorAll('.fade-in');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px',
        }
      );
      newElements.forEach((el) => observer.observe(el));
    }
  }


  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ───────────────── */

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
