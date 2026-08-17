@extends('layouts.app')

@section('title', 'Jelajahi Topik & Kategori — Blog')
@section('meta_description', 'Jelajahi semua kategori dan topik di blog Sopian Lalu Imagery - tips fotografi, cerita di balik lensa, dan update terbaru.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-16 md:py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Blog</p>
            <h1 class="section-heading text-ink">Jelajahi Topik & Kategori</h1>
            <p class="mt-4 max-w-2xl leading-relaxed text-ink-muted">Temukan artikel berdasarkan kategori atau topik yang paling menarik untuk Anda.</p>
        </div>
    </section>

    <section class="container-site py-12">
        <nav class="mb-8 text-sm text-ink-muted">
            <a href="{{ route('home') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span class="mx-2">/</span>
            <a href="{{ route('blog') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Blog</a>
            <span class="mx-2">/</span>
            <span class="text-ink">Topik & Kategori</span>
        </nav>

        <div class="mb-12">
            <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Kategori</p>
            <h2 class="section-heading text-ink">{{ $categories->count() }} Kategori</h2>
            <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($categories as $category)
                    <a href="{{ route('blog.category', $category->slug) }}" class="card group relative flex flex-col justify-between gap-4 overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-600/10">
                        <div class="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
                        <div>
                            <div class="flex items-center gap-3">
                                <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 2.5-2.5L3 5"/><path d="m7 5 2.5 2.5L7 10"/><path d="M7 5h14v14H5V7"/></svg>
                                </span>
                                <h3 class="font-bold text-ink">{{ $category->name }}</h3>
                            </div>
                            @if ($category->description)
                                <p class="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">{{ $category->description }}</p>
                            @endif
                        </div>
                        <div class="mt-2 flex items-center justify-between border-t border-line pt-4">
                            <span class="text-sm text-ink-muted">{{ $category->blogs_count }} artikel</span>
                            <span class="flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-brand-400">
                                Buka <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                            </span>
                        </div>
                    </a>
                @endforeach
            </div>
            @if ($categories->isEmpty())
                <div class="card mt-6 p-12 text-center">
                    <p class="text-ink">Belum ada kategori.</p>
                </div>
            @endif
        </div>

        <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Topik</p>
            <h2 class="section-heading text-ink">{{ $tags->count() }} Topik</h2>

            @if ($tags->isNotEmpty())
                <div class="mt-6 flex flex-wrap gap-2">
                    @foreach ($tags as $tag)
                        <a href="{{ route('blog.tag', $tag->slug) }}" class="chip group">
                            <span class="text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $tag->name }}</span>
                            <span class="text-xs text-ink-muted">({{ $tag->posts_count }})</span>
                        </a>
                    @endforeach
                </div>
            @else
                <div class="card mt-6 p-12 text-center">
                    <p class="text-ink">Belum ada topik.</p>
                </div>
            @endif
        </div>
    </section>

    @if ($latest->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-12">
                <div class="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Terbaru</p>
                        <h2 class="text-2xl font-bold tracking-tight text-ink">Artikel Terbaru</h2>
                    </div>
                    <a href="{{ route('blog') }}" class="btn-link shrink-0">Semua Artikel <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg></a>
                </div>
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($latest as $post)
                        @include('partials.blog-card', ['post' => $post])
                    @endforeach
                </div>
            </div>
        </section>
    @endif
@endsection