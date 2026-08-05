import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

const authUrls = ['/login', '/user'];

api.interceptors.response.use(
    (response) => response,
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
            window.location.href = '/login';
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
