@extends('layouts.app')

@section('title', 'Tentang Kami')
@section('meta_description', 'Kenali Sopian Lalu Imagery - photographer dan videographer di Lombok yang mendokumentasikan momen dan narasi.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Tentang Kami',
        'title' => $page?->hero_title ?: ($page?->title ?: 'Tentang Kami'),
    ])

    <section class="container-site py-16 md:py-20">
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-5">
            <div class="reveal relative mx-auto w-full max-w-md lg:order-1 lg:col-span-2 lg:mx-0 lg:max-w-none">
                <div class="absolute -inset-4 -z-10 rounded-3xl bg-brand-600/10 blur-2xl"></div>
                <div class="relative overflow-hidden rounded-2xl border border-line shadow-lg shadow-black/5">
                    <img src="{{ $aboutImage }}" alt="{{ $page?->hero_title ?: 'Cerita Kami' }}" class="aspect-square w-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/25 to-transparent"></div>
                </div>
            </div>

            <div class="reveal lg:col-span-3">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Cerita Kami</p>
                <h2 class="section-heading text-ink">Cerita Kami</h2>
                <div class="rich-content mt-5 text-ink-muted">
                    {!! content_html($page?->content ?? '') !!}
                </div>
            </div>
        </div>
    </section>

    @php $history = $history ?? ''; @endphp
    @if ($history || count($timeline))
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-16 md:py-20">
                <div class="mx-auto max-w-3xl text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Perjalanan</p>
                    <h2 class="section-heading text-ink">Tentang Situs & Layanan</h2>
                </div>

                <div class="mx-auto mt-12 max-w-3xl">
                    @if ($history)
                        <div class="rich-content mb-14 text-center">
                            {!! content_html($history) !!}
                        </div>
                    @endif

                    @if (count($timeline))
                        <div class="relative">
                            <div class="absolute bottom-2 left-0 top-2 w-px bg-brand-500/30"></div>
                            <ol class="space-y-8">
                                @foreach ($timeline as $point)
                                    <li class="reveal relative pl-7">
                                        <span class="absolute left-0 top-4 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-brand-600 bg-zinc-50 dark:bg-zinc-950">
                                            <span class="h-2 w-2 rounded-full bg-brand-600"></span>
                                        </span>
                                        <div class="card p-5">
                                            <p class="text-sm font-bold text-brand-600 dark:text-brand-400">{{ $point['year'] }}</p>
                                            <p class="mt-2 leading-relaxed text-ink-muted">{{ $point['text'] ?? '' }}</p>
                                        </div>
                                    </li>
                                @endforeach
                            </ol>
                        </div>
                    @endif
                </div>
            </div>
        </section>
    @endif

    @if ($team->isNotEmpty())
        <section class="container-site py-16 md:py-20">
            <div class="mb-12 text-center">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Tim</p>
                <h2 class="section-heading text-ink">Di Balik Lensa</h2>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($team as $member)
                    <div class="reveal card group p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                        <div class="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-brand-500/15">
                            <img src="{{ $member->resolvePhotoUrl() }}" alt="{{ $member->name }}" loading="lazy" class="h-full w-full object-cover">
                        </div>
                        <h3 class="mt-4 text-lg font-bold text-ink">{{ $member->name }}</h3>
                        <p class="text-sm font-medium text-brand-600 dark:text-brand-400">{{ $member->position }}</p>
                        @if ($member->is_owner)
                            <span class="mt-2 inline-block rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">Founder & Owner</span>
                        @endif
                        @if ($member->bio)
                            <p class="mt-3 text-sm leading-relaxed text-ink-muted">{{ $member->bio }}</p>
                        @endif
                        <div class="mt-4 flex items-center justify-center gap-1">
                            @include('partials.social-icon', ['type' => 'instagram', 'url' => $member->social_instagram ?? '', 'size' => 18, 'class' => 'rounded-lg p-2 text-ink-muted transition-colors hover:text-brand-600 dark:hover:text-brand-400'])
                            @include('partials.social-icon', ['type' => 'facebook', 'url' => $member->social_facebook ?? '', 'size' => 18, 'class' => 'rounded-lg p-2 text-ink-muted transition-colors hover:text-brand-600 dark:hover:text-brand-400'])
                            @include('partials.social-icon', ['type' => 'tiktok', 'url' => $member->social_tiktok ?? '', 'size' => 18, 'class' => 'rounded-lg p-2 text-ink-muted transition-colors hover:text-brand-600 dark:hover:text-brand-400'])
                            @include('partials.social-icon', ['type' => 'whatsapp', 'url' => $member->social_whatsapp ?? '', 'size' => 18, 'class' => 'rounded-lg p-2 text-ink-muted transition-colors hover:text-brand-600 dark:hover:text-brand-400'])
                        </div>
                    </div>
                @endforeach
            </div>
        </section>
    @endif

    @if ($aboutStats->isNotEmpty())
    <section class="container-site pb-16">
        <div class="card grid grid-cols-1 gap-6 p-8 sm:grid-cols-3">
            @foreach ($aboutStats as $stat)
                <div class="text-center">
                    <p class="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{{ $stat->resolved_value }}<span class="text-lg">{{ $stat->suffix }}</span></p>
                    <p class="mt-1 text-sm text-ink-muted">{{ $stat->label }}</p>
                </div>
            @endforeach
        </div>
    </section>
    @endif

    @if ($featured->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-14">
                <div class="mb-8 flex items-end justify-between">
                    <div>
                        <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Karya Unggulan</p>
                        <h2 class="section-heading text-ink">Sebagian Karya Kami</h2>
                    </div>
                    <a href="{{ route('gallery') }}" class="hidden text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 sm:block">Lihat galeri →</a>
                </div>

                <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                    @foreach ($featured as $item)
                        <a href="{{ route('gallery') }}" class="group overflow-hidden rounded-xl border border-line">
                            <div class="aspect-square overflow-hidden">
                                <img src="{{ $item->thumbnail_url }}" alt="{{ $item->title }}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif
@endsection
