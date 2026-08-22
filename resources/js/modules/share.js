import { copyToClipboard } from './utils';

export function initNativeShare() {
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
                    await copyToClipboard(data.url);
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
}
