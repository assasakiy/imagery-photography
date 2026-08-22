import { initTheme, initScrollTop, initMobileMenu, initReveal, initStatCountUp, initLazyImages, initProfileDropdown } from './modules/ui';
import { initNativeShare } from './modules/share';
import { initLightbox } from './modules/lightbox';
import { initNotifications } from './modules/notifications';
import { initRatingCarousel } from './modules/carousel';
import { initCookieConsent } from './modules/cookies';
import { initLikeToggle, initBookmarkToggle } from './modules/blog';
import { initComments } from './modules/comments';
import { initSubscribeModal } from './modules/subscribe';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollTop();
    initNativeShare();
    initMobileMenu();
    initReveal();
    initStatCountUp();
    initLightbox();
    initLazyImages();

    const { profileToggle, profileMenu, setProfileOpen } = initProfileDropdown();
    const notif = initNotifications();

    document.addEventListener('click', (e) => {
        if (profileMenu && !profileMenu.contains(e.target) && !profileToggle?.contains(e.target)) {
            setProfileOpen(false);
        }
        notif?.setNotifOpen && (() => {
            const notifPanels = document.querySelectorAll('[data-notif-panel]');
            const notifSheets = document.querySelectorAll('[data-notif-sheet]');
            const notifToggle = document.querySelector('[data-notif-toggle]');
            const notifInside = [...notifPanels, ...notifSheets].some((el) => el?.contains(e.target)) || notifToggle?.contains(e.target);
            if (!notifInside) notif.setNotifOpen(false);
        })();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setProfileOpen(false);
            notif?.setNotifOpen?.(false);
        }
    });

    initRatingCarousel();
    initCookieConsent();
    initLikeToggle();
    initComments();
    initBookmarkToggle();
    initSubscribeModal();
});
