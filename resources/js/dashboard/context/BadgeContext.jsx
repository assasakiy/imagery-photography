import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';

const BadgeContext = createContext(null);

const DEBOUNCE_MS = 500;
const FALLBACK_INTERVAL_MS = 60000;

function setAppBadge(count) {
    if ('setAppBadge' in navigator) {
        if (count > 0) {
            navigator.setAppBadge(count).catch(() => {});
        } else {
            navigator.clearAppBadge().catch(() => {});
        }
    }
}

function notifySW(type, data) {
    navigator.serviceWorker?.controller?.postMessage({ type, ...data });
}

export function BadgeProvider({ children }) {
    const [unread, setUnread] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadBookings, setUnreadBookings] = useState(0);
    const [unpaidInvoices, setUnpaidInvoices] = useState(0);
    const [pendingPayments, setPendingPayments] = useState(0);
    const lastFetchRef = useRef(0);
    const inflightRef = useRef(false);
    const queuedRef = useRef(false);

    const refresh = useCallback(() => {
        if (inflightRef.current) {
            queuedRef.current = true;
            return;
        }

        const now = Date.now();
        if (now - lastFetchRef.current < DEBOUNCE_MS) return;
        lastFetchRef.current = now;
        inflightRef.current = true;

        api.get('/dashboard/summary')
            .then(({ data }) => {
                const newUnread = data.notifications_unread ?? 0;
                setUnread(newUnread);
                setUnreadMessages(data.messages_unread ?? 0);
                setUnreadBookings(data.bookings_pending ?? 0);
                setUnpaidInvoices(data.invoices_unpaid ?? 0);
                setPendingPayments(data.payments_pending ?? 0);

                setAppBadge(newUnread);
                notifySW('SET_BADGE', { count: newUnread });
            })
            .catch(() => {})
            .finally(() => {
                inflightRef.current = false;
                if (queuedRef.current) {
                    queuedRef.current = false;
                    lastFetchRef.current = 0;
                    refresh();
                }
            });
    }, []);

    useEffect(() => {
        refresh();

        const onRefresh = () => refresh();
        window.addEventListener('badges:refresh', onRefresh);

        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        document.addEventListener('visibilitychange', onVisible);

        // Listen for badge refresh from service worker (push received)
        const onSWMessage = (event) => {
            if (event.data?.type === 'BADGE_REFRESH') {
                refresh();
            }
        };
        navigator.serviceWorker?.addEventListener('message', onSWMessage);

        const timer = setInterval(refresh, FALLBACK_INTERVAL_MS);

        return () => {
            window.removeEventListener('badges:refresh', onRefresh);
            document.removeEventListener('visibilitychange', onVisible);
            navigator.serviceWorker?.removeEventListener('message', onSWMessage);
            clearInterval(timer);
        };
    }, [refresh]);

    return (
        <BadgeContext.Provider value={{ unread, unreadMessages, unreadBookings, unpaidInvoices, pendingPayments, refresh }}>
            {children}
        </BadgeContext.Provider>
    );
}

export function useBadges() {
    return useContext(BadgeContext);
}

export function refreshBadges() {
    window.dispatchEvent(new CustomEvent('badges:refresh'));
}