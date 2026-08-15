@extends('layouts.app')

@section('title', 'Galeri')
@section('meta_description', 'Kumpulan karya foto dan video Sopian Lalu Imagery - dokumentasi wedding, prewedding, event, dan portrait.')

@section('content')
    @php
        $galleryIntro = \App\Models\LandingContent::getValue('gallery_intro', '');
    @endphp

    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Galeri',
        'title' => 'Karya Kami',
        'subtitle' => $galleryIntro,
    ])

    @include('partials.gallery-filters', ['activeCategory' => null])

    <section class="container-site py-16">
        <div class="masonry">
            @foreach ($portfolios as $portfolio)
<div class="reveal mb-5 break-inside-avoid" data-gallery-item data-category="{{ $portfolio->categories->first()?->slug ?? '' }}">
                        <a href="{{ route('gallery.show', $portfolio->slug) }}" class="group relative block overflow-hidden rounded-2xl ring-1 ring-line">
                            <img src="{{ $portfolio->thumbnail_url }}" alt="{{ $portfolio->title }}" loading="lazy" class="w-full transition-transform duration-500 group-hover:scale-105">
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

        @if ($portfolios->hasPages())
            <div class="mt-12">
                {{ $portfolios->links() }}
            </div>
        @endif
    </section>

    @include('components.lightbox')
@endsection
