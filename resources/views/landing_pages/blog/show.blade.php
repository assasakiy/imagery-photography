@extends('layouts.app')

@section('title', $post->title)
@section('meta_description', $post->excerpt ?: Str::limit(content_plain($post->content), 160))

@section('content')
    <article class="container-site max-w-4xl py-12 md:py-16">
        <nav class="mb-8 text-sm text-ink-muted">
            <a href="{{ route('home') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Beranda</a>
            <span class="mx-2">/</span>
            <a href="{{ route('blog') }}" class="hover:text-brand-600 dark:hover:text-brand-400">Blog</a>
            <span class="mx-2">/</span>
            <span class="text-ink">{{ $post->title }}</span>
        </nav>

        <header class="border-b border-line pb-8">
            @if ($post->categories->isNotEmpty())
                <a href="{{ route('blog.category', $post->categories->first()->slug) }}" class="chip">{{ $post->categories->first()->name }}</a>
            @endif
            <h1 class="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">{{ $post->title }}</h1>

            @php
                $author = $post->author;
                $authorAvatar = $author?->avatar();
                $authorName = $author?->name ?? 'Sopian Lalu Imagery';
                $authorInitials = trim(
                    collect(explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', $authorName)))
                        ->filter()
                        ->take(2)
                        ->map(fn ($w) => strtoupper(mb_substr($w, 0, 1)))
                        ->join('')
                ) ?: '?';
            @endphp

            <div class="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                @if ($author)
                    <a href="{{ route('blog.author', $author->id) }}" class="flex items-center gap-2.5">
                        @if ($authorAvatar)
                            <img src="{{ $authorAvatar }}" alt="{{ $authorName }}" loading="lazy" class="h-9 w-9 rounded-full object-cover ring-1 ring-line">
                        @else
                            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                        @endif
                        <span class="font-medium text-ink">{{ $authorName }}</span>
                    </a>
                @else
                    <span class="flex items-center gap-2.5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                        <span class="font-medium text-ink">{{ $authorName }}</span>
                    </span>
                @endif
                <span class="h-1 w-1 rounded-full bg-line"></span>
                <time datetime="{{ $post->published_at?->toDateString() }}">{{ $post->published_at?->translatedFormat('d F Y') }}</time>
                @if ($post->views_count)
                    <span class="h-1 w-1 rounded-full bg-line"></span>
                    <span class="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        {{ $post->views_count }} dilihat
                    </span>
                @endif
                @if ($post->tags->isNotEmpty())
                    <span class="h-1 w-1 rounded-full bg-line"></span>
                    <span class="flex flex-wrap gap-1.5">
                        @foreach ($post->tags as $tag)
                            <a href="{{ route('blog.tag', $tag->slug) }}" class="text-brand-600 hover:underline dark:text-brand-400">#{{ $tag->name }}</a>
                        @endforeach
                    </span>
                @endif
            </div>
        </header>

        @if ($post->resolveCoverUrl())
            <div class="mt-8 overflow-hidden rounded-2xl">
                <img src="{{ $post->medium_url }}" alt="{{ $post->title }}" width="1200" height="571" fetchpriority="high" decoding="async" sizes="(min-width: 1024px) 896px, 100vw" class="aspect-[21/10] w-full object-cover">
            </div>
        @endif

        <div class="rich-content mt-10">
            {!! content_html($post->content) !!}
        </div>

        <div class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
            <div class="flex flex-wrap items-center gap-2">
                @foreach ($post->tags as $tag)
                    <a href="{{ route('blog.tag', $tag->slug) }}" class="chip">#{{ $tag->name }}</a>
                @endforeach
            </div>

            @php
                $shareText = urlencode($post->title . "\n" . route('blog.show', $post->slug));
            @endphp
            <div class="flex flex-wrap items-center gap-2">
                @auth
                    @php
                        $authUser = auth()->user();
                        $canEngage = $authUser->hasRole('subscriber') || $authUser->hasRole('client') || $authUser->hasRole('owner') || $authUser->hasRole('admin');
                    @endphp
                    @if ($canEngage)
                        <button type="button" data-like-toggle data-id="{{ $post->id }}" data-type="blog"
                                class="btn-outline {{ $isLiked ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400' : '' }}">
                            <svg data-like-icon xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="{{ $isLiked ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                            <span data-like-label>{{ $isLiked ? 'Disukai' : 'Suka' }}</span>
                            <span data-like-count class="rounded-full bg-line/60 px-1.5 text-xs">{{ $likesCount }}</span>
                        </button>
                        <button type="button" data-scroll-comments class="btn-outline">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                            Komentar <span data-comments-count class="rounded-full bg-line/60 px-1.5 text-xs">{{ $commentsCount }}</span>
                        </button>
                        <button type="button" data-bookmark-toggle data-id="{{ $post->id }}" data-type="blog"
                                class="btn-outline {{ $isBookmarked ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400' : '' }}">
                            <svg data-bookmark-icon xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="{{ $isBookmarked ? 'currentColor' : 'none' }}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                            <span data-bookmark-label>{{ $isBookmarked ? 'Tersimpan' : 'Simpan' }}</span>
                        </button>
                    @endif
                @endauth
                @guest
                    <button type="button" data-subscribe-open class="btn-outline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                        Simpan
                    </button>
                @endguest
                <a href="https://wa.me/?text={{ $shareText }}" target="_blank" rel="noreferrer" class="btn-outline">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Bagikan via WhatsApp
                </a>
            </div>
        </div>

        @if (auth()->check() && (auth()->user()->hasRole('subscriber') || auth()->user()->hasRole('client') || auth()->user()->hasRole('owner') || auth()->user()->hasRole('admin')))
            <section data-comments-section class="mt-12 border-t border-line pt-10">
                <h2 class="mb-6 text-2xl font-bold text-ink">Komentar</h2>

                <form data-comment-form class="mb-8 rounded-2xl border border-line bg-surface p-4">
                    <textarea data-comment-body name="body" rows="3" required minlength="2" maxlength="2000"
                              placeholder="Tulis komentar Anda…"
                              class="w-full resize-y rounded-xl border border-line bg-zinc-50 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"></textarea>
                    <div class="mt-3 flex items-center justify-between gap-3">
                        <p class="text-xs text-ink-muted">Komentar bersifat publik dan perlu dijaga sopan santun.</p>
                        <button type="submit" data-comment-submit class="btn-primary">Kirim Komentar</button>
                    </div>
                </form>

                <div data-comments-list class="space-y-4">
                    <p class="text-sm text-ink-muted">Belum ada komentar. Jadilah yang pertama.</p>
                </div>
            </section>
        @elseif (!auth()->check())
            <section data-comments-section class="mt-12 border-t border-line pt-10">
                <h2 class="mb-6 text-2xl font-bold text-ink">Komentar</h2>
                <div class="rounded-2xl border border-line bg-surface p-6 text-center">
                    <p class="text-sm text-ink-muted">Subscribe atau login untuk ikut berkomentar dan menyukai artikel.</p>
                    <div class="mt-4 flex justify-center gap-2">
                        <button type="button" data-subscribe-open class="btn-primary">Subscribe</button>
                        <a href="{{ route('login') }}" class="btn-outline">Masuk</a>
                    </div>
                </div>
            </section>
        @endif
    </article>

    @if ($related->isNotEmpty())
        <section class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/40">
            <div class="container-site py-14">
                <div class="mb-8 flex items-end justify-between">
                    <div>
                        <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Baca Juga</p>
                        <h2 class="section-heading text-ink">Artikel Terkait</h2>
                    </div>
                    <a href="{{ route('blog') }}" class="hidden text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 sm:block">Lihat semua →</a>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    @foreach ($related as $item)
                        <a href="{{ route('blog.show', $item->slug) }}" class="group overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            <div class="aspect-[16/9] overflow-hidden bg-surface-muted">
                                @if ($item->thumbnail_url)
                                    <img src="{{ $item->thumbnail_url }}" alt="{{ $item->title }}" width="400" height="225" loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                                @endif
                            </div>
                            <div class="p-4">
                                <h3 class="line-clamp-2 font-bold leading-snug text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $item->title }}</h3>
                                <div class="mt-2 flex items-center gap-2">
                                    @if ($item->author?->avatar())
                                        <img src="{{ $item->author->avatar() }}" alt="{{ $item->author->name }}" loading="lazy" class="h-5 w-5 rounded-full object-cover">
                                    @endif
                                    <span class="text-xs text-ink-muted">{{ $item->author?->name ?? 'Sopian Lalu Imagery' }} · {{ $item->published_at?->translatedFormat('d M Y') }}</span>
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            </div>
        </section>
    @endif
@endsection
