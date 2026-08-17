export function normalizeSections(existing) {
    const defaults = {
        hero: { type: 'hero', title: '', subtitle: '', button_text: '', button_link: '' },
        about: { type: 'about', subtitle: '', title: '', description: '', content: '', button_text: '', button_link: '', image: '' },
        reviews: { type: 'reviews', subtitle: '', title: '', mode: 'all', all_ratings: [1, 2, 3, 4, 5], star: 5, min_star: 3, items: [] },
        faq: { type: 'faq', subtitle: '', title: '', mode: 'ids', items: [], categories: [] },
        stats: { type: 'stats', mode: 'ids', items: [] },
        blog: { type: 'blog', subtitle: '', title: '', limit: 3 },
        cta: { type: 'cta', title: '', description: '', button_text: '', button_link: '' },
        timeline: { type: 'timeline', data: [] },
    };

    const normalized = { ...defaults };
    if (Array.isArray(existing)) {
        existing.forEach(sec => {
            if (sec.type && defaults[sec.type]) {
                normalized[sec.type] = { ...defaults[sec.type], ...sec };
            }
        });
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