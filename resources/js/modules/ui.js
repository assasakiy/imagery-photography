export function initTheme() {
    const themeBtns = document.querySelectorAll('[data-theme-toggle]');
    const applyTheme = (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        const label = theme === 'dark' ? 'Tema Dark' : 'Tema Light';
        document.querySelectorAll('[data-theme-label]').forEach((el) => {
            el.textContent = label;
        });
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    themeBtns.forEach((btn) => {
        btn?.addEventListener('click', () => {
            const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', next);
            applyTheme(next);
        });
    });
}

export function initScrollTop() {
    const scrollTopBtn = document.querySelector('[data-scroll-top]');
    if (!scrollTopBtn) return;

    const updateScrollTop = () => {
        const visible = window.scrollY > 500;
        scrollTopBtn.classList.toggle('pointer-events-none', !visible);
        scrollTopBtn.classList.toggle('translate-y-3', !visible);
        scrollTopBtn.classList.toggle('opacity-0', !visible);
    };

    window.addEventListener('scroll', updateScrollTop, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    updateScrollTop();
}

export function initMobileMenu() {
    const menuBtn = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    menuBtn?.addEventListener('click', () => {
        const open = mobileMenu?.classList.toggle('hidden') === false;
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

export function initReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );
        revealEls.forEach((el) => observer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }
}

export function initStatCountUp() {
    const statEls = document.querySelectorAll('.stat-count');
    const animateCount = (el) => {
        const raw = (el.dataset.final || '').trim();
        const match = raw.match(/^(\D*)([\d\.,]+)(.*)$/);
        if (!match) {
            el.textContent = raw;
            return;
        }
        const [, prefix, numStr, rest] = match;
        const dots = (numStr.match(/\./g) || []).length;
        const target = parseFloat(numStr.replace(/\./g, '').replace(/,/g, ''));
        if (!Number.isFinite(target) || target <= 1) {
            el.textContent = prefix + numStr + rest;
            return;
        }
        const start = 1;
        const duration = 1200;
        const t0 = performance.now();
        const format = (n) => {
            const v = dots > 0 ? (n / 10 ** dots).toFixed(dots) : Math.round(n).toString();
            return prefix + v + rest;
        };
        const step = (now) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = format(start + (target - start) * eased);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    if (statEls.length && 'IntersectionObserver' in window) {
        const statObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCount(entry.target);
                        statObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 },
        );
        statEls.forEach((el) => statObserver.observe(el));
    } else {
        statEls.forEach(animateCount);
    }
}

export function initLazyImages() {
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[data-src]').forEach((img) => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

export function initProfileDropdown() {
    const profileToggle = document.querySelector('[data-profile-toggle]');
    const profileMenu = document.querySelector('[data-profile-menu]');
    const profileChevron = document.querySelector('[data-profile-chevron]');
    const setProfileOpen = (open) => {
        profileMenu?.classList.toggle('is-open', open);
        if (profileChevron) profileChevron.classList.toggle('rotate-180', open);
    };
    profileToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        setProfileOpen(!profileMenu?.classList.contains('is-open'));
    });

    return { profileToggle, profileMenu, setProfileOpen };
}
