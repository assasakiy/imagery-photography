@extends('layouts.app')

@section('title', $portfolio->title)
@section('meta_description', Str::limit(strip_tags($portfolio->description), 160))

@section('content')
    @php
        $categoryImages = $related->map(fn ($p) => ['title' => $p->title, 'url' => $p->cover_url])->all();
    @endphp

    <section class="container-site py-16">
        <nav class="mb-8 flex items-center gap-2 text-sm text-ink-muted" aria-label="Breadcrumb">
            <a href="{{ route('home') }}" class="transition-colors hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span>/</span>
            <a href="{{ route('gallery') }}" class="transition-colors hover:text-brand-600 dark:hover:text-brand-400">Galeri</a>
            <span>/</span>
            <span class="text-ink">{{ $portfolio->title }}</span>
        </nav>

        <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div class="lg:col-span-3">
                <div class="reveal overflow-hidden rounded-3xl ring-1 ring-line">
                    <button type="button" data-lightbox-trigger data-title="{{ $portfolio->title }}" data-caption="{{ $portfolio->categories->isNotEmpty() ? $portfolio->categories->pluck('name')->join(', ') : '' }}" class="block w-full cursor-zoom-in">
                        <img src="{{ watermark_url($portfolio->cover_url) }}" data-full="{{ watermark_url($portfolio->cover_url) }}" alt="{{ $portfolio->title }}" class="w-full">
                    </button>
                </div>
            </div>

            <div class="lg:col-span-2">
                <div class="reveal sticky top-24">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $portfolio->categories->isNotEmpty() ? $portfolio->categories->pluck('name')->join(', ') : '' }}</p>
                    <h1 class="text-3xl font-bold leading-tight text-ink sm:text-4xl">{{ $portfolio->title }}</h1>
                    <p class="mt-5 leading-relaxed text-ink-muted">{{ $portfolio->description }}</p>

                    <div class="mt-8 space-y-3">
                        <a href="{{ route('contact') }}" class="btn-primary w-full">Pesan Paket Serupa</a>
                        <a href="{{ route('gallery') }}" class="btn-outline w-full">Kembali ke Galeri</a>
                    </div>

                    <div class="mt-10 rounded-2xl border border-line bg-zinc-100/60 p-5 dark:bg-zinc-900/40">
                        <h2 class="text-sm font-semibold uppercase tracking-wider text-ink">Butuh bantuan?</h2>
                        <p class="mt-2 text-sm text-ink-muted">
                            Konsultasikan kebutuhan dokumentasi Anda. Kami siap membantu memilih paket yang tepat.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        @if ($related->isNotEmpty())
            <div class="mt-20">
                <div class="mb-8 flex items-end justify-between">
                    <div>
                        <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Lainnya</p>
                        <h2 class="section-heading text-ink">Karya Terkait</h2>
                    </div>
                    <a href="{{ route('gallery') }}" class="btn-ghost shrink-0">Semua Galeri</a>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($related as $item)
                        <a href="{{ route('gallery.show', $item->slug) }}" class="group relative block overflow-hidden rounded-2xl ring-1 ring-line">
                            <img src="{{ $item->thumbnail_url }}" alt="{{ $item->title }}" loading="lazy" class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-4">
                                <h3 class="text-sm font-bold text-white">{{ $item->title }}</h3>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        @endif
    </section>

    @include('components.lightbox')
@endsection
