import { useEffect, useState } from 'react';

export function usePwaInstall() {
    const [prompt, setPrompt] = useState(null);
    const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

    useEffect(() => {
        const onBeforeInstall = (event) => {
            event.preventDefault();
            setPrompt(event);
        };
        const onInstalled = () => {
            setInstalled(true);
            setPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        if (!prompt) return false;
        prompt.prompt();
        const result = await prompt.userChoice;
        setPrompt(null);
        return result.outcome === 'accepted';
    };

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const canInstall = Boolean(prompt) || (ios && !installed);

    return { canInstall, installed, ios, install };
}
