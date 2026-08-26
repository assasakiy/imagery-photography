import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const DENIED_KEY = 'imagery_push_denied';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushSubscription() {
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(true);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const shouldShowPrompt = !(isIOS && !isStandalone);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            setLoading(false);
            return;
        }
        setSupported(true);
        setPermission(Notification.permission);

        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setSubscribed(!!sub);
                setLoading(false);
            });
        });
    }, []);

    const subscribe = useCallback(async () => {
        if (!supported || !shouldShowPrompt) return false;

        if (permission === 'denied') {
            localStorage.setItem(DENIED_KEY, '1');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== 'granted') {
                if (result === 'denied') localStorage.setItem(DENIED_KEY, '1');
                return false;
            }

            const { data } = await api.get('/push/vapid-key');
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey),
            });

            const sub = subscription.toJSON();
            await api.post('/push/subscribe', {
                endpoint: sub.endpoint,
                publicKey: sub.keys.p256dh,
                authToken: sub.keys.auth,
                contentEncoding: sub.contentEncoding || 'aes128gcm',
            });

            setSubscribed(true);
            return true;
        } catch (err) {
            console.error('Push subscription failed:', err);
            return false;
        }
    }, [supported, permission, shouldShowPrompt]);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                await api.post('/push/unsubscribe', { endpoint: sub.endpoint });
                await sub.unsubscribe();
                setSubscribed(false);
            }
        } catch (err) {
            console.error('Push unsubscribe failed:', err);
        }
    }, []);

    return {
        supported,
        subscribed,
        permission,
        loading,
        subscribe,
        unsubscribe,
        shouldShowPrompt,
        isDeniedForever: localStorage.getItem(DENIED_KEY) === '1' || permission === 'denied',
    };
}
