/**
 * ABOUT EDITORIAL - JavaScript
 * Parallax + Color Transitions + Scroll Animations
 */

(function() {
    'use strict';

    // =========================================
    // CONFIGURATION
    // =========================================
    const config = {
        parallaxSpeed: 0.3,
        transitionDuration: 800,
        observerThreshold: 0.2,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    // =========================================
    // 1. COLOR TRANSITIONS ON SCROLL
    // =========================================
    function initColorTransitions() {
        if (config.prefersReducedMotion) return;

        const sections = document.querySelectorAll('[data-section]');
        const body = document.body;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const bgColor = entry.target.getAttribute('data-bg');
                    if (bgColor) {
                        body.style.transition = `background-color ${config.transitionDuration}ms ease`;
                        body.style.backgroundColor = bgColor;
                    }
                }
            });
        }, {
            threshold: [0.5]
        });

        sections.forEach(section => observer.observe(section));
    }

    // =========================================
    // 2. PARALLAX EFFECT
    // =========================================
    function initParallax() {
        if (config.prefersReducedMotion) return;

        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        function updateParallax() {
            const scrollY = window.pageYOffset;

            parallaxElements.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
                const rect = el.getBoundingClientRect();
                const elementTop = rect.top + scrollY;
                const elementHeight = rect.height;
                const windowHeight = window.innerHeight;

                // Only apply parallax when element is in viewport
                if (scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight) {
                    const yPos = -(scrollY - elementTop) * speed;
                    el.style.transform = `translateY(${yPos}px)`;
                }
            });
        }

        // Throttle scroll event
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Initial call
        updateParallax();
    }

    // =========================================
    // 3. SCROLL REVEAL ANIMATIONS
    // =========================================
    function initScrollReveal() {
        const elementsToReveal = document.querySelectorAll(
            '.timeline-point, .skill-block, .beyond-card'
        );

        if (config.prefersReducedMotion) {
            elementsToReveal.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add stagger delay
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: config.observerThreshold,
            rootMargin: '0px 0px -100px 0px'
        });

        elementsToReveal.forEach(el => observer.observe(el));
    }

    // =========================================
    // 4. STORY NAVIGATION
    // =========================================
    function initStoryNavigation() {
        const navItems = document.querySelectorAll('.story-nav-item');
        const panels = document.querySelectorAll('.story-panel');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetStory = item.getAttribute('data-story');

                // Remove active from all
                navItems.forEach(nav => nav.classList.remove('active'));
                panels.forEach(panel => panel.classList.remove('active'));

                // Add active to clicked
                item.classList.add('active');
                document.getElementById(`story-${targetStory}`).classList.add('active');
            });

            // Keyboard support
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });

            // Make focusable
            item.setAttribute('tabindex', '0');
        });
    }

    // =========================================
    // 5. SMOOTH SCROLL FOR ANCHOR LINKS
    // =========================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // =========================================
    // 6. LAZY LOAD IMAGES
    // =========================================
    function initLazyLoad() {
        const images = document.querySelectorAll('img[loading="lazy"]');

        if ('loading' in HTMLImageElement.prototype) {
            return; // Native lazy loading supported
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // =========================================
    // 7. HEADER BEHAVIOR ON SCROLL
    // =========================================
    function initHeaderBehavior() {
        const header = document.querySelector('header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add shadow when scrolled
            if (currentScroll > 10) {
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
            } else {
                header.style.boxShadow = 'none';
            }

            lastScroll = currentScroll;
        });
    }

    // =========================================
    // 8. KEYBOARD NAVIGATION
    // =========================================
    function initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    // =========================================
    // 9. PERFORMANCE MONITORING (DEV ONLY)
    // =========================================
    function logPerformance() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (window.performance && window.performance.timing) {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        const timing = window.performance.timing;
                        const loadTime = timing.loadEventEnd - timing.navigationStart;
                        console.log(`%c✨ Page loaded in ${loadTime}ms`, 'color: #007da0; font-weight: bold;');
                    }, 0);
                });
            }
        }
    }

    // =========================================
    // 10. ERROR HANDLING
    // =========================================
    function handleErrors() {
        window.addEventListener('error', (e) => {
            console.error('Script error:', e.error);
            
            // Graceful degradation: show all content
            document.querySelectorAll('.timeline-point, .skill-block, .beyond-card').forEach(el => {
                el.classList.add('visible');
            });
        });
    }

    // =========================================
    // INITIALIZATION
    // =========================================
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialize all features
        try {
            initColorTransitions();
            initParallax();
            initScrollReveal();
            initStoryNavigation();
            initSmoothScroll();
            initLazyLoad();
            initHeaderBehavior();
            initKeyboardNavigation();
            logPerformance();
            handleErrors();

            console.log('%c🎨 About Editorial initialized', 'color: #007da0; font-weight: bold;');
        } catch (error) {
            console.error('Initialization error:', error);
            handleErrors();
        }
    }

    // Start
    init();

    // Export for debugging (dev only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.aboutEditorial = {
            config,
            reinit: init
        };
    }

})();