export function getApiErrorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
    if (!err.response) {
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
            return 'Tidak ada koneksi internet. Periksa jaringan Anda.';
        }
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            return 'Permintaan terlalu lama. Coba lagi.';
        }
        return fallback;
    }

    const data = err.response.data;
    if (data?.errors) {
        const first = Object.values(data.errors)[0];
        if (Array.isArray(first)) return first[0];
    }
    return data?.message || fallback;
}
