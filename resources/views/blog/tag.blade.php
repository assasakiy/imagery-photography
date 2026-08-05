@extends('layouts.app')

@section('title', '#' . $tag->name . ' — Blog')
@section('meta_description', 'Kumpulan artikel bertag ' . $tag->name . ' di blog Sopian Lalu Imagery.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-16 md:py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Tag</p>
            <h1 class="section-heading text-ink">#{{ $tag->name }}</h1>
        </div>
    </section>

    @include('partials.blog-filters')

    <section class="container-site py-12">
        <nav class="mb-8 text-sm text-ink-muted">
            <a href="{{ route('home') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span class="mx-2">/</span>
            <a href="{{ route('blog') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Blog</a>
            <span class="mx-2">/</span>
            <span class="text-ink">#{{ $tag->name }}</span>
        </nav>

        @if ($posts->isEmpty())
            <div class="card p-12 text-center">
                <p class="text-ink">Belum ada artikel dengan tag ini.</p>
            </div>
        @else
            <div class="mb-6">
                <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Artikel</p>
                <h2 class="section-heading text-ink">{{ $posts->total() }} Artikel</h2>
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