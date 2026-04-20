/**
 * portfolio.js — William Montoya
 * Shared interactions across all pages.
 */

(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── PAGE REVEAL ───────────────────────────────── */
    function initPageReveal() {
        document.body.classList.add('page-reveal');
        if (reduced) { document.body.classList.add('loaded'); return; }
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        }));
    }

    /* ── STICKY HEADER ─────────────────────────────── */
    function initStickyHeader() {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const update = () => header.classList.toggle('scrolled', window.scrollY > 10);
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ── SCROLL REVEAL ─────────────────────────────── */
    function initScrollReveal() {
        const els = document.querySelectorAll(
            '.overview, .challenge, .insights, .project-summary, ' +
            '.timeline-point, .skill-block, .beyond-card'
        );

        if (reduced) { els.forEach(el => el.classList.add('visible')); return; }

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (!entry.isIntersecting) return;
                entry.target.style.transitionDelay = `${Math.min(i * 55, 220)}ms`;
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        els.forEach(el => io.observe(el));
    }

    /* ── COLOR TRANSITIONS (about) ─────────────────── */
    function initColorTransitions() {
        if (reduced) return;
        const sections = document.querySelectorAll('[data-bg]');
        if (!sections.length) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.4) return;
                const bg = entry.target.getAttribute('data-bg');
                if (bg) {
                    document.body.style.transition = 'background-color 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    document.body.style.backgroundColor = bg;
                }
            });
        }, { threshold: [0.4] });

        sections.forEach(s => io.observe(s));
    }

    /* ── STORY NAVIGATION (about) ──────────────────── */
    function initStoryNav() {
        const items = document.querySelectorAll('.story-nav-item');
        if (!items.length) return;

        items.forEach(item => {
            item.setAttribute('tabindex', '0');

            const activate = () => {
                const id = item.getAttribute('data-story');
                document.querySelectorAll('.story-nav-item').forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.story-panel').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const panel = document.getElementById(`story-${id}`);
                if (panel) panel.classList.add('active');
            };

            item.addEventListener('click', activate);
            item.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
            });
        });
    }

    /* ── PARALLAX (about) ──────────────────────────── */
    function initParallax() {
        if (reduced) return;
        const els = document.querySelectorAll('[data-parallax]');
        if (!els.length) return;

        let ticking = false;
        const update = () => {
            const scrollY = window.pageYOffset;
            els.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
                const rect = el.getBoundingClientRect();
                const top = rect.top + scrollY;
                if (scrollY + window.innerHeight > top && scrollY < top + rect.height) {
                    el.style.transform = `translate3d(0, ${-(scrollY - top) * speed}px, 0)`;
                }
            });
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });

        update();
    }

    /* ── DARK NAV (about page) ─────────────────────── */
    function initDarkNav() {
        const darkSections = document.querySelectorAll('.about-hero, .about-cta-dark');
        if (!darkSections.length) return;

        const headerH = document.querySelector('.site-header')?.offsetHeight || 72;

        const update = () => {
            const scrollY = window.scrollY;
            const isDark = Array.from(darkSections).some(section => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                return scrollY + headerH > top && scrollY < bottom;
            });
            document.body.classList.toggle('dark-nav', isDark);
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ── SMOOTH SCROLL ─────────────────────────────── */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const target = document.querySelector(a.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    }

    /* ── INIT ───────────────────────────────────────── */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        try {
            initPageReveal();
            initStickyHeader();
            initScrollReveal();
            initColorTransitions();
            initDarkNav();
            initStoryNav();
            initParallax();
            initSmoothScroll();
        } catch (e) {
            // Graceful degradation
            document.querySelectorAll(
                '.overview, .challenge, .insights, .project-summary, ' +
                '.timeline-point, .skill-block, .beyond-card, .page-reveal'
            ).forEach(el => el.classList.add('visible', 'loaded'));
        }
    }

    init();

})();
