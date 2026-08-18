document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme toggle ----
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

    // ---- Mobile menu ----
    const menuBtn = document.querySelector('[data-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    menuBtn?.addEventListener('click', () => {
        const open = mobileMenu?.classList.toggle('hidden') === false;
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // ---- Reveal on scroll ----
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

    // ---- Stat count-up ----
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

    // ---- Lightbox ----
    const lightbox = document.querySelector('[data-lightbox]');
    const lightboxImg = lightbox?.querySelector('img');
    const lightboxTitle = lightbox?.querySelector('[data-lightbox-title]');
    const lightboxCaption = lightbox?.querySelector('[data-lightbox-caption]');
    const closeBtn = lightbox?.querySelector('[data-lightbox-close]');

    const openLightbox = (el) => {
        if (!lightbox) return;
        const img = el.querySelector('img') || el;
        lightboxImg.src = img.dataset.full || img.currentSrc || img.src;
        lightboxTitle.textContent = el.dataset.title || '';
        lightboxCaption.textContent = el.dataset.caption || '';
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    document.querySelectorAll('[data-lightbox-trigger]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(el);
        });
    });

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // ---- Lazy load images ----
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[data-src]').forEach((img) => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }

    // ---- Profile dropdown ----
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

    // ---- Notifications ----
    const notifToggle = document.querySelector('[data-notif-toggle]');
    const notifBadge = document.querySelector('[data-notif-badge]');
    const notifPanels = document.querySelectorAll('[data-notif-panel]');
    const notifSheets = document.querySelectorAll('[data-notif-sheet]');
    const notifBackdrop = document.querySelector('[data-notif-backdrop]');
    const notifLists = document.querySelectorAll('[data-notif-list]');
    const notifMarkReads = document.querySelectorAll('[data-notif-markread]');
    const notifClose = document.querySelector('[data-notif-close]');

    const updateBadge = (count) => {
        if (!notifBadge) return;
        const n = Number(count) || 0;
        notifBadge.classList.toggle('hidden', !n);
        notifBadge.textContent = n > 9 ? '9+' : n;
    };

    const loadUnread = async () => {
        try {
            const res = await fetch('/api/notifications/unread-count', { headers: { Accept: 'application/json' } });
            const data = await res.json();
            updateBadge(data?.count || 0);
        } catch {
            /* ignore */
        }
    };

    const renderNotifications = (items) => {
        if (!notifLists.length) return;
        notifLists.forEach((notifList) => {
            notifList.innerHTML = '';
            if (!items.length) {
                const empty = document.createElement('p');
                empty.className = 'px-4 py-8 text-center text-sm text-zinc-400';
                empty.textContent = 'Tidak ada notifikasi.';
                notifList.appendChild(empty);
                return;
            }
            items.forEach((n) => {
                const a = document.createElement('a');
                a.href = n.url || '#';
                a.className = 'block border-b border-line px-4 py-3 transition-colors hover:bg-surface-muted';
                if (n.read_at) a.classList.add('opacity-60');
                if (!n.read_at) {
                    a.addEventListener('click', async () => {
                        try {
                            await fetch(`/api/notifications/${n.id}/read`, {
                                method: 'PATCH',
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                                },
                            });
                            loadUnread();
                        } catch {
                            /* ignore */
                        }
                    });
                }
                const title = document.createElement('p');
                title.className = 'text-sm font-semibold text-ink';
                title.textContent = n.data?.title || 'Notifikasi';
                const message = document.createElement('p');
                message.className = 'mt-0.5 text-xs text-ink-muted';
                message.textContent = n.data?.message || '';
                a.appendChild(title);
                a.appendChild(message);
                notifList.appendChild(a);
            });
        });
    };

    const openNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?per_page=10', { headers: { Accept: 'application/json' } });
            const data = await res.json();
            renderNotifications(data?.data || []);
        } catch {
            renderNotifications([]);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });
            updateBadge(0);
            renderNotifications([]);
        } catch {
            /* ignore */
        }
    };

    const setNotifOpen = (open) => {
        notifPanels.forEach((p) => p.classList.toggle('is-open', open));
        notifSheets.forEach((s) => s.classList.toggle('hidden', !open));
        notifBackdrop?.classList.toggle('hidden', !open);
        if (open) openNotifications();
    };

    notifToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = notifPanels.length ? notifPanels[0].classList.contains('is-open') : false;
        setNotifOpen(!isOpen);
    });
    notifMarkReads.forEach((btn) => btn.addEventListener('click', markAllRead));
    notifClose?.addEventListener('click', () => setNotifOpen(false));
    notifBackdrop?.addEventListener('click', () => setNotifOpen(false));

    if (notifToggle) {
        loadUnread();
        setInterval(loadUnread, 45000);
    }

    // Close dropdowns on outside click / escape
    document.addEventListener('click', (e) => {
        if (profileMenu && !profileMenu.contains(e.target) && !profileToggle?.contains(e.target)) {
            setProfileOpen(false);
        }
        const notifInside = [...notifPanels, ...notifSheets].some((el) => el?.contains(e.target)) || notifToggle?.contains(e.target);
        if (!notifInside) setNotifOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setProfileOpen(false);
            setNotifOpen(false);
        }
    });

    // ---- Rating carousel (testimoni) ----
    const ratingCarousel = document.querySelector('[data-rating-carousel]');
    if (ratingCarousel) {
        const track = ratingCarousel.querySelector('[data-rating-track]');
        const prevBtn = ratingCarousel.querySelector('[data-rating-prev]');
        const nextBtn = ratingCarousel.querySelector('[data-rating-next]');
        const dotsWrap = ratingCarousel.closest('section')?.querySelector('[data-rating-dots]');
        const GAP = 20;
        let perView = 1;
        let index = 0;
        let timer = null;
        let resumeTimer = null;

        const viewPer = () => {
            const w = window.innerWidth;
            if (w >= 1024) return 3;
            if (w >= 640) return 2;
            return 1;
        };

        const maxIndex = () => {
            const slides = track.children.length;
            return Math.max(0, Math.ceil(slides / perView) - 1);
        };

        const updateDots = () => {
            if (!dotsWrap) return;
            Array.from(dotsWrap.children).forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        };

        const buildDots = () => {
            if (!dotsWrap) return;
            dotsWrap.innerHTML = '';
            const count = maxIndex() + 1;
            for (let i = 0; i < count; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.setAttribute('aria-label', 'Ke testimoni halaman ' + (i + 1));
                dot.className = 'rating-dot' + (i === index ? ' is-active' : '');
                dot.addEventListener('click', () => {
                    goTo(i);
                    restartAuto();
                });
                dotsWrap.appendChild(dot);
            }
        };

        const goTo = (i) => {
            const slides = track.children;
            if (!slides.length) return;
            index = Math.min(Math.max(0, i), maxIndex());
            const target = slides[Math.min(index * perView, slides.length - 1)];
            track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
            updateDots();
            updateArrows();
        };

        const updateArrows = () => {
            if (!prevBtn || !nextBtn) return;
            const maxI = maxIndex();
            const hasOverflow = track.scrollWidth > track.clientWidth + 2;
            const hidePrev = !hasOverflow || index <= 0;
            const hideNext = !hasOverflow || index >= maxI;
            prevBtn.classList.toggle('opacity-0', hidePrev);
            prevBtn.classList.toggle('pointer-events-none', hidePrev);
            nextBtn.classList.toggle('opacity-0', hideNext);
            nextBtn.classList.toggle('pointer-events-none', hideNext);
        };

        const stopAuto = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const startAuto = () => {
            stopAuto();
            timer = setInterval(() => {
                goTo(index >= maxIndex() ? 0 : index + 1);
            }, 4500);
        };

        const restartAuto = () => {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(startAuto, 3500);
        };

        prevBtn?.addEventListener('click', () => {
            goTo(index - 1);
            restartAuto();
        });
        nextBtn?.addEventListener('click', () => {
            goTo(index + 1);
            restartAuto();
        });
        ratingCarousel.addEventListener('mouseenter', stopAuto);
        ratingCarousel.addEventListener('mouseleave', startAuto);

        track.addEventListener(
            'scroll',
            () => {
                const slide = track.children[0];
                if (!slide) return;
                const step = slide.offsetWidth + GAP;
                const idx = Math.round(track.scrollLeft / step);
                if (idx !== index) {
                    index = Math.min(Math.max(0, idx), maxIndex());
                    updateDots();
                }
                updateArrows();
            },
            { passive: true }
        );

        const init = () => {
            perView = viewPer();
            buildDots();
            goTo(Math.min(index, maxIndex()));
            updateArrows();
            startAuto();
        };
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            if (Math.abs(w - lastWidth) < 24) return;
            lastWidth = w;
            if (viewPer() !== perView) init();
            else updateArrows();
        });

        init();
    }
});
