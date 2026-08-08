@extends('layouts.app')

@section('title', 'Blog')
@section('meta_description', 'Blog Sopian Lalu Imagery - tips fotografi, cerita di balik lensa, dan update terbaru.')

@section('content')
    <section class="border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Blog</p>
            <h1 class="section-heading text-ink">Catatan &amp; Cerita di Balik Lensa</h1>
            <p class="mt-4 max-w-2xl text-ink-muted">
                Tips, pengalaman, dan kisah di balik setiap sesi pemotretan.
            </p>
        </div>
    </section>

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
            <section id="artikel" class="container-site pt-12">
                <div class="mb-6">
                    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Pilihan Redaksi</p>
                    <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Unggulan</h2>
                </div>
                <div class="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
                    @foreach ($featured->take(2) as $post)
                        <div class="bg-surface p-5 md:p-6">
                            @include('partials.blog-card', ['post' => $post])
                        </div>
                    @endforeach
                    @if ($featured->count() > 2)
                        <div class="grid grid-cols-1 gap-px divide-y divide-line border-t border-line bg-line md:col-span-2 md:grid-cols-3 md:divide-x md:divide-y-0 md:border-t-0">
                            @foreach ($featured->slice(2, 3) as $post)
                                <div class="bg-surface p-5">
                                    @include('partials.blog-card', ['post' => $post, 'compact' => true])
                                </div>
                            @endforeach
                            @for ($i = 0; $i < max(0, 5 - $featured->count()); $i++)
                                <div class="bg-surface p-5">
                                    <div class="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface-muted/50 p-6 text-center">
                                        @if ($i === 0)
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
                    @endif
                </div>
            </section>
        @endif

        <section class="container-site pb-12 pt-12">
            <div class="mb-6">
                <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terbaru</p>
                <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Terbaru</h2>
            </div>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                @foreach ($posts as $post)
                    @include('partials.blog-card', ['post' => $post])
                @endforeach
            </div>

            <div class="mt-10">
                {{ $posts->links() }}
            </div>
        </section>

        @if (! request()->hasAny(['category', 'tag', 'q']) && $popular->isNotEmpty())
            <section class="border-y border-line bg-surface-muted/50">
                <div class="container-site py-12">
                    <div class="mb-6">
                        <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terpopuler</p>
                        <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Populer</h2>
                    </div>
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        @foreach ($popular as $post)
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
