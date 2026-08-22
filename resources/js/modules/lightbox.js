export function initLightbox() {
    const lightbox = document.querySelector('[data-lightbox]');
    if (!lightbox) return;

    const lightboxImg = lightbox.querySelector('img');
    const lightboxTitle = lightbox.querySelector('[data-lightbox-title]');
    const lightboxCaption = lightbox.querySelector('[data-lightbox-caption]');
    const closeBtn = lightbox.querySelector('[data-lightbox-close]');

    const openLightbox = (el) => {
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
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}
