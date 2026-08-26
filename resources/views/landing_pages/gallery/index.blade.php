@extends('layouts.app')

@section('title', 'Galeri')
@section('meta_description', 'Kumpulan karya foto dan video Sopian Lalu Imagery - dokumentasi wedding, prewedding, event, dan portrait.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Galeri',
        'title' => 'Karya Kami',
    ])

    @include('partials.gallery-filters', ['activeCategory' => null])

    <section class="container-site py-16">
        <div class="masonry">
            @foreach ($portfolios as $portfolio)
<div class="reveal mb-5 break-inside-avoid" data-gallery-item data-category="{{ $portfolio->categories->first()?->slug ?? '' }}">
                        <a href="{{ route('gallery.show', $portfolio->slug) }}" class="group relative block overflow-hidden rounded-2xl ring-1 ring-line">
                            <img src="{{ $portfolio->thumbnail_url }}" alt="{{ $portfolio->title }}" loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" class="w-full transition-transform duration-500 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100"></div>
                            <div class="absolute inset-x-0 bottom-0 p-4 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:opacity-100">
                                <p class="text-[10px] font-semibold uppercase tracking-widest text-brand-300">{{ $portfolio->categories->isNotEmpty() ? $portfolio->categories->pluck('name')->join(', ') : '' }}</p>
                            <h3 class="text-sm font-bold text-white">{{ $portfolio->title }}</h3>
                        </div>
                        @if ($portfolio->is_featured)
                            <span class="accent-surface absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Unggulan</span>
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
