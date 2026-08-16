@extends('layouts.app')

@section('title', 'Blog')
@section('meta_description', 'Blog Sopian Lalu Imagery - tips fotografi, cerita di balik lensa, dan update terbaru.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Blog',
        'title' => 'Catatan & Cerita di Balik Lensa',
        'subtitle' => 'Tips, pengalaman, dan kisah di balik setiap sesi pemotretan.',
    ])

    @include('partials.blog-filters')

    @if ($posts->isEmpty())
        <section class="container-site pb-20">
            <div class="card mt-8 p-12 text-center">
                @if (request('q'))
                    <p class="text-ink">Belum ada artikel dengan kata kunci “{{ request('q') }}”.</p>
                @elseif (request('category') || request('tag'))
                    <p class="text-ink">Belum ada artikel pada filter ini.</p>
                @else
                    <p class="text-ink">Belum ada artikel.</p>
                @endif
                <p class="mt-1 text-sm text-ink-muted">Coba ubah kata kunci atau filter pencarian.</p>
            </div>
        </section>
    @else
        @if (! request()->hasAny(['category', 'tag', 'q']) && $featured->isNotEmpty())
            @php
                $featuredItems = $featured->values();
                $fallbackCount = $featuredCount - $featuredItems->count();
                $rows = [];
                if ($featuredCount >= 2) $rows[] = ['cols' => 2, 'items' => $featuredItems->slice(0, 2)->values()];
                if ($featuredCount >= 5) $rows[] = ['cols' => 3, 'items' => $featuredItems->slice(2, 3)->values()];
                if ($featuredCount >= 7) $rows[] = ['cols' => 2, 'items' => $featuredItems->slice(5, 2)->values()];
                if ($featuredCount >= 10) $rows[] = ['cols' => 3, 'items' => $featuredItems->slice(7, 3)->values()];
                $rowIndex = 0;
            @endphp
            <section id="artikel" class="container-site pt-12">
                <div class="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Pilihan Redaksi</p>
                        <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Unggulan</h2>
                    </div>
                    @if ($featuredTotal > $featuredCount)
                        <a href="{{ route('blog') }}?section=featured" class="btn-link shrink-0">Lihat Semua <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                    @endif
                </div>
                <div class="space-y-px overflow-hidden rounded-xl border border-line bg-line">
                    @foreach ($rows as $row)
                        <div class="grid grid-cols-1 gap-px bg-line {{ $row['cols'] === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3' }}">
                            @foreach ($row['items'] as $post)
                                <div class="bg-surface p-5">
                                    @include('partials.blog-card', ['post' => $post, 'compact' => $row['cols'] === 3])
                                </div>
                            @endforeach
                            @for ($i = 0; $i < max(0, $row['cols'] - $row['items']->count()); $i++)
                                <div class="bg-surface p-5">
                                    <div class="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface-muted/50 p-6 text-center">
                                        @if ($rowIndex % 2 === 0)
                                            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/15 text-brand-600 dark:text-brand-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                            </span>
                                            <div>
                                                <p class="font-semibold text-ink">Butuh Layanan Fotografi?</p>
                                                <p class="mt-1 text-sm text-ink-muted">Temukan paket yang paling cocok untuk kebutuhan Anda.</p>
                                            </div>
                                            <a href="{{ route('services') }}" class="btn-primary">Lihat Layanan</a>
                                        @else
                                            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/15 text-brand-600 dark:text-brand-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                                            </span>
                                            <div>
                                                <p class="font-semibold text-ink">Siap Booking Pemotretan?</p>
                                                <p class="mt-1 text-sm text-ink-muted">Pesan jadwal sekarang, tinggal pilih tanggalnya.</p>
                                            </div>
                                            <a href="{{ route('booking') }}" class="btn-dark">Booking Sekarang</a>
                                        @endif
                                    </div>
                                </div>
                            @endfor
                        </div>
                        @php $rowIndex++; @endphp
                    @endforeach
                </div>
            </section>
        @endif

        <section class="container-site pb-12 pt-12">
            <div class="mb-6 flex items-end justify-between gap-4">
                <div>
                    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terbaru</p>
                    <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Terbaru</h2>
                </div>
                @if (request()->hasAny(['category', 'tag', 'q']))
                    <a href="{{ route('blog') }}" class="btn-link shrink-0">Semua Artikel <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                @elseif ($latestTotal > $latestCount)
                    <a href="{{ route('blog') }}?section=latest" class="btn-link shrink-0">Lihat Semua <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                @endif
            </div>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                @foreach ($posts->take($latestCount) as $post)
                    @include('partials.blog-card', ['post' => $post])
                @endforeach
            </div>

            @if (request()->hasAny(['category', 'tag', 'q']))
                <div class="mt-10">
                    {{ $posts->links() }}
                </div>
            @endif
        </section>

        @if (! request()->hasAny(['category', 'tag', 'q']) && $popular->isNotEmpty())
            <section class="border-y border-line bg-surface-muted/50">
                <div class="container-site py-12">
                    <div class="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terpopuler</p>
                            <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Populer</h2>
                        </div>
                        @if ($popularTotal > $popularCount)
                            <a href="{{ route('blog') }}?section=popular" class="btn-link shrink-0">Lihat Semua <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                        @endif
                    </div>
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach ($popular->take($popularCount) as $post)
                            @include('partials.blog-card', ['post' => $post, 'compact' => true])
                        @endforeach
                    </div>
                </div>
            </section>
        @endif
    @endif

    @if ($tags->isNotEmpty())
        <section class="container-site py-12">
            <div class="mb-6">
                <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Topik</p>
                <h2 class="text-2xl font-bold tracking-tight text-ink">Topik Populer</h2>
            </div>
            <div class="flex flex-wrap gap-2">
                @foreach ($tags->sortByDesc('posts_count')->take(12) as $tag)
                    <a href="{{ route('blog.tag', $tag->slug) }}" class="chip">{{ $tag->name }} <span class="text-xs text-ink-muted">({{ $tag->posts_count }})</span></a>
                @endforeach
            </div>
        </section>
    @endif
@endsection
