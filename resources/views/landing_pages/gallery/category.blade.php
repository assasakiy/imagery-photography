@extends('layouts.app')

@section('title', $category['name'] . ' — Galeri')
@section('meta_description', 'Kumpulan karya kategori ' . $category['name'] . ' di galeri Sopian Lalu Imagery.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-16 md:py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Kategori</p>
            <h1 class="section-heading text-ink">{{ $category['name'] }}</h1>
            @if ($page?->description)
                <div class="rich-content mt-4 max-w-2xl text-ink-muted">{!! content_html($page->description) !!}</div>
            @endif
        </div>
    </section>

    @include('partials.gallery-filters', ['activeCategory' => $category['slug']])

    <section class="container-site py-12">
        <nav class="mb-8 text-sm text-ink-muted">
            <a href="{{ route('home') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span class="mx-2">/</span>
            <a href="{{ route('gallery') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Galeri</a>
            <span class="mx-2">/</span>
            <span class="text-ink">{{ $category['name'] }}</span>
        </nav>

        @if ($portfolios->isEmpty())
            <div class="card p-12 text-center">
                <p class="text-ink">Belum ada karya di kategori ini.</p>
            </div>
        @else
            <div class="mb-6">
                <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Karya</p>
                <h2 class="section-heading text-ink">{{ $portfolios->total() }} Karya</h2>
            </div>
            <div class="masonry">
                @foreach ($portfolios as $portfolio)
                    <div class="reveal mb-5 break-inside-avoid">
                        <a href="{{ route('gallery.show', $portfolio->slug) }}" class="group relative block overflow-hidden rounded-2xl ring-1 ring-line">
                            <img src="{{ $portfolio->thumbnail_url }}" alt="{{ $portfolio->title }}" loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" class="w-full transition-transform duration-500 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100"></div>
                            <div class="absolute inset-x-0 bottom-0 p-4 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:opacity-100">
                                <p class="text-[10px] font-semibold uppercase tracking-widest text-brand-300">{{ $portfolio->categories->isNotEmpty() ? $portfolio->categories->pluck('name')->join(', ') : '' }}</p>
                                <h3 class="text-sm font-bold text-white">{{ $portfolio->title }}</h3>
                            </div>
                            @if ($portfolio->is_featured)
                                <span class="absolute left-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">Unggulan</span>
                            @endif
                        </a>
                    </div>
                @endforeach
            </div>
            <div class="mt-10">
                {{ $portfolios->links() }}
            </div>
        @endif
    </section>
@endsection