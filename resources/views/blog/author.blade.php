@extends('layouts.app')

@section('title', $author->name)
@section('meta_description', 'Artikel dari ' . $author->name . ' di blog Sopian Lalu Imagery.')

@section('content')
    @php
        $authorAvatar = $author->resolveAvatarUrl();
        $authorInitials = trim(
            collect(explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', $author->name)))
                ->filter()
                ->take(2)
                ->map(fn ($w) => strtoupper(mb_substr($w, 0, 1)))
                ->join('')
        ) ?: '?';
    @endphp

    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-14">
            <div class="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div class="flex-1">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Penulis</p>
                    <h1 class="section-heading text-ink">{{ $author->name }}</h1>
                    @if ($author->bio)
                        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{{ $author->bio }}</p>
                    @endif
                </div>
                <a href="{{ route('blog.author', $author->id) }}" class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl ring-2 ring-line">
                    @if ($authorAvatar)
                        <img src="{{ $authorAvatar }}" alt="{{ $author->name }}" class="h-full w-full object-cover">
                    @else
                        <span class="flex h-full w-full items-center justify-center bg-brand-500/15 text-3xl font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                    @endif
                </a>
            </div>
        </div>
    </section>

    <section class="container-site py-12">
        <div class="mb-8 flex flex-wrap items-center gap-2">
            <a href="{{ route('blog') }}" class="chip">Semua</a>
            @foreach ($categories as $category)
                <a href="{{ route('blog.category', $category->slug) }}" class="chip">{{ $category->name }}</a>
            @endforeach
        </div>

        @if ($posts->isEmpty())
            <div class="card p-12 text-center">
                <p class="text-ink">Belum ada artikel dari penulis ini.</p>
            </div>
        @else
            <div class="mb-6">
                <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Artikel</p>
                <h2 class="section-heading text-ink">{{ $posts->total() }} Artikel oleh {{ $author->name }}</h2>
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