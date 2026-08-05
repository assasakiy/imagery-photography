@extends('layouts.app')

@section('title', $page->title)
@section('meta_description', $page->title)

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site max-w-4xl py-16 md:py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Halaman</p>
            <h1 class="section-heading text-ink">{{ $page->title }}</h1>
        </div>
    </section>

    <section class="container-site max-w-4xl py-14">
        <div class="rich-content">
            {!! content_html($page->content) !!}
        </div>

        <div class="mt-12 rounded-2xl border border-line bg-zinc-100/60 p-6 dark:bg-zinc-900/40">
            <p class="text-sm text-ink-muted">Terakhir diperbarui: {{ $page->updated_at->translatedFormat('d F Y') }}</p>
        </div>
    </section>
@endsection
