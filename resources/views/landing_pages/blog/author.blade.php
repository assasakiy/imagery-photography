@extends('layouts.app')

@section('title', $author->name)
@section('meta_description', $author->bio ?: 'Artikel dari ' . $author->name . ' di blog Sopian Lalu Imagery.')

@section('content')
    @php
        $authorAvatar = $author->avatar();
        $authorInitials = trim(
            collect(explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', $author->name)))
                ->filter()
                ->take(2)
                ->map(fn ($word) => strtoupper(mb_substr($word, 0, 1)))
                ->join('')
        ) ?: '?';
        $authorSocials = $author->socials
            ->filter(fn ($social) => $social->is_public && $social->url && $social->platform)
            ->sortBy('sort_order');
        $authorUrl = route('blog.author', ['username' => $author->username]);
    @endphp

    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site relative py-14 md:py-16">
            <div class="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                <a href="{{ $authorUrl }}" class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-surface ring-2 ring-line shadow-lg">
                    @if ($authorAvatar)
                        <img src="{{ $authorAvatar }}" alt="{{ $author->name }}" width="112" height="112" class="h-full w-full object-cover">
                    @else
                        <span class="flex h-full w-full items-center justify-center bg-brand-500/15 text-3xl font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                    @endif
                </a>
                <div class="min-w-0 flex-1">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Penulis</p>
                    <h1 class="section-heading text-ink">{{ $author->name }}</h1>
                    <p class="mt-1 text-sm font-medium text-ink-muted">&#64;{{ $author->username }}</p>
                    @if ($author->bio)
                        <p class="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">{{ $author->bio }}</p>
                    @endif
                    @if ($author->occupation || $author->company)
                        <p class="mt-3 text-sm text-ink-muted">{{ collect([$author->occupation, $author->company])->filter()->join(' · ') }}</p>
                    @endif
                    @if ($authorSocials->isNotEmpty())
                        <div class="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                            @foreach ($authorSocials as $social)
                                @include('partials.social-icon', [
                                    'type' => $social->platform->slug,
                                    'url' => $social->url,
                                    'class' => 'flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400',
                                    'size' => 16,
                                ])
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </section>

    @include('partials.blog-filters', [
        'activeCategory' => request('category'),
        'searchAction' => $authorUrl,
        'authorUsername' => $author->username,
    ])

    <section class="container-site py-12">
        <nav class="mb-8 text-sm text-ink-muted">
            <a href="{{ route('home') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span class="mx-2">/</span>
            <a href="{{ route('blog') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Blog</a>
            <span class="mx-2">/</span>
            <span class="text-ink">&#64;{{ $author->username }}</span>
        </nav>

        @if ($posts->isEmpty())
            <div class="card p-12 text-center">
                <p class="text-ink">{{ request('q') ? 'Tidak ada artikel yang cocok dengan pencarian ini.' : 'Belum ada artikel dari penulis ini.' }}</p>
                @if (request('q'))
                    <a href="{{ $authorUrl }}" class="btn-outline mt-4">Hapus pencarian</a>
                @endif
            </div>
        @else
            <div class="mb-6">
                <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Artikel</p>
                <h2 class="section-heading text-ink">{{ $posts->total() }} Artikel oleh {{ $author->name }}</h2>
                @if (request('q'))
                    <p class="mt-2 text-sm text-ink-muted">Hasil pencarian untuk “{{ request('q') }}”</p>
                @endif
            </div>
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                @foreach ($posts as $post)
                    @include('partials.blog-card', ['post' => $post])
                @endforeach
            </div>
            <div class="mt-10">
                {{ $posts->links() }}
            </div>
        @endif
    </section>
@endsection
