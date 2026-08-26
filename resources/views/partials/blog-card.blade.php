@props(['post', 'compact' => false])

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
    $cover = $post->thumbnail_url;
@endphp

<article class="group flex h-full flex-col gap-3">
    <a href="{{ route('blog.show', $post->slug) }}" class="block aspect-[16/9] overflow-hidden rounded-lg border border-line bg-surface-muted" tabindex="-1" aria-hidden="true">
        @if ($cover)
            <img src="{{ $cover }}" alt="{{ $post->title }}" width="400" height="225" loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]">
        @else
            <div class="flex h-full w-full items-center justify-center bg-surface-muted">
                <div class="grid grid-cols-2 gap-2 opacity-30">
                    <div class="h-6 w-6 rounded bg-brand-600/15"></div>
                    <div class="mt-2 h-6 w-6 rounded bg-brand-600/15"></div>
                    <div class="h-6 w-6 rounded bg-brand-600/15"></div>
                    <div class="mt-2 h-6 w-6 rounded bg-brand-600/15"></div>
                </div>
            </div>
        @endif
    </a>

    <div class="flex items-center gap-2">
        @if ($post->categories->isNotEmpty())
            <a href="{{ route('blog.category', $post->categories->first()->slug) }}" class="chip px-2.5 py-0.5 text-xs no-underline">{{ $post->categories->first()->name }}</a>
        @endif
        @if ($post->published_at)
            <span class="text-xs text-ink-muted">{{ $post->published_at->locale('id')->diffForHumans(['parts' => 1]) }}</span>
        @endif
    </div>

    <h3 class="{{ $compact ? 'text-base' : 'text-lg' }} font-semibold leading-snug text-balance">
        <a href="{{ route('blog.show', $post->slug) }}" class="no-underline transition-colors hover:text-brand-600 dark:hover:text-brand-400">{{ $post->title }}</a>
    </h3>

    @if ($post->excerpt)
        <p class="line-clamp-2 text-pretty text-sm text-ink-muted">{{ $post->excerpt }}</p>
    @endif

    <div class="mt-auto flex items-center gap-3 border-t border-line pt-2 text-xs text-ink-muted">
        @if ($author)
            <a href="{{ route('blog.author', ['username' => $author->username]) }}" class="flex min-w-0 items-center gap-1.5 no-underline transition-colors hover:text-ink">
                @if ($authorAvatar)
                    <img src="{{ $authorAvatar }}" alt="{{ $authorName }}" loading="lazy" class="h-5 w-5 shrink-0 rounded-full object-cover">
                @else
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-[10px] font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                @endif
                @include('partials.official-team-name', ['user' => $author, 'name' => $authorName])
            </a>
        @else
            <span class="flex min-w-0 items-center gap-1.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-[10px] font-bold text-brand-600 dark:text-brand-400">{{ $authorInitials }}</span>
                <span class="truncate">{{ $authorName }}</span>
            </span>
        @endif
        @if ($post->views_count)
            <span class="ml-auto flex shrink-0 items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                {{ $post->views_count }}
            </span>
        @endif
    </div>
</article>
