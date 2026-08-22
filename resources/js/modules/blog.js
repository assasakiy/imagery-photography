import { csrfToken } from './utils';

export function initLikeToggle() {
    const likeToggle = document.querySelector('[data-like-toggle]');
    if (!likeToggle) return;

    likeToggle.addEventListener('click', async () => {
        const id = likeToggle.getAttribute('data-id');
        const type = likeToggle.getAttribute('data-type') || 'blog';
        const icon = likeToggle.querySelector('[data-like-icon]');
        const label = likeToggle.querySelector('[data-like-label]');
        const count = likeToggle.querySelector('[data-like-count]');

        try {
            const res = await fetch('/api/likes/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfToken() },
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

export function initBookmarkToggle() {
    document.querySelectorAll('[data-bookmark-toggle]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type') || 'blog';
            const icon = btn.querySelector('[data-bookmark-icon]');
            const label = btn.querySelector('[data-bookmark-label]');
            const active = btn.classList.contains('border-amber-500/50');
            const csrf = csrfToken();

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
}
