@extends('layouts.app')

@section('title', 'Beranda')
@section('meta_description', 'Sopian Lalu Imagery - Photography & Videography profesional. Mengabadikan momen berharga Anda di Lombok.')

@section('content')
    @php
        $heroImage = \App\Services\AssetResolver::landingImage('hero_image', \App\Services\AssetResolver::DEFAULT_HERO_IMAGE);
        $aboutImage = \App\Services\AssetResolver::landingImage('about_image', \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE);
    @endphp

    {{-- Hero --}}
    <section class="relative flex min-h-[88vh] items-center overflow-hidden">
        <div class="absolute inset-0">
            <img src="{{ $heroImage }}" alt="Hero Sopian Lalu Imagery" class="h-full w-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950 dark:from-black/80 dark:via-black/60 dark:to-zinc-950"></div>
            <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"></div>
            <div class="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"></div>
        </div>

        <div class="container-site relative py-24">
            <div class="max-w-2xl">
                <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
                    <span class="h-2 w-2 rounded-full bg-brand-400"></span>
                    Photography & Videography
                </p>
                <h1 class="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                    {{ $contents['hero_title'] ?? 'Sopian Lalu Imagery' }}
                </h1>
                <p class="mt-5 max-w-xl text-base leading-relaxed text-zinc-200 sm:text-lg">
                    {!! content_html($contents['hero_subtitle'] ?? 'Mengabadikan momen berharga Anda menjadi warisan visual.') !!}
                </p>
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="{{ route('gallery') }}" class="btn-primary">
                        Lihat Galeri
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </a>
                    <a href="{{ route('services') }}" class="btn border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20">Lihat Layanan</a>
                </div>
            </div>
        </div>

        <a href="#tentang" class="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 transition-colors hover:text-white md:flex" aria-label="Scroll ke bawah">
            <span class="text-xs uppercase tracking-widest">Scroll</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </a>
    </section>

    {{-- About --}}
    <section id="tentang" class="py-24">
        <div class="container-site grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div class="reveal order-2 lg:order-1">
                <div class="relative overflow-hidden rounded-3xl ring-1 ring-line">
                    <img src="{{ $aboutImage }}" alt="{{ $contents['about_title'] ?? 'Tentang Kami' }}" class="aspect-[4/5] w-full object-cover lg:aspect-square">
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/30 to-transparent"></div>
                </div>
            </div>
            <div class="reveal order-1 lg:order-2">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Tentang Kami</p>
                <h2 class="section-heading text-ink">{{ $contents['about_title'] ?? 'Tentang Kami' }}</h2>
                <p class="mt-6 leading-relaxed text-ink-muted">{{ Str::limit(content_plain($contents['about_content'] ?? ''), 300) }}</p>
                <div class="mt-8 grid grid-cols-3 gap-4">
                    <div class="card p-4 text-center">
                        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">500+</p>
                        <p class="mt-1 text-xs text-ink-muted">Momen Terabadikan</p>
                    </div>
                    <div class="card p-4 text-center">
                        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">100%</p>
                        <p class="mt-1 text-xs text-ink-muted">Hasil Profesional</p>
                    </div>
                    <div class="card p-4 text-center">
                        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">24/7</p>
                        <p class="mt-1 text-xs text-ink-muted">Siap Dibooking</p>
                    </div>
                </div>
                <a href="{{ route('about') }}" class="btn-dark mt-8">
                    Selengkapnya
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </a>
            </div>
        </div>
    </section>

    {{-- Featured Portfolio --}}
    @if ($portfolios->isNotEmpty())
        <section class="bg-zinc-100/60 py-24 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="reveal mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Portofolio</p>
                        <h2 class="section-heading text-ink">Karya Terpilih</h2>
                    </div>
                    <a href="{{ route('gallery') }}" class="btn-outline shrink-0">Lihat Semua Galeri</a>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($portfolios as $portfolio)
                        <a href="{{ route('gallery.show', $portfolio->slug) }}" class="reveal group relative overflow-hidden rounded-2xl ring-1 ring-line" data-lightbox-trigger data-title="{{ $portfolio->title }}" data-caption="{{ $portfolio->description }}">
                            <img src="{{ watermark_url($portfolio->cover_url) }}" alt="{{ $portfolio->title }}" loading="lazy" class="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"></div>
                            <div class="absolute inset-x-0 bottom-0 translate-y-2 p-5 opacity-90 transition-transform duration-300 group-hover:translate-y-0">
                                <p class="text-xs font-semibold uppercase tracking-widest text-brand-300">{{ $portfolio->category }}</p>
                                <h3 class="mt-1 text-lg font-bold text-white">{{ $portfolio->title }}</h3>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif

    {{-- Services preview --}}
    @if ($services->isNotEmpty())
        <section class="py-24">
            <div class="container-site">
                <div class="reveal mb-12 max-w-2xl">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Layanan</p>
                    <h2 class="section-heading text-ink">Layanan Kami</h2>
                    <p class="mt-4 text-ink-muted">{{ $contents['services_intro'] ?? 'Paket dokumentasi untuk momen spesial Anda.' }}</p>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    @foreach ($services as $service)
                        <div class="reveal card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                            <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
                            <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                @php $icons = ['camera' => 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'video' => 'M22 8l-6 4 6 4V8z M2 6h14v12H2z', 'heart' => 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z']; @endphp
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{{ $icons[$service->icon] ?? $icons['camera'] }}"/></svg>
                            </div>
                            <h3 class="text-lg font-bold text-ink">{{ $service->title }}</h3>
                            <p class="mt-2 text-sm leading-relaxed text-ink-muted">{{ content_plain($service->description) }}</p>
                            @if ($service->starting_price)
                                <p class="mt-5 text-sm text-ink-muted">Mulai dari</p>
                                <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($service->starting_price, 0, ',', '.') }}</p>
                            @endif
                        </div>
                    @endforeach
                </div>

                <div class="reveal mt-12 text-center">
                    <a href="{{ route('services') }}" class="btn-dark">Lihat Semua Paket & Harga</a>
                </div>
            </div>
        </section>
    @endif

    {{-- Reviews --}}
    @if ($reviews->isNotEmpty())
        <section class="py-24">
            <div class="container-site">
                <div class="reveal mb-10 text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Testimoni</p>
                    <h2 class="section-heading text-ink">Kata Klien Kami</h2>
                </div>

                <div class="rating-carousel" data-rating-carousel>
                    <button type="button" class="rating-carousel-btn rating-carousel-btn--prev" data-rating-prev aria-label="Testimoni sebelumnya">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button type="button" class="rating-carousel-btn rating-carousel-btn--next" data-rating-next aria-label="Testimoni berikutnya">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                    <div class="rating-track" data-rating-track>
                        @foreach ($reviews as $review)
                            <div class="rating-slide">
                                <div class="reveal card flex h-full flex-col p-6">
                                    <div class="flex items-center gap-1" aria-label="{{ $review->rating }} dari 5 bintang">
                                        @for ($i = 1; $i <= 5; $i++)
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="{{ $i <= $review->rating ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 {{ $i <= $review->rating ? 'text-amber-400' : 'text-ink-muted' }}">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                                            </svg>
                                        @endfor
                                    </div>
                                    <p class="mt-4 flex-1 text-sm leading-relaxed text-ink-muted">"{{ $review->content }}"</p>
                                    <div class="mt-5 flex items-center gap-3">
                                        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-600 dark:text-brand-400">
                                            {{ collect(explode(' ', trim($review->name)))->filter()->take(2)->map(fn ($w) => strtoupper(mb_substr($w, 0, 1)))->join('') }}
                                        </span>
                                        <div>
                                            <p class="text-sm font-bold text-ink">{{ $review->name }}</p>
                                            @if ($review->service)
                                                <p class="text-xs text-ink-muted">{{ $review->service }}</p>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <div class="rating-dots mt-8" data-rating-dots></div>
            </div>
        </section>
    @endif

    {{-- FAQ --}}
    @if ($faqs->isNotEmpty())
        <section class="bg-zinc-100/60 py-24 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="reveal mb-12 max-w-2xl">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">FAQ</p>
                    <h2 class="section-heading text-ink">Pertanyaan Umum</h2>
                </div>

                <div class="mx-auto max-w-3xl space-y-3">
                    @foreach ($faqs->take(5) as $faq)
                        <details class="reveal group card p-0">
                            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-ink [&::-webkit-details-marker]:hidden">
                                {{ $faq->question }}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-ink-muted transition-transform duration-300 group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                            </summary>
                            <div class="rich-content px-6 pb-6">
                                {!! content_html($faq->answer) !!}
                            </div>
                        </details>
                    @endforeach
                </div>

                <div class="reveal mt-10 text-center">
                    <a href="{{ route('faq') }}" class="btn-outline">Lihat Semua FAQ</a>
                </div>
            </div>
        </section>
    @endif

    {{-- Latest articles (paling bawah) --}}
    @if ($blogs->isNotEmpty())
        <section class="bg-zinc-100/60 py-24 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="reveal mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Blog</p>
                        <h2 class="section-heading text-ink">Artikel Terbaru</h2>
                    </div>
                    <a href="{{ route('blog') }}" class="btn-outline shrink-0">Semua Artikel</a>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    @foreach ($blogs as $post)
                        <a href="{{ route('blog.show', $post->slug) }}" class="reveal card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                            <div class="aspect-[16/9] overflow-hidden">
                                <img src="{{ $post->resolveCoverUrl() }}" alt="{{ $post->title }}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                @if ($post->category)
                                    <p class="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $post->category->name }}</p>
                                @endif
                                <h3 class="mt-2 line-clamp-2 text-lg font-bold text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $post->title }}</h3>
                                @if ($post->excerpt)
                                    <p class="mt-2 line-clamp-2 text-sm text-ink-muted">{{ $post->excerpt }}</p>
                                @endif
                                <div class="mt-auto pt-4 text-xs text-ink-muted">
                                    {{ $post->published_at?->translatedFormat('d M Y') }}
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif
@endsection
