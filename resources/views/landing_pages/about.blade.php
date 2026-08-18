@extends('layouts.app')

@section('title', 'Tentang Kami')
@section('meta_description', 'Kenali Sopian Lalu Imagery - photographer dan videographer di Lombok yang mendokumentasikan momen dan narasi.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Tentang Kami',
        'title' => $page?->hero_title ?: ($page?->title ?: 'Tentang Kami'),
    ])

    @if ($aboutStats->isNotEmpty())
        <section class="border-b border-line bg-surface py-4">
            <div class="container-site grid grid-cols-2 gap-4 sm:gap-0 lg:grid-cols-4">
                @foreach ($aboutStats as $stat)
                    @php
                        $i = $loop->iteration;
                        $cellClass = 'reveal text-center px-4 py-6 border-line sm:px-8';
                        if ($i % 2 === 0) {
                            $cellClass .= ' border-l';
                        }
                        if ($i >= 3) {
                            $cellClass .= ' border-t';
                        }
                        if ($i > 1) {
                            $cellClass .= ' lg:border-l';
                        }
                        if ($i >= 3) {
                            $cellClass .= ' lg:border-t-0';
                        }
                    @endphp
                    <div class="{{ $cellClass }}" style="transition-delay: {{ $loop->index * 120 }}ms">
                        <p class="text-5xl font-semibold tracking-tight text-ink tabular-nums">
                            <span class="stat-count" data-final="{{ $stat->resolved_value }}">0</span><span class="text-2xl text-brand-600 dark:text-brand-400">{{ $stat->suffix }}</span>
                        </p>
                        <div class="mx-auto mt-4 mb-3 h-px w-12 bg-gradient-to-r from-brand-600 to-brand-400"></div>
                        <p class="text-xs uppercase tracking-widest text-ink-muted">{{ $stat->label }}</p>
                    </div>
                @endforeach
            </div>
        </section>
    @endif

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
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $ceritaSubtitle }}</p>
                <h2 class="section-heading text-ink">{{ $ceritaTitle }}</h2>
                <div class="rich-content mt-5 text-ink-muted">
                    {!! content_html($ceritaContent) !!}
                </div>
            </div>
        </div>
    </section>

    @php $history = $history ?? ''; @endphp
    @if ($history || count($timeline))
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-16 md:py-20">
                <div class="mx-auto max-w-3xl text-center">
                    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $perjalananSubtitle }}</p>
                    <h2 class="section-heading text-ink">{{ $perjalananTitle }}</h2>
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
        @php
            $socialItems = [
                ['type' => 'instagram', 'label' => 'Instagram'],
                ['type' => 'facebook', 'label' => 'Facebook'],
                ['type' => 'tiktok', 'label' => 'TikTok'],
                ['type' => 'whatsapp', 'label' => 'WhatsApp'],
            ];
        @endphp
        <section class="container-site py-16 md:py-20">
            <div class="mb-12 text-center">
                <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $timSubtitle }}</p>
                <h2 class="section-heading text-ink">{{ $timTitle }}</h2>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                @foreach ($team as $member)
                    @php
                        $hasSocial = collect($socialItems)->contains(fn ($item) => !empty($member['socials'][$item['type']] ?? ''));
                        $contactRows = [];
                        foreach ($socialItems as $item) {
                            if (!empty($member['socials'][$item['type']] ?? '')) {
                                $contactRows[] = ['type' => $item['type'], 'label' => $item['label'], 'url' => $member['socials'][$item['type']]];
                            }
                        }
                        $waPhone = preg_replace('/\D/', '', (string) ($member['phone'] ?? ''));
                        if (empty($member['socials']['whatsapp'] ?? '') && $waPhone !== '') {
                            $contactRows[] = ['type' => 'whatsapp', 'label' => 'WhatsApp', 'url' => 'https://wa.me/' . $waPhone];
                        }
                        if (!empty($member['email'])) {
                            $contactRows[] = ['type' => 'email', 'label' => 'Email', 'url' => 'mailto:' . $member['email']];
                        }
                    @endphp
                    @if (!empty($contactRows) || (!empty($member['bio']) && !$hasSocial) || (!empty($member['joined_at']) && !$hasSocial))
                    <div class="reveal card flex flex-col gap-6 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10 md:flex-row md:items-center">
                        <div class="flex flex-row items-center gap-4 md:w-2/5 md:flex-col md:items-center md:gap-3">
                            <img src="{{ $member['photo'] }}" alt="{{ $member['name'] ?? '' }}" loading="lazy" class="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-brand-500/15 md:h-24 md:w-24">
                            <div class="min-w-0 flex-1 text-left md:w-full md:flex-none md:text-center">
                                <h3 class="text-lg font-bold text-ink">{{ $member['name'] ?? '' }}</h3>
                                <p class="mt-0.5 text-sm font-medium text-brand-600 dark:text-brand-400">{{ $member['position'] ?? '' }}</p>
                            </div>
                        </div>

                        <div class="flex-1 md:border-l md:border-line md:pl-6">
                            <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Follow on</p>
                            <div class="flex flex-wrap items-center gap-1 md:flex-col md:items-stretch md:gap-1.5">
                                @foreach ($contactRows as $row)
                                    <a href="{{ $row['url'] }}" target="{{ $row['type'] === 'email' ? '_self' : '_blank' }}" rel="{{ $row['type'] === 'email' ? '' : 'noreferrer' }}" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand-600 dark:hover:text-brand-400">
                                        @include('partials.social-icon', ['type' => $row['type'], 'url' => $row['url'], 'size' => 18, 'bare' => true, 'iconClass' => 'shrink-0 text-current'])
                                        <span class="truncate font-medium">{{ $row['label'] }}</span>
                                    </a>
                                @endforeach
                            </div>
                            @if (!$hasSocial && (!empty($member['bio']) || !empty($member['joined_at'])))
                                <div class="mt-4 space-y-3 border-t border-line pt-4">
                                    @if (!empty($member['joined_at']))
                                        <p class="text-sm text-ink-muted"><strong class="font-semibold text-ink">Bergabung</strong> · {{ $member['joined_at'] }}</p>
                                    @endif
                                    @if (!empty($member['bio']))
                                        <p class="text-sm leading-relaxed text-ink-muted">{{ $member['bio'] }}</p>
                                    @endif
                                </div>
                            @endif
                        </div>
                    </div>
                    @endif
                @endforeach
            </div>
        </section>
    @endif

@if ($featured->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-14">
                <div class="mb-8 flex items-end justify-between">
                    <div>
                        <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $karyaSubtitle }}</p>
                        <h2 class="section-heading text-ink">{{ $karyaTitle }}</h2>
                    </div>
                    <a href="{{ route('gallery') }}" class="hidden text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 sm:block">Lihat galeri →</a>
                </div>

                <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                    @foreach ($featured as $item)
                        <a href="{{ route('gallery.show', $item->slug) }}" class="group relative overflow-hidden rounded-xl border border-line">
                            <div class="aspect-square overflow-hidden">
                                <img src="{{ $item->thumbnail_url }}" alt="{{ $item->title }}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                            </div>
                            <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent p-4">
                                @if ($item->categories->isNotEmpty())
                                    <p class="text-xs font-semibold uppercase tracking-widest text-brand-300">{{ $item->categories->pluck('name')->join(', ') }}</p>
                                @endif
                                <h3 class="mt-1 text-base font-bold text-white">{{ $item->title }}</h3>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif
@endsection
