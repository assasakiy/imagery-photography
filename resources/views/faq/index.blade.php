@extends('layouts.app')

@section('title', 'FAQ')
@section('meta_description', 'Pertanyaan yang sering ditanyakan tentang layanan Sopian Lalu Imagery.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">FAQ</p>
            <h1 class="section-heading text-ink">Pertanyaan yang Sering Diajukan</h1>
            <p class="mt-4 max-w-2xl text-ink-muted">
                Temukan jawaban atas pertanyaan umum seputar layanan dan proses booking.
            </p>
        </div>
    </section>

    <section class="container-site max-w-3xl py-16">
        @if ($faqs->isEmpty())
            <div class="card p-12 text-center">
                <p class="text-ink">Belum ada pertanyaan.</p>
            </div>
        @else
            <div class="space-y-3">
                @foreach ($faqs as $index => $faq)
                    <details class="group rounded-2xl border border-line bg-surface transition-colors open:border-brand-500/50">
                        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-ink">
                            <span>{{ $faq->question }}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-brand-600 transition-transform group-open:rotate-45 dark:text-brand-400"><path d="M12 5v14M5 12h14"/></svg>
                        </summary>
                        <div class="border-t border-line px-5 py-4 text-ink-muted">
                            <div class="rich-content">
                                {!! content_html($faq->answer) !!}
                            </div>
                        </div>
                    </details>
                @endforeach
            </div>

            <div class="mt-12 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-8 text-center">
                <h2 class="text-xl font-bold text-ink">Masih ada pertanyaan?</h2>
                <p class="mt-2 text-sm text-ink-muted">Hubungi kami langsung untuk informasi lebih lanjut.</p>
                <a href="{{ route('contact') }}" class="btn-primary mt-5">Hubungi Kami</a>
            </div>
        @endif
    </section>
@endsection
