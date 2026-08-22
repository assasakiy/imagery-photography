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

    // ---- Scroll to top ----
    const scrollTopBtn = document.querySelector('[data-scroll-top]');
    if (scrollTopBtn) {
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

    // ---- Native share ----
    document.querySelectorAll('[data-native-share]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const data = {
                title: btn.dataset.shareTitle || document.title,
                text: btn.dataset.shareText || '',
                url: btn.dataset.shareUrl || window.location.href,
            };
            const label = btn.querySelector('[data-share-label]');

            try {
                if (navigator.share) {
                    await navigator.share(data);
                    return;
                }

                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(data.url);
                } else {
                    const input = document.createElement('textarea');
                    input.value = data.url;
                    input.style.position = 'fixed';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    input.remove();
                }

                if (label) {
                    label.textContent = 'Tautan disalin';
                    setTimeout(() => { label.textContent = 'Bagikan'; }, 2000);
                }
            } catch (error) {
                if (error?.name !== 'AbortError' && label) {
                    label.textContent = 'Gagal membagikan';
                    setTimeout(() => { label.textContent = 'Bagikan'; }, 2000);
                }
            }
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
        lightbox.classList.add('flex');
        document.body.style.overflow = 'hidden';
    };

    document.querySelectorAll('[data-lightbox-trigger]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(el);
        });
    });

    document.querySelectorAll('.rich-content img').forEach((img) => {
        img.classList.add('cursor-zoom-in');
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        const open = () => openLightbox(img);
        img.addEventListener('click', open);
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
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

    // ---- Cookie consent banner (UU PDP) ----
const consentBanner = document.querySelector('[data-cookie-consent]');
        if (consentBanner) {
            const CONSENT_KEY = 'imagery_cookie_consent';
            const prefsPanel = consentBanner.querySelector('[data-cookie-preferences]');
            const analyticsCheck = consentBanner.querySelector('#cookie-analytics');
            const saveBtn = consentBanner.querySelector('[data-cookie-save]');
            const backBtn = consentBanner.querySelector('[data-cookie-back]');
            const actionsRow = consentBanner.querySelector('[data-cookie-actions]');
            const customActions = consentBanner.querySelector('[data-cookie-custom-actions]');

            const hide = () => {
                consentBanner.hidden = true;
            };

            const send = (consent) => {
                try {
                    fetch('/api/analytics/consent', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({ consent }),
                    }).catch(() => {});
                } catch (e) { /* offline */ }
            };

            const choose = (consent) => {
                try {
                    localStorage.setItem(CONSENT_KEY, consent);
                } catch (e) { /* private mode */ }
                send(consent);
                hide();
            };

            const setCustomMode = (on) => {
                prefsPanel?.classList.toggle('hidden', !on);
                customActions?.classList.toggle('hidden', !on);
                actionsRow?.classList.toggle('hidden', on);
            };

            const hasStored = (() => {
                try {
                    return !!localStorage.getItem(CONSENT_KEY);
                } catch (e) {
                    return false;
                }
            })();

            if (!hasStored) {
                consentBanner.hidden = false;
            }

            consentBanner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => choose('all'));
            consentBanner.querySelector('[data-cookie-necessary]')?.addEventListener('click', () => choose('necessary'));

            consentBanner.querySelector('[data-cookie-custom]')?.addEventListener('click', () => setCustomMode(true));

            backBtn?.addEventListener('click', () => setCustomMode(false));

            saveBtn?.addEventListener('click', () => {
                choose(analyticsCheck?.checked ? 'all' : 'necessary');
            });
        }

        // ---- Like toggle ----
const likeToggle = document.querySelector('[data-like-toggle]');
if (likeToggle) {
    likeToggle.addEventListener('click', async () => {
        const id = likeToggle.getAttribute('data-id');
        const type = likeToggle.getAttribute('data-type') || 'blog';
        const icon = likeToggle.querySelector('[data-like-icon]');
        const label = likeToggle.querySelector('[data-like-label]');
        const count = likeToggle.querySelector('[data-like-count]');
        const liked = likeToggle.classList.contains('border-rose-500/50');

        const csrf = (() => {
            try {
                return decodeURIComponent((document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1] || '');
            } catch (e) {
                return '';
            }
        })();

        try {
            const res = await fetch('/api/likes/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrf },
                body: JSON.stringify({ type, id: Number(id) }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.message || 'Gagal menyukai. Coba lagi.');
                return;
            }
            likeToggle.classList.toggle('border-rose-500/50', data.liked);
            likeToggle.classList.toggle('bg-rose-500/10', data.liked);
            likeToggle.classList.toggle('text-rose-600', data.liked);
            likeToggle.classList.toggle('dark:text-rose-400', data.liked);
            if (icon) icon.setAttribute('fill', data.liked ? 'currentColor' : 'none');
            if (label) label.textContent = data.liked ? 'Disukai' : 'Suka';
            if (count) count.textContent = data.likes_count;
        } catch (err) {
            alert('Gagal menyukai. Coba lagi.');
        }
    });
}

// ---- Comments ----
const commentsList = document.querySelector('[data-comments-list]');
const commentsForm = document.querySelector('[data-comment-form]');
const commentsCountEl = document.querySelector('[data-comments-count]');
const replyContext = commentsForm?.querySelector('[data-comment-reply-context]');
const replyName = commentsForm?.querySelector('[data-comment-reply-name]');
const replyCancel = commentsForm?.querySelector('[data-comment-reply-cancel]');
let replyParentId = null;

const csrfToken = () => {
    try {
        return decodeURIComponent((document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1] || '');
    } catch (e) {
        return '';
    }
};

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

const formatCommentBody = (body) => escapeHTML(body).replace(/(^|\s)(@[\p{L}\p{N}_.-]+)/gu, '$1<span class="font-semibold text-brand-600 dark:text-brand-400">$2</span>');

const renderComment = (comment, nested = false, parentName = '', rootId = null) => {
    const avatarSize = nested ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
    const avatar = comment.user?.avatar
        ? `<img src="${escapeHTML(comment.user.avatar)}" alt="" class="${avatarSize} rounded-full object-cover ring-1 ring-line">`
        : `<span class="flex ${avatarSize} items-center justify-center rounded-full bg-brand-500/15 font-bold text-brand-600 dark:text-brand-400">${escapeHTML((comment.user?.name || '?').charAt(0).toUpperCase())}</span>`;
    const officialTeamBadge = comment.user?.official_team
        ? `<span title="Tim Resmi" aria-label="Tim Resmi" class="inline-flex h-[17px] w-[17px] shrink-0 self-center align-middle text-brand-600 dark:text-brand-400"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg></span>`
        : '';
    const replyTargetId = nested ? rootId : comment.id;
    const replyBtn = commentsForm
        ? `<button type="button" data-comment-reply="${replyTargetId}" data-comment-reply-name="${escapeHTML(comment.user?.name || 'Subscriber')}" data-comment-reply-username="${escapeHTML(comment.user?.username || '')}" data-comment-mention="${nested ? '1' : '0'}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>Balas</button>`
        : '';
    const deleteBtn = comment.can_delete
        ? `<button type="button" data-comment-delete="${comment.id}" class="text-xs text-ink-muted hover:text-rose-600">Hapus</button>`
        : '';
    const replies = !nested && comment.replies?.length
        ? `<div class="ml-12 mt-3 sm:ml-14">
                <button type="button" data-replies-toggle="${comment.id}" aria-expanded="false" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                    <svg data-replies-chevron xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                    <span data-replies-label>Lihat ${comment.replies.length} balasan</span>
                </button>
                <div data-replies-list="${comment.id}" hidden class="relative mt-3 space-y-3 border-l-2 border-brand-500/20 pl-5">${comment.replies.map((reply) => renderComment(reply, true, comment.user?.name || 'Subscriber', comment.id)).join('')}</div>
            </div>`
        : '';
    const replyLabel = nested
        ? `<p class="mb-1 text-[11px] text-ink-muted">Membalas <span class="font-semibold text-brand-600 dark:text-brand-400">${escapeHTML(parentName)}</span></p>`
        : '';

    return `
        <div data-comment-id="${comment.id}" class="${nested ? 'relative rounded-xl border border-line/70 bg-surface-muted/50 p-3 before:absolute before:-left-[1.35rem] before:top-6 before:h-px before:w-5 before:bg-brand-500/20' : 'rounded-2xl border border-line bg-surface p-4 shadow-sm'}">
            <div class="flex gap-3">
                <div class="shrink-0">${avatar}</div>
                <div class="min-w-0 flex-1">
                    ${replyLabel}
                    <div class="flex flex-wrap items-baseline gap-2">
                        <span class="text-sm font-semibold text-ink">${escapeHTML(comment.user?.name || 'Subscriber')}</span>
                        ${officialTeamBadge}
                        <span class="text-xs text-ink-muted">${escapeHTML(comment.created_at_rel || '')}</span>
                    </div>
                    <p class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">${formatCommentBody(comment.body)}</p>
                    ${(replyBtn || deleteBtn) ? `<div class="mt-2.5 flex items-center gap-3">${replyBtn}${deleteBtn}</div>` : ''}
                </div>
            </div>
            ${replies}
        </div>`;
};

const renderComments = (comments) => {
    if (!commentsList) return;
    if (!comments.length) {
        commentsList.innerHTML = '<p class="text-sm text-ink-muted">Belum ada komentar. Jadilah yang pertama.</p>';
        return;
    }
    commentsList.innerHTML = comments.map((comment) => renderComment(comment)).join('');
};

const loadComments = async () => {
    const postId = document.querySelector('[data-comments-section]')?.getAttribute('data-post-id');
    if (!postId) return;
    try {
        const res = await fetch(`/api/comments/blog/${postId}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
        const data = await res.json();
        renderComments(data || []);
    } catch (e) {
        /* ignore */
    }
};

if (commentsList) {
    loadComments();

    commentsList.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('[data-replies-toggle]');
        if (toggleBtn) {
            const id = toggleBtn.getAttribute('data-replies-toggle');
            const list = commentsList.querySelector(`[data-replies-list="${id}"]`);
            if (!list) return;
            const opening = list.hidden;
            list.hidden = !opening;
            toggleBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
            toggleBtn.querySelector('[data-replies-chevron]')?.classList.toggle('rotate-180', opening);
            const label = toggleBtn.querySelector('[data-replies-label]');
            if (label) label.textContent = opening ? 'Sembunyikan balasan' : `Lihat ${list.children.length} balasan`;
            return;
        }

        const replyBtn = e.target.closest('[data-comment-reply]');
        if (replyBtn && commentsForm) {
            replyParentId = Number(replyBtn.getAttribute('data-comment-reply'));
            if (replyName) replyName.textContent = replyBtn.getAttribute('data-comment-reply-name') || 'Subscriber';
            if (replyContext) replyContext.hidden = false;
            commentsForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const body = commentsForm.querySelector('[data-comment-body]');
            if (body) {
                const targetName = replyBtn.getAttribute('data-comment-reply-name') || 'Subscriber';
                body.placeholder = `Tulis balasan untuk ${targetName}…`;
                if (replyBtn.getAttribute('data-comment-mention') === '1') {
                    const username = replyBtn.getAttribute('data-comment-reply-username');
                    if (username) {
                        const mention = `@${username} `;
                        if (!body.value.startsWith(mention)) body.value = mention + body.value;
                    }
                }
                setTimeout(() => {
                    body.focus();
                    body.setSelectionRange(body.value.length, body.value.length);
                }, 300);
            }
            return;
        }

        const deleteBtn = e.target.closest('[data-comment-delete]');
        if (!deleteBtn) return;
        const id = deleteBtn.getAttribute('data-comment-delete');
        if (!confirm('Hapus komentar ini? Balasan di bawahnya juga akan terhapus.')) return;
        try {
            const res = await fetch(`/api/comments/${id}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfToken() },
            });
            if (res.ok) loadComments();
        } catch (err) {
            /* ignore */
        }
    });
}

replyCancel?.addEventListener('click', () => {
    replyParentId = null;
    if (replyContext) replyContext.hidden = true;
    const body = commentsForm?.querySelector('[data-comment-body]');
    if (body) body.placeholder = 'Tulis komentar Anda…';
});

if (commentsForm) {
    commentsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = commentsForm.querySelector('[data-comment-body]');
        const submitBtn = commentsForm.querySelector('[data-comment-submit]');
        if (!body?.value.trim()) return;
        const postId = document.querySelector('[data-comments-section]')?.getAttribute('data-post-id');
        if (!postId) return;

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Mengirim…'; }
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfToken() },
                body: JSON.stringify({ type: 'blog', id: Number(postId), parent_id: replyParentId, body: body.value.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.message || 'Gagal mengirim komentar.');
                return;
            }
            body.value = '';
            replyParentId = null;
            if (replyContext) replyContext.hidden = true;
            body.placeholder = 'Tulis komentar Anda…';
            if (commentsCountEl) commentsCountEl.textContent = (Number(commentsCountEl.textContent) || 0) + 1;
            loadComments();
        } catch (err) {
            alert('Gagal mengirim komentar. Coba lagi.');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Komentar'; }
        }
    });
}

document.querySelectorAll('[data-scroll-comments]').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelector('[data-comments-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ---- Bookmark toggle ----
        document.querySelectorAll('[data-bookmark-toggle]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const type = btn.getAttribute('data-type') || 'blog';
                const icon = btn.querySelector('[data-bookmark-icon]');
                const label = btn.querySelector('[data-bookmark-label]');
                const active = btn.classList.contains('border-amber-500/50');

                const csrf = (() => {
                    try {
                        return decodeURIComponent((document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1] || '');
                    } catch (e) {
                        return '';
                    }
                })();

                try {
                    if (active) {
                        await fetch(`/api/bookmarks/${type}/${id}`, {
                            method: 'DELETE',
                            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrf },
                        });
                        btn.classList.remove('border-amber-500/50', 'bg-amber-500/10', 'text-amber-600', 'dark:text-amber-400');
                        if (icon) icon.setAttribute('fill', 'none');
                        if (label) label.textContent = 'Simpan';
                    } else {
                        await fetch('/api/bookmarks', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrf },
                            body: JSON.stringify({ type, id: Number(id) }),
                        });
                        btn.classList.add('border-amber-500/50', 'bg-amber-500/10', 'text-amber-600', 'dark:text-amber-400');
                        if (icon) icon.setAttribute('fill', 'currentColor');
                        if (label) label.textContent = 'Tersimpan';
                    }
                } catch (err) {
                    alert('Gagal menyimpan. Coba lagi.');
                }
            });
        });

        // ---- Subscribe modal ----
        const subscribeModal = document.querySelector('[data-subscribe-modal]');
        const subscribeForm = document.querySelector('[data-subscribe-form]');
        const subscribeOtpForm = document.querySelector('[data-subscribe-otp-form]');
        const subscribeName = document.querySelector('[data-subscribe-name]');
        const subscribeEmail = document.querySelector('[data-subscribe-email]');
        const subscribeOtp = document.querySelector('[data-subscribe-otp]');
        const subscribeOtpTarget = document.querySelector('[data-subscribe-otp-target]');
        const subscribeOtpError = document.querySelector('[data-subscribe-otp-error]');
        const subscribeTitle = document.querySelector('[data-subscribe-title]');
        const subscribePasswordForm = document.querySelector('[data-subscribe-password-form]');
        const subscribePassword = document.querySelector('[data-subscribe-password]');
        const subscribePasswordConfirm = document.querySelector('[data-subscribe-password-confirm]');
        const subscribePasswordError = document.querySelector('[data-subscribe-password-error]');

        // State lintas form
        let subscribeSetPasswordToken = null;
        const returnUrl = window.location.href;

        if (subscribeModal) {
            const csrfToken = () => {
                try {
                    const raw = (document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1] || '';
                    return decodeURIComponent(raw);
                } catch (e) {
                    return '';
                }
            };

            const openSubscribe = () => {
                subscribeModal.classList.remove('hidden');
                subscribeModal.classList.add('flex');
                if (subscribeOtpError) subscribeOtpError.textContent = '';
                // Jika form OTP sudah aktif (OTP sudah dikirim), jangan reset ke form email.
                const otpActive = subscribeOtpForm && !subscribeOtpForm.classList.contains('hidden');
                const pwActive  = subscribePasswordForm && !subscribePasswordForm.classList.contains('hidden');
                if (!otpActive && !pwActive) {
                    subscribeForm?.classList.remove('hidden');
                    subscribeOtpForm?.classList.add('hidden');
                    subscribePasswordForm?.classList.add('hidden');
                    subscribeForm?.querySelector('input')?.focus();
                }
            };

            const closeSubscribe = () => {
                subscribeModal.classList.add('hidden');
                subscribeModal.classList.remove('flex');
                subscribeForm?.classList.remove('hidden');
                subscribeOtpForm?.classList.add('hidden');
                subscribePasswordForm?.classList.add('hidden');
                subscribeSetPasswordToken = null;
            };

            document.querySelectorAll('[data-subscribe-open]').forEach((btn) => {
                btn.addEventListener('click', openSubscribe);
            });
            subscribeModal.querySelectorAll('[data-subscribe-close]').forEach((btn) => {
                btn.addEventListener('click', closeSubscribe);
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !subscribeModal.classList.contains('hidden')) closeSubscribe();
            });

            subscribeForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = subscribeForm.querySelector('[data-subscribe-submit]');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Mengirim…'; }

                try {
                    const res = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': csrfToken(),
                        },
                        body: JSON.stringify({
                            name: subscribeName?.value || '',
                            email: subscribeEmail?.value || '',
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        alert(data?.message || 'Gagal mengirim OTP. Coba lagi.');
                        return;
                    }
                    if (subscribeOtpTarget) subscribeOtpTarget.textContent = (subscribeEmail?.value || '').trim();
                    subscribeForm.classList.add('hidden');
                    subscribeOtpForm.classList.remove('hidden');
                    subscribeOtp?.focus();
                    // Jika OTP masih valid dari sesi sebelumnya, beri tahu user.
                    if (data.otp_valid && subscribeOtpError) {
                        subscribeOtpError.style.color = '';
                        subscribeOtpError.textContent = 'OTP sebelumnya masih berlaku. Gunakan kode yang sudah dikirim.';
                    }
                } catch (err) {
                    alert('Terjadi kesalahan. Coba lagi.');
                } finally {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Kode OTP'; }
                }
            });

            subscribeForm?.querySelector('[data-subscribe-back]')?.addEventListener('click', () => {
                subscribeForm.classList.remove('hidden');
                subscribeOtpForm.classList.add('hidden');
            });

            subscribeOtpForm?.querySelector('[data-subscribe-back]')?.addEventListener('click', () => {
                subscribeOtpForm.classList.add('hidden');
                subscribeForm.classList.remove('hidden');
            });

            subscribeOtpForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = subscribeOtpForm.querySelector('[data-subscribe-otp-submit]');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Memverifikasi…'; }
                if (subscribeOtpError) subscribeOtpError.textContent = '';

                try {
                    const res = await fetch('/api/subscribe/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': csrfToken(),
                        },
                        body: JSON.stringify({
                            email: (subscribeEmail?.value || '').trim(),
                            otp: subscribeOtp?.value || '',
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        if (subscribeOtpError) subscribeOtpError.textContent = data?.message || 'Kode salah.';
                        return;
                    }
                    if (data.require_password) {
                        // User baru — tampilkan form set-password inline.
                        subscribeSetPasswordToken = data.set_password_token;
                        subscribeOtpForm.classList.add('hidden');
                        subscribePasswordForm?.classList.remove('hidden');
                        if (subscribeTitle) subscribeTitle.textContent = 'Buat Kata Sandi';
                        subscribePassword?.focus();
                    } else {
                        // User lama sudah active — langsung masuk, kembali ke halaman asal.
                        if (subscribeTitle) subscribeTitle.textContent = 'Berhasil!';
                        setTimeout(() => { window.location.href = returnUrl; }, 500);
                    }
                } catch (err) {
                    if (subscribeOtpError) subscribeOtpError.textContent = 'Terjadi kesalahan. Coba lagi.';
                } finally {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Verifikasi & Masuk'; }
                }
            });

            // Form set-password inline di modal.
            subscribePasswordForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = subscribePasswordForm.querySelector('[data-subscribe-password-submit]');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Menyimpan…'; }
                if (subscribePasswordError) subscribePasswordError.textContent = '';

                const pw  = subscribePassword?.value || '';
                const pw2 = subscribePasswordConfirm?.value || '';
                if (pw.length < 8) {
                    if (subscribePasswordError) subscribePasswordError.textContent = 'Kata sandi minimal 8 karakter.';
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
                    return;
                }
                if (pw !== pw2) {
                    if (subscribePasswordError) subscribePasswordError.textContent = 'Konfirmasi kata sandi tidak cocok.';
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
                    return;
                }

                try {
                    const res = await fetch('/api/set-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': csrfToken(),
                        },
                        body: JSON.stringify({
                            token: subscribeSetPasswordToken,
                            password: pw,
                            password_confirmation: pw2,
                        }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        if (subscribePasswordError) subscribePasswordError.textContent = data?.message || data?.errors?.password?.[0] || 'Gagal menyimpan kata sandi.';
                        return;
                    }
                    // Sukses — akun aktif + sudah login. Kembali ke halaman asal.
                    if (subscribeTitle) subscribeTitle.textContent = 'Akun Berhasil Dibuat!';
                    setTimeout(() => { window.location.href = returnUrl; }, 600);
                } catch (err) {
                    if (subscribePasswordError) subscribePasswordError.textContent = 'Terjadi kesalahan. Coba lagi.';
                } finally {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
                }
            });
        }
});
