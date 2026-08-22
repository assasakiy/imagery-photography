export function initNotifications() {
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
        } catch { /* ignore */ }
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
                        } catch { /* ignore */ }
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
        } catch { /* ignore */ }
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

    return { setNotifOpen };
}
