@extends('layouts.app')

@section('title', 'Beranda')
@section('meta_description', 'Sopian Lalu Imagery - Photography & Videography profesional. Mengabadikan momen berharga Anda di Lombok.')

@section('content')
    @php
        $heroImage = \App\Services\AssetResolver::pageImage($page, 'hero_image', \App\Services\AssetResolver::DEFAULT_HERO_IMAGE, 'hero');
        $aboutImage = \App\Services\AssetResolver::pageImage($page, 'about_image', \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE, 'preview');
        $homeBadge = $page->badge ?: 'Photography & Videography';
        $homeTitle = $page->hero_title ?: 'Sopian Lalu Imagery';
        $homeSubtitle = $page->hero_subtitle ?: 'Mengabadikan momen berharga Anda menjadi warisan visual.';
        $homeBtnText = $page->button_text ?: 'Lihat Galeri';
        $homeBtnLink = $page->button_link ?: route('gallery');
        $homeBtn2Text = $page->button2_text ?: 'Lihat Layanan';
        $homeBtn2Link = $page->button2_link ?: route('services');
        $homeSections = is_array($page->sections) ? $page->sections : [];
        $homeAbout = collect($homeSections)->firstWhere('type', 'about') ?? [];
        $tentangPage = \App\Models\Page::where('slug', 'tentang')->first();
        $tentangSections = collect(is_array($tentangPage?->sections) ? $tentangPage->sections : []);
        $tentangCerita = $tentangSections->firstWhere('type', 'cerita') ?: [];
        $homeAboutSubtitle = $homeAbout['subtitle'] ?? ($tentangPage?->hero_title ?: $tentangPage?->title ?: 'Tentang Kami');
        $homeAboutTitle = $homeAbout['title'] ?? ($tentangCerita['title'] ?? ($tentangPage?->hero_title ?: $tentangPage?->title ?: 'Tentang Kami'));
        $homeAboutContent = trim($homeAbout['content'] ?? '') !== '' ? $homeAbout['content'] : (trim((string) ($homeAbout['description'] ?? '')) !== '' ? $homeAbout['description'] : (trim((string) ($tentangCerita['content'] ?? '')) !== '' ? $tentangCerita['content'] : ($tentangPage?->content ?? '')));
        $karyaSubtitle = $karyaSec['subtitle'] ?? 'Portofolio';
        $karyaTitle = $karyaSec['title'] ?? 'Karya Terpilih';
        $layananSubtitle = $layananSec['subtitle'] ?? 'Layanan';
        $layananTitle = $layananSec['title'] ?? 'Layanan Kami';
        $layananIntro = $layananSec['description'] ?? $servicesIntro;
    @endphp

    {{-- Hero --}}
    <section class="relative flex min-h-[88vh] items-center overflow-hidden">
        <img src="{{ $heroImage }}" alt="Hero Sopian Lalu Imagery" width="1600" height="900" fetchpriority="high" decoding="async" onload="this.classList.remove('blur-sm','scale-[1.02]')" class="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center blur-sm transition duration-500">
        <div class="absolute inset-0 bg-zinc-950/70 dark:bg-black/70"></div>

        <div class="container-site relative py-24">
            <div class="max-w-2xl">
                <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
                    <span class="h-2 w-2 rounded-full bg-brand-400"></span>
                    {{ $homeBadge }}
                </p>
                <h1 class="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                    {{ $homeTitle }}
                </h1>
                <div class="hero-content mt-5 max-w-xl text-base leading-relaxed text-zinc-200 sm:text-lg">
                    {!! content_html($homeSubtitle) !!}
                </div>
                <div class="mt-8 flex flex-wrap gap-3">
                    <a href="{{ $homeBtnLink }}" class="btn-primary">
                        {{ $homeBtnText }}
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </a>
                    @if ($homeBtn2Text)
                        <a href="{{ $homeBtn2Link }}" class="btn border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20">{{ $homeBtn2Text }}</a>
                    @endif
                </div>
            </div>
        </div>

        <a href="#tentang" class="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center text-white/40 transition-colors hover:text-white md:flex" aria-label="Scroll ke bawah">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="animate-bounce"><path d="m6 9 6 6 6-6"/></svg>
        </a>
    </section>

    {{-- About --}}
    <section id="tentang" class="py-24">
        <div class="container-site grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div class="reveal order-2 lg:order-1">
                <div class="relative overflow-hidden rounded-3xl ring-1 ring-line">
                    <img src="{{ $aboutImage }}" alt="{{ $homeAboutTitle }}" width="1200" height="1200" loading="lazy" decoding="async" class="aspect-[4/5] w-full object-cover lg:aspect-square">
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/30 to-transparent"></div>
                </div>
            </div>
            <div class="reveal order-1 lg:order-2">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $homeAboutSubtitle }}</p>
                <h2 class="section-heading text-ink">{{ $homeAboutTitle }}</h2>
                <p class="mt-6 leading-relaxed text-ink-muted">{{ content_first_sentences($homeAboutContent, 3) }}</p>
                @if ($aboutStats->isNotEmpty())
                <div class="mt-8 grid grid-cols-3 gap-4">
                    @foreach ($aboutStats as $stat)
                        <div class="card p-4 text-center">
                            <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">{{ $stat->resolved_value }}<span class="text-lg">{{ $stat->suffix }}</span></p>
                            <p class="mt-1 text-xs text-ink-muted">{{ $stat->label }}</p>
                        </div>
                    @endforeach
                </div>
                @endif
                <div class="mt-8">
                    <a href="{{ route('about') }}" class="btn-dark">Selengkapnya</a>
                </div>
            </div>
        </div>
    </section>

    {{-- Featured Portfolio --}}
    @if ($portfolios->isNotEmpty())
        <section class="bg-zinc-100/60 py-24 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="reveal mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $karyaSubtitle }}</p>
                        <h2 class="section-heading text-ink">{{ $karyaTitle }}</h2>
                    </div>
                    <a href="{{ route('gallery') }}" class="btn-link shrink-0">Lihat Semua Galeri <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                </div>

                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($portfolios as $portfolio)
                        <a href="{{ route('gallery.show', $portfolio->slug) }}" class="reveal group relative overflow-hidden rounded-2xl ring-1 ring-line">
                            <img src="{{ $portfolio->thumbnail_url }}" alt="{{ $portfolio->title }}" width="800" height="1000" loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" class="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"></div>
                            <div class="absolute inset-x-0 bottom-0 translate-y-2 p-5 opacity-90 transition-transform duration-300 group-hover:translate-y-0">
                                <p class="text-xs font-semibold uppercase tracking-widest text-brand-300">{{ $portfolio->categories->isNotEmpty() ? $portfolio->categories->pluck('name')->join(', ') : '' }}</p>
                                <h3 class="mt-1 text-lg font-bold text-white">{{ $portfolio->title }}</h3>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif

    {{-- Services preview --}}
    @if ($packages->isNotEmpty())
        <section class="py-24">
            <div class="container-site">
                <div class="reveal mb-12 max-w-2xl">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $layananSubtitle }}</p>
                    <h2 class="section-heading text-ink">{{ $layananTitle }}</h2>
                    <div class="rich-content mt-4 text-ink-muted">{!! content_html($layananIntro) !!}</div>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    @foreach ($packages as $pkg)
                        <div class="reveal card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
<div class="mb-4 flex items-center gap-3">
                    @if ($pkg->is_featured)
                        <span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Unggulan</span>
                    @elseif ($pkg->booking_count > 0)
                        <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Populer</span>
                    @endif
                </div>
                <h3 class="text-lg font-bold text-ink">{{ $pkg->name }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-ink-muted">{{ $pkg->summary() }}</p>
                <div class="pt-5">
                    @if ($pkg->discountValue() > 0)
                        <p class="text-sm text-ink-muted line-through">Rp {{ number_format($pkg->basePrice(), 0, ',', '.') }}</p>
                        <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($pkg->discountValue(), 0, ',', '.') }}</p>
                    @else
                        <p class="text-sm text-ink-muted">Mulai dari</p>
                    @endif
                    <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($pkg->computedPrice(), 0, ',', '.') }}</p>
                </div>
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
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $reviewSec['subtitle'] ?? 'Testimoni' }}</p>
                    <h2 class="section-heading text-ink">{{ $reviewSec['title'] ?? 'Kata Klien Kami' }}</h2>
                </div>

                <div class="rating-carousel" data-rating-carousel>
                    <button type="button" class="rating-carousel-btn rating-carousel-btn--prev opacity-0 pointer-events-none" data-rating-prev aria-label="Testimoni sebelumnya">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button type="button" class="rating-carousel-btn rating-carousel-btn--next opacity-0 pointer-events-none" data-rating-next aria-label="Testimoni berikutnya">
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
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $faqSec['subtitle'] ?? 'FAQ' }}</p>
                    <h2 class="section-heading text-ink">{{ $faqSec['title'] ?? 'Pertanyaan Umum' }}</h2>
                </div>

                <div class="mx-auto max-w-3xl space-y-3">
                    @foreach ($faqs as $faq)
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
                    <a href="{{ route('blog') }}" class="btn-link shrink-0">Semua Artikel <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    @foreach ($blogs as $post)
                        <a href="{{ route('blog.show', $post->slug) }}" class="reveal card group flex flex-col overflow-hidden transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <div class="aspect-[16/9] overflow-hidden">
                                <img src="{{ $post->thumbnail_url }}" alt="{{ $post->title }}" width="400" height="250" loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            </div>
                            <div class="flex flex-1 flex-col p-5">
                                @if ($post->categories->isNotEmpty())
                                    <p class="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $post->categories->first()->name }}</p>
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
