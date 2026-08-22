export const csrfToken = () => {
    try {
        return decodeURIComponent((document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/) || [])[1] || '');
    } catch (e) {
        return '';
    }
};

export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
    } catch { /* fallback below */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
};

export const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};
