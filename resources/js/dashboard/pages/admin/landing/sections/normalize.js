export function normalizeSections(existing) {
    let list = [];
    if (Array.isArray(existing)) {
        list = existing;
    } else if (existing && typeof existing === 'object') {
        list = Object.entries(existing).map(([type, sec]) => ({ type, ...(sec || {}) }));
    }
    const defaults = {
        hero: { type: 'hero', title: '', subtitle: '', button_text: '', button_link: '' },
        about: { type: 'about', subtitle: '', title: '', description: '', content: '', button_text: '', button_link: '', image: '' },
        reviews: { type: 'reviews', subtitle: '', title: '', mode: 'all', all_ratings: [1, 2, 3, 4, 5], star: 5, min_star: 3, items: [] },
        faq: { type: 'faq', subtitle: '', title: '', mode: 'ids', items: [], categories: [] },
        stats: { type: 'stats', mode: 'ids', items: [] },
        blog: { type: 'blog', subtitle: '', title: '', limit: 3 },
        cta: { type: 'cta', title: '', description: '', button_text: '', button_link: '' },
        timeline: { type: 'timeline', data: [] },
        layanan: { type: 'layanan', subtitle: 'Layanan', title: 'Layanan Kami', description: '', mode: 'featured', limit: 3 },
        kontak: { type: 'kontak', phone: '', email: '', address: '', socials: [], map_url: '' },
        cerita: { type: 'cerita', subtitle: 'Cerita Kami', title: 'Cerita Kami', content: '' },
        perjalanan: { type: 'perjalanan', subtitle: 'Perjalanan', title: 'Tentang Situs & Layanan', history: '' },
        tim: { type: 'tim', subtitle: 'Tim', title: 'Di Balik Lensa', members: [] },
        karya: { type: 'karya', subtitle: 'Karya Unggulan', title: 'Sebagian Karya Kami', mode: 'featured', category_ids: [], limit: 3 },
        layanan_populer: { type: 'layanan_populer', subtitle: 'Populer & Unggulan', title: 'Paket Pilihan', use_popular: true, use_featured: true, popular_limit: 3, featured_limit: 3 },
        layanan_satuan: { type: 'layanan_satuan', subtitle: 'Satuan', title: 'Paket Satuan', mode: 'all', items: [] },
        layanan_premium: { type: 'layanan_premium', subtitle: 'Premium', title: 'Paket Premium', mode: 'all', items: [] },
        layanan_ultimate: { type: 'layanan_ultimate', subtitle: 'Ultimate', title: 'Paket Ultimate', mode: 'all', items: [] },
        layanan_catatan: { type: 'layanan_catatan', title: 'Catatan Penting', content: '' },
        layanan_faq: { type: 'layanan_faq', subtitle: 'FAQ', title: 'Tanya Jawab', mode: 'all', items: [], categories: [] },
        layanan_cta: { type: 'layanan_cta', title: 'Siap Mengabadikan Momen Anda?', description: 'Konsultasikan kebutuhan Anda secara gratis.', button_text: 'Hubungi via WhatsApp', button_link: '' },
        booking_sidebar: {
            type: 'booking_sidebar',
            show_kontak: true,
            kontak_title: 'Kontak Kami',
            show_populer: true,
            populer_title: 'Paket Populer',
            show_cara: true,
            cara_title: 'Cara Booking',
            cara_faq_title: 'Pertanyaan Umum',
            cara_faq_mode: 'all',
            cara_faq_items: [],
            cara_faq_categories: [],
            cara_steps: [
                'Isi formulir dengan data diri & detail acara Anda.',
                'Kami konfirmasi ketersediaan via WhatsApp/Email.',
                'Cicilan atau pelunasan bisa dilakukan dari portal klien.',
            ],
        },
    };

    const normalized = { ...defaults };
    if (list.length) {
        list.forEach(sec => {
            if (sec.type && defaults[sec.type]) {
                normalized[sec.type] = { ...defaults[sec.type], ...sec };
            }
        });
    }
    const legacyHistory = Array.isArray(existing) ? existing.find((s) => s?.type === 'history') : null;
    if (legacyHistory && !(normalized.perjalanan.history || '').trim()) {
        normalized.perjalanan = { ...normalized.perjalanan, history: legacyHistory.text || '' };
    }
    if (normalized.reviews.mode === '5star') {
        normalized.reviews = { ...normalized.reviews, mode: 'star', star: 5, items: [] };
    } else if (normalized.reviews.mode === 'star_above') {
        normalized.reviews = { ...normalized.reviews, mode: 'above', min_star: normalized.reviews.minimum_stars || 3, items: [] };
    } else if (!['all', 'star', 'above'].includes(normalized.reviews.mode)) {
        normalized.reviews = { ...normalized.reviews, mode: 'all', all_ratings: [1, 2, 3, 4, 5] };
    }
    if (!['ids', 'all', 'category'].includes(normalized.faq.mode)) {
        normalized.faq = { ...normalized.faq, mode: 'ids' };
    }
    if (!['ids', 'all'].includes(normalized.stats.mode)) {
        normalized.stats = { ...normalized.stats, mode: 'ids' };
    }
    if (!['featured', 'latest', 'category'].includes(normalized.karya.mode)) {
        normalized.karya = { ...normalized.karya, mode: 'featured' };
    }
    if (!['ids', 'all', 'category'].includes(normalized.layanan_faq.mode)) {
        normalized.layanan_faq = { ...normalized.layanan_faq, mode: 'all' };
    }
    if (!['featured', 'popular', 'latest', 'all'].includes(normalized.layanan.mode)) {
        normalized.layanan = { ...normalized.layanan, mode: 'featured' };
    }
    return normalized;
}

export function normalizeBlogSections(existing) {
    return {
        featured: { type: 'featured', label: 'Pilihan', title: 'Artikel Unggulan', subtitle: 'Pilihan Redaksi kami.', count: 4, ...(existing?.featured ?? {}) },
        latest: { type: 'latest', label: 'Terbaru', title: 'Artikel Terbaru', subtitle: 'Update terbaru dari kami.', count: 6, ...(existing?.latest ?? {}) },
        popular: { type: 'popular', label: 'Terpopuler', title: 'Artikel Populer', subtitle: 'Paling banyak dibaca.', count: 6, ...(existing?.popular ?? {}) },
        tags: { type: 'tags', label: 'Topik', title: 'Topik Populer', count: 12, ...(existing?.tags ?? {}) },
    };
}

export function normalizeGallerySections(existing) {
    return {
        featured: { type: 'featured', label: 'Karya', title: 'Karya Unggulan', subtitle: 'Pilihan kami.', count: 6, ...(existing?.featured ?? {}) },
        latest: { type: 'latest', label: 'Galeri', title: 'Galeri Lengkap', count: 9, ...(existing?.latest ?? {}) },
        tags: { type: 'tags', label: 'Kategori', title: 'Kategori', count: 6, ...(existing?.tags ?? {}) },
    };
}