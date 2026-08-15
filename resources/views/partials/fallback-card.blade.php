@props(['type' => 'services'])

@php
    $map = [
        'services' => ['title' => 'Lihat Layanan', 'text' => 'Temukan paket fotografi & videography yang cocok untuk momen Anda.', 'href' => route('services'), 'icon' => 'services'],
        'gallery' => ['title' => 'Lihat Karya', 'text' => 'Jelajahi portofolio kami yang paling dicari.', 'href' => route('gallery'), 'icon' => 'gallery'],
        'booking' => ['title' => 'Booking Sekarang', 'text' => 'Pesan jadwal pemotretan, tinggal pilih tanggalnya.', 'href' => route('booking'), 'icon' => 'booking'],
        'blog' => ['title' => 'Baca Blog', 'text' => 'Temukan tips dan kisah di balik setiap sesi pemotretan.', 'href' => route('blog'), 'icon' => 'blog'],
    ];
    $card = $map[$type] ?? $map['services'];
@endphp

<div class="group flex h-full flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface-muted/40 p-6 text-center">
    <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/15 text-brand-600 dark:text-brand-400">
        @switch($card['icon'])
            @case('services')
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            @break
            @case('gallery')
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M17 11l-5 5-3-3-5 5v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5.5"/></svg>
            @break
            @case('booking')
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect width="18" height="18" x="3" y="5" ry="2"/><path d="M16 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"/><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            @break
            @case('blog')
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M4 19.5V5a2 2 0 0 1 2-2h8.5l6.5 6.5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 9h8"/><path d="M8 13h4"/></svg>
            @break
            @default
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><circle cx="12" cy="12" r="10"/></svg>
        @endswitch
    </span>
    <p class="font-semibold text-ink">{{ $card['title'] }}</p>
    <p class="mt-1 text-sm text-ink-muted">{{ $card['text'] }}</p>
    <a href="{{ $card['href'] }}" class="btn-primary mt-auto text-xs">{{ $card['title'] }}</a>
</div>
