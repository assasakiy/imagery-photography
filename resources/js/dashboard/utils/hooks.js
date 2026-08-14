import { useState, useEffect } from 'react';
import api from '../../api';

export function useUnreadCount(interval = 60000) {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try {
            const { data } = await api.get('/dashboard/unread-count');
            setCount(data.unread_count);
        } catch {}
    };

    useEffect(() => {
        fetchCount();
        const timer = setInterval(fetchCount, interval);
        return () => clearInterval(timer);
    }, [interval]);

    return count;
}
