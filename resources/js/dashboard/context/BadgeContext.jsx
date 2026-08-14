import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';

const BadgeContext = createContext(null);

const DEBOUNCE_MS = 500;
const FALLBACK_INTERVAL_MS = 60000;

export function BadgeProvider({ children }) {
    const [unread, setUnread] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadBookings, setUnreadBookings] = useState(0);
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
                setUnread(data.notifications_unread ?? 0);
                setUnreadMessages(data.messages_unread ?? 0);
                setUnreadBookings(data.bookings_pending ?? 0);
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

        const timer = setInterval(refresh, FALLBACK_INTERVAL_MS);

        return () => {
            window.removeEventListener('badges:refresh', onRefresh);
            document.removeEventListener('visibilitychange', onVisible);
            clearInterval(timer);
        };
    }, [refresh]);

    return (
        <BadgeContext.Provider value={{ unread, unreadMessages, unreadBookings, refresh }}>
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