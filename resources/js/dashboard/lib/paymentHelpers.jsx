import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Icon from '../components/Icon';

export const BANK_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18" />
    </svg>
);

export const WALLET_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 15h2" />
    </svg>
);

export function dueLabel(dueAt) {
    if (!dueAt) return 'Belum diatur';
    const now = new Date();
    const due = new Date(dueAt);
    const days = Math.ceil((due - now) / 86400000);
    if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Besok';
    return `Dalam ${days} hari`;
}

export function dueColor(dueAt) {
    if (!dueAt) return 'text-ink-muted';
    const now = new Date();
    const due = new Date(dueAt);
    const days = Math.ceil((due - now) / 86400000);
    return days < 3 ? 'text-red-600 dark:text-red-400' : 'text-ink-muted';
}

export function maskNumber(num) {
    if (!num) return '';
    const s = String(num);
    if (s.length <= 6) return s;
    return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

export function channelIcon(channel) {
    if (channel?.icon_url) {
        return <img src={channel.icon_url} alt={channel.name} className="h-5 w-5 object-contain" />;
    }
    return <Icon name="credit-card" size={20} />;
}

export function useQrCode(text, enabled) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let alive = true;
        setSrc(null);
        if (!enabled || !text) {
            return () => { alive = false; };
        }
        QRCode.toDataURL(text, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
            .then((dataUrl) => { if (alive) setSrc(dataUrl); })
            .catch(() => { if (alive) setSrc(null); });
        return () => { alive = false; };
    }, [text, enabled]);
    return src;
}
