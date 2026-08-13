import { pageImports } from './routeImports';

const preloadCache = new Map();

function isSlowConnection() {
    const conn = navigator.connection;
    if (!conn) return false;
    return conn.saveData || ['slow-2g', '2g'].includes(conn.effectiveType);
}

function normalizePath(path) {
    if (pageImports[path]) return path;

    const segments = path.split('/').filter(Boolean);
    for (let i = segments.length; i >= 1; i--) {
        const prefix = '/' + segments.slice(0, i).join('/');
        const candidates = Object.keys(pageImports).filter((p) => p.includes(':'));
        for (const candidate of candidates) {
            const pattern = candidate.replace(/:[^/]+/g, '[^/]+');
            if (new RegExp('^' + pattern + '$').test(path)) return candidate;
        }
        if (pageImports[prefix]) return prefix;
    }

    return null;
}

export function preloadRoute(path, { force = false } = {}) {
    const key = normalizePath(path);
    if (!key) return undefined;

    if (!force && isSlowConnection()) return undefined;

    if (!preloadCache.has(key)) {
        const promise = pageImports[key]().catch((err) => {
            preloadCache.delete(key);
            throw err;
        });
        preloadCache.set(key, promise);
    }
    return preloadCache.get(key);
}