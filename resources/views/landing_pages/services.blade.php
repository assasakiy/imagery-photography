@extends('layouts.app')

@section('title', 'Layanan & Harga')
@section('meta_description', 'Daftar layanan dan paket harga photography & videography Sopian Lalu Imagery - dari paket satuan hingga bundling lengkap.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Layanan',
        'title' => 'Paket & Harga',
    ])

    {{-- Section 2: Paket Populer / Unggulan --}}
    @if ($highlightPackages->isNotEmpty())
        <section class="container-site py-20">
            <div class="mb-12 text-center">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $highlightSubtitle }}</p>
                <h2 class="section-heading text-ink">{{ $highlightTitle }}</h2>
            </div>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                @foreach ($highlightPackages as $pkg)
                    @include('partials.package-card', ['pkg' => $pkg])
                @endforeach
            </div>
        </section>
    @endif

    {{-- Section 3: Paket Satuan --}}
    @if ($satuanServices->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 py-20 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="mb-12 text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $satuanSubtitle }}</p>
                    <h2 class="section-heading text-ink">{{ $satuanTitle }}</h2>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($satuanServices->groupBy('event') as $event => $rows)
                        <div class="card p-5">
                            <span class="font-semibold text-ink">{{ $event }}</span>
                            <ul class="mt-3 space-y-2">
                                @foreach ($rows as $svc)
                                    <li class="flex items-center justify-between gap-3 text-sm">
                                        <span class="capitalize text-ink-muted">{{ $svc->media }}
                                            @if ($svc->terms)
                                                <span class="block text-xs text-ink-muted/70">{{ $svc->terms }}</span>
                                            @endif
                                            @if ($svc->duration)
                                                <span class="block text-xs text-ink-muted/70">{{ $svc->duration }}</span>
                                            @endif
                                        </span>
                                        <span class="font-bold tabular-nums text-brand-600 dark:text-brand-400">Rp {{ number_format($svc->price, 0, ',', '.') }}</span>
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
    @endif

    {{-- Section 4: Paket Premium (Bundling) --}}
    @if ($premiumPackages->isNotEmpty())
        <section class="container-site py-20">
            <div class="mb-12 text-center">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $premiumSubtitle }}</p>
                <h2 class="section-heading text-ink">{{ $premiumTitle }}</h2>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($premiumPackages as $pkg)
                    <div class="card flex flex-col justify-between p-5">
                        <div>
                            <span class="font-semibold text-ink">{{ $pkg->name }}</span>
                            <p class="mt-1 text-xs text-ink-muted">{{ $pkg->summary() }}</p>
                        </div>
                        <div class="mt-3">
                            @if ($pkg->discountValue() > 0)
                                <p class="text-xs text-ink-muted line-through">Rp {{ number_format($pkg->basePrice(), 0, ',', '.') }}</p>
                                <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($pkg->discountValue(), 0, ',', '.') }}</p>
                            @endif
                            <span class="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">Rp {{ number_format($pkg->computedPrice(), 0, ',', '.') }}</span>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>
    @endif

    {{-- Section 5: Paket Ultimate (Combo) --}}
    @if ($ultimatePackages->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 py-20 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="mb-12 text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $ultimateSubtitle }}</p>
                    <h2 class="section-heading text-ink">{{ $ultimateTitle }}</h2>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($ultimatePackages as $pkg)
                        <div class="card flex flex-col justify-between p-5">
                            <div>
                                <span class="font-semibold text-ink">{{ $pkg->name }}</span>
                                <p class="mt-1 text-xs text-ink-muted">{{ $pkg->summary() }}</p>
                            </div>
                            <div class="mt-3">
                                @if ($pkg->discountValue() > 0)
                                    <p class="text-xs text-ink-muted line-through">Rp {{ number_format($pkg->basePrice(), 0, ',', '.') }}</p>
                                    <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($pkg->discountValue(), 0, ',', '.') }}</p>
                                @endif
                                <span class="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">Rp {{ number_format($pkg->computedPrice(), 0, ',', '.') }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
    @endif

    {{-- Section 6: Judul & Catatan --}}
    @if ($catatanContent !== '')
        <section class="container-site py-20">
            <div class="card mx-auto max-w-4xl border-line bg-surface p-6 sm:p-8">
                <h2 class="flex items-center gap-2 font-bold text-ink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>
                    {{ $catatanTitle }}
                </h2>
                <div class="rich-content mt-4 text-ink-muted">{!! content_html($catatanContent) !!}</div>
            </div>
        </section>
    @endif

    {{-- Section 7: Tanya Jawab (FAQ) --}}
    @if ($faqs->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 py-20 dark:bg-zinc-900/40">
            <div class="container-site">
                <div class="mb-12 text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $faqSubtitle }}</p>
                    <h2 class="section-heading text-ink">{{ $faqTitle }}</h2>
                </div>
                <div class="mx-auto max-w-3xl space-y-3">
                    @foreach ($faqs as $faq)
                        <details class="reveal group card p-0">
                            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-ink [&::-webkit-details-marker]:hidden">
                                {{ $faq->question }}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-ink-muted transition-transform duration-300 group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                            </summary>
                            <div class="rich-content px-6 pb-6">{!! content_html($faq->answer) !!}</div>
                        </details>
                    @endforeach
                </div>
            </div>
        </section>
    @endif

    {{-- Section 8: CTA --}}
    <section class="container-site py-20">
        <div class="rounded-3xl bg-brand-800 p-8 text-center sm:p-12 dark:bg-brand-900">
            <h2 class="text-2xl font-bold text-white sm:text-3xl">{{ $ctaTitle }}</h2>
            <p class="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">{!! content_html($ctaDescription) !!}</p>
            @if ($ctaButtonText)
                <a href="{{ $ctaButtonLink }}" target="_blank" rel="noreferrer" class="btn mt-6 bg-white text-brand-800 shadow-lg hover:bg-brand-50 dark:bg-zinc-100 dark:text-brand-900 dark:hover:bg-white">
                    {{ $ctaButtonText }}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </a>
            @endif
        </div>
    </section>
@endsection