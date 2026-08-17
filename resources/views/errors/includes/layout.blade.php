@php
    $defaults = [
        '400' => ['code' => '400', 'title' => 'Permintaan Tidak Valid', 'message' => 'Sepertinya ada sesuatu yang salah dengan permintaan Anda. Silakan coba lagi.'],
        '403' => ['code' => '403', 'title' => 'Akses Ditolak', 'message' => 'Anda tidak memiliki izin untuk mengakses halaman ini.'],
        '404' => ['code' => '404', 'title' => 'Halaman Tidak Ditemukan', 'message' => 'Halaman yang Anda cari tidak ada atau telah dipindahkan.'],
        '419' => ['code' => '419', 'title' => 'Sesi Kedaluwarsa', 'message' => 'Sesi Anda telah kedaluwarsa. Silakan muat ulang halaman dan coba lagi.'],
        '429' => ['code' => '429', 'title' => 'Terlalu Banyak Permintaan', 'message' => 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu sebentar lalu coba lagi.'],
        '500' => ['code' => '500', 'title' => 'Terjadi Kesalahan', 'message' => 'Terjadi kesalahan pada server. Tim kami sedang menangani masalah ini.'],
        '503' => ['code' => '503', 'title' => 'Layanan Tidak Tersedia', 'message' => 'Kami sedang melakukan pemeliharaan. Silakan kembali beberapa saat lagi.'],
    ];
    $meta = $defaults[$status] ?? $defaults['500'];
    $iconFor = [
        '400' => '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/><path d="M12 8v4M12 16h.01"/>',
        '403' => '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        '404' => '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h2M12 11h2"/>',
        '419' => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        '429' => '<path d="M6 16v2M10 14v4M14 12v6M18 10v8"/><path d="M2 8h20l-2 14H4L2 8Z"/>',
        '500' => '<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>',
        '503' => '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><path d="M2 2l20 20"/>',
    ];
    $icon = $iconFor[$status] ?? $iconFor['500'];
@endphp

<section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
    <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
    <div class="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-600/5 blur-3xl"></div>
    <div class="container-site flex flex-col items-center py-20 text-center md:py-28">
        <p class="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terjadi Kendala</p>
        <h1 class="section-heading text-ink">{{ $meta['title'] }}</h1>
        <p class="mx-auto mt-4 max-w-xl leading-relaxed text-ink-muted">{{ $meta['message'] }} <span class="font-semibold text-ink">({{ $meta['code'] }})</span></p>

        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="{{ route('home') }}" class="btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Kembali ke Beranda
            </a>
            <a href="{{ route('contact') }}" class="btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                Hubungi Kami
            </a>
        </div>
    </div>
</section>