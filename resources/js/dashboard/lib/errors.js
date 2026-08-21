export function getApiErrorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
    const data = err?.response?.data;
    if (data?.errors) {
        const first = Object.values(data.errors)[0];
        if (Array.isArray(first)) return first[0];
    }
    return data?.message || fallback;
}
