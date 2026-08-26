@props([
    'page' => null,
    'badge' => '',
    'title' => '',
    'subtitle' => '',
    'buttonText' => '',
    'buttonLink' => '',
    'align' => 'left',
])

@php
    $resolvedBadge = ($page->badge ?? '') ?: $badge;
    $resolvedTitle = ($page->hero_title ?: $page->title) ?: $title;
    $resolvedSubtitle = ($page->description ?? '') ?: $subtitle;
    $ctaText = ($page->button_text ?? '') ?: $buttonText;
    $ctaLink = ($page->button_link ?? '') ?: $buttonLink;
@endphp

<section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
    <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
    <div class="container-site py-16 md:py-20 {{ $align === 'center' ? 'text-center' : '' }}">
        @if ($resolvedBadge)
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest [color:var(--accent-fg)]">{{ $resolvedBadge }}</p>
        @endif
        <h1 class="section-heading text-ink {{ $align === 'center' ? 'mx-auto' : '' }}">{{ $resolvedTitle }}</h1>
        @if ($resolvedSubtitle)
            <div class="rich-content mt-4 max-w-2xl text-ink-muted {{ $align === 'center' ? 'mx-auto' : '' }}">{!! content_html($resolvedSubtitle) !!}</div>
        @endif
        @if (($ctaText && $ctaLink) || (($page->button2_text ?? '') && ($page->button2_link ?? '')))
            <div class="mt-8 flex flex-wrap gap-3 {{ $align === 'center' ? 'justify-center' : '' }}">
                @if ($ctaText && $ctaLink)
                    <a href="{{ $ctaLink }}" class="btn-primary inline-flex">{{ $ctaText }}</a>
                @endif
                @if (($page->button2_text ?? '') && ($page->button2_link ?? ''))
                    <a href="{{ $page->button2_link }}" class="btn-outline inline-flex">{{ $page->button2_text }}</a>
                @endif
            </div>
        @endif
    </div>
</section>
