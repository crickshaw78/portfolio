/* Christopher Renshaw — Portfolio interactions
 * - Scroll-spy active nav (IntersectionObserver) + URL hash sync
 * - Smooth anchor scrolling
 * - Reveal-on-scroll
 * - Mobile sidebar toggle
 * - Project image slider (prev/next/dots/keyboard/swipe)
 * - Auto copyright year
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {

    // Copyright year
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ----- Mobile sidebar toggle -----
    const sidebar = $('#sidebar');
    const toggle = $('#navToggle');
    const closeSidebar = () => {
      sidebar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };
    const openSidebar = () => {
      sidebar.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
    };
    toggle?.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });
    $$('.nav__link, .sidebar__actions a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 860) closeSidebar();
      });
    });
    document.addEventListener('click', (e) => {
      if (window.innerWidth > 860) return;
      if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeSidebar();
    });

    // ----- Scroll-spy + URL hash sync -----
    const links = $$('.nav__link');
    const sections = links
      .map(a => document.getElementById(a.dataset.nav))
      .filter(Boolean);

    const updateHash = (id) => {
      if (!id) return;
      const newHash = `#${id}`;
      if (location.hash === newHash) return;
      // history.replaceState is reliable even under file:// for hash-only URLs
      try {
        history.replaceState(null, '', newHash);
      } catch (_) {
        // Fallback: assign to location.hash (may push a history entry)
        location.hash = newHash;
      }
    };

    const setActive = (id) => {
      links.forEach(a => a.classList.toggle('is-active', a.dataset.nav === id));
      updateHash(id);
    };

    if ('IntersectionObserver' in window && sections.length) {
      let currentId = sections[0].id;
      const io = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const next = visible[0].target.id;
          if (next !== currentId) {
            currentId = next;
            setActive(next);
          }
        }
      }, {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0
      });
      sections.forEach(s => io.observe(s));
    }

    // ----- Smooth scroll for in-page anchors -----
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateHash(id);
      });
    });

    // ----- Reveal on scroll -----
    const revealTargets = $$('.section, .case, .contact__card, .so-card');
    revealTargets.forEach(el => el.classList.add('reveal'));
    if ('IntersectionObserver' in window) {
      const ro = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            ro.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
      revealTargets.forEach(el => ro.observe(el));
    } else {
      revealTargets.forEach(el => el.classList.add('is-in'));
    }

    // ----- Sliders -----
    $$('[data-slider]').forEach(initSlider);

    // ----- Code language tabs -----
    const codeCards = $$('.code-card');
    codeCards.forEach(card => {
      const tabs = $$('.code-tab', card);
      const panes = $$('.code-pane', card);
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const key = tab.dataset.code;
          tabs.forEach(t => {
            const active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', String(active));
          });
          panes.forEach(p => p.classList.toggle('is-active', p.dataset.pane === key));
        });
      });
    });

    // ----- Update reveal targets for new sections -----
  });

  function initSlider(root) {
    const track = root.querySelector('.slider__track');
    const slides = Array.from(root.querySelectorAll('.slider__slide'));
    const prev = root.querySelector('.slider__btn--prev');
    const next = root.querySelector('.slider__btn--next');
    const dotsWrap = root.querySelector('.slider__dots');
    if (!track || !slides.length) return;

    let index = 0;
    const total = slides.length;

    // Hide nav if only one slide
    if (total <= 1) {
      prev && (prev.style.display = 'none');
      next && (next.style.display = 'none');
      dotsWrap && (dotsWrap.style.display = 'none');
      return;
    }

    // Build dots
    const dots = [];
    for (let i = 0; i < total; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => go(i));
      dotsWrap && dotsWrap.appendChild(b);
      dots.push(b);
    }

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
    };

    const go = (i) => { index = (i + total) % total; render(); };
    const nextSlide = () => go(index + 1);
    const prevSlide = () => go(index - 1);

    prev && prev.addEventListener('click', prevSlide);
    next && next.addEventListener('click', nextSlide);

    // Keyboard nav when focused inside slider
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevSlide(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
    });

    // Touch swipe
    let startX = 0, dx = 0, touching = false;
    root.addEventListener('touchstart', (e) => {
      if (!e.touches[0]) return;
      touching = true; startX = e.touches[0].clientX; dx = 0;
    }, { passive: true });
    root.addEventListener('touchmove', (e) => {
      if (!touching || !e.touches[0]) return;
      dx = e.touches[0].clientX - startX;
    }, { passive: true });
    root.addEventListener('touchend', () => {
      if (!touching) return;
      touching = false;
      if (Math.abs(dx) > 40) dx < 0 ? nextSlide() : prevSlide();
    });

    render();
  }
})();
