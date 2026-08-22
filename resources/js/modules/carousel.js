export function initRatingCarousel() {
    const ratingCarousel = document.querySelector('[data-rating-carousel]');
    if (!ratingCarousel) return;

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
