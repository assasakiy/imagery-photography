import { pageImports } from './routeImports';
import { preloadRoute } from './preloadRoute';

const PRIORITY_SKIP = new Set(['/dashboard', '/dashboard/login']);

export function prefetchAllRoutesInBackground() {
    const conn = navigator.connection;
    const skip = conn && (conn.saveData || ['slow-2g', '2g'].includes(conn.effectiveType));
    if (skip) return;

    const paths = Object.keys(pageImports).filter((p) => !PRIORITY_SKIP.has(p));
    let index = 0;

    function next() {
        if (index >= paths.length) return;
        const path = paths[index++];

        const schedule = 'requestIdleCallback' in window
            ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
            : (cb) => setTimeout(cb, 300);

        schedule(() => {
            preloadRoute(path, { force: true });
            next();
        });
    }

    next();
}