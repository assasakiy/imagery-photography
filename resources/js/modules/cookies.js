export function initCookieConsent() {
    const consentBanner = document.querySelector('[data-cookie-consent]');
    if (!consentBanner) return;

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
