import axios from 'axios';
import { toast } from './lib/toast';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

const authUrls = ['/login', '/user'];
let _loggingOut = false;

const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

api.interceptors.response.use(
    (response) => {
        const method = (response.config?.method ?? 'get').toLowerCase();
        const url = response.config?.url ?? '';
        if (MUTATION_METHODS.includes(method) && !url.includes('dashboard/summary') && response.config?.url !== '/login') {
            window.dispatchEvent(new CustomEvent('badges:refresh'));
        }
        return response;
    },
    async (error) => {
        const url = error.config?.url ?? '';
        const config = error.config;
        if (error.response?.status === 419 && config && !config._csrfRetried) {
            config._csrfRetried = true;
            try {
                await ensureCsrf();
                return api.request(config);
            } catch {
                /* fall through to reject */
            }
        }
        if (error.response?.status === 401 && !authUrls.some((u) => url.includes(u))) {
            if (!_loggingOut) {
                _loggingOut = true;
                toast.warning('Sesi kamu berakhir, silakan login lagi.');
                setTimeout(() => { window.location.href = '/login'; }, 800);
            }
        }
        return Promise.reject(error);
    },
);

export async function ensureCsrf() {
    try {
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    } catch {
        /* ignore */
    }
}

export default api;
