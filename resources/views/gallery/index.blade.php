@extends('layouts.app')

@section('title', 'Galeri')
@section('meta_description', 'Kumpulan karya foto dan video Sopian Lalu Imagery - dokumentasi wedding, prewedding, event, dan portrait.')

@section('content')
    @php
        $galleryIntro = \App\Models\LandingContent::getValue('gallery_intro', '');
    @endphp

    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Galeri</p>
            <h1 class="section-heading text-ink">Karya Kami</h1>
            @if ($galleryIntro)
                <p class="mt-4 max-w-2xl text-ink-muted">{{ $galleryIntro }}</p>
            @endif
        </div>
    </section>

    <section class="container-site py-16">
        <div class="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
            <button type="button" data-filter="all" aria-pressed="true" class="chip chip-active">Semua</button>
            @foreach ($categories as $category)
                <button type="button" data-filter="{{ $category }}" aria-pressed="false" class="chip">{{ $category }}</button>
            @endforeach
        </div>

        <div class="masonry">
            @foreach ($portfolios as $portfolio)
                <div class="reveal mb-5 break-inside-avoid" data-gallery-item data-category="{{ $portfolio->category }}">
                    <a href="{{ route('gallery.show', $portfolio->slug) }}" class="group relative block overflow-hidden rounded-2xl ring-1 ring-line" data-lightbox-trigger data-title="{{ $portfolio->title }}" data-caption="{{ $portfolio->description }}">
                        <img src="{{ $portfolio->cover_url }}" alt="{{ $portfolio->title }}" loading="lazy" class="w-full transition-transform duration-500 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                        <div class="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                            <p class="text-[10px] font-semibold uppercase tracking-widest text-brand-300">{{ $portfolio->category }}</p>
                            <h3 class="text-sm font-bold text-white">{{ $portfolio->title }}</h3>
                        </div>
                        @if ($portfolio->is_featured)
                            <span class="absolute left-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">Unggulan</span>
                        @endif
                    </a>
                </div>
            @endforeach
        </div>

        @if ($portfolios->hasPages())
            <div class="mt-12">
                {{ $portfolios->links() }}
            </div>
        @endif
    </section>

    @include('components.lightbox')
@endsection
