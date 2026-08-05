import { useMemo } from 'react';

export default function useDirty(original, current) {
    return useMemo(() => {
        try {
            return JSON.stringify(original ?? null) !== JSON.stringify(current ?? null);
        } catch {
            return true;
        }
    }, [original, current]);
}
