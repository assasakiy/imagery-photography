import { useEffect, useState } from 'react';

let deferredPrompt = null;
let installed = false;
const listeners = new Set();

if (typeof window !== 'undefined') {
    installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        listeners.forEach((listener) => listener());
    });
    window.addEventListener('appinstalled', () => {
        installed = true;
        deferredPrompt = null;
        listeners.forEach((listener) => listener());
    });
}

export function usePwaInstall() {
    const [, refresh] = useState(0);
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    useEffect(() => {
        const update = () => refresh((value) => value + 1);
        listeners.add(update);
        return () => listeners.delete(update);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return false;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        deferredPrompt = null;
        refresh((value) => value + 1);
        return result.outcome === 'accepted';
    };

    return { canInstall: Boolean(deferredPrompt) || (ios && !installed), installed, ios, install };
}
