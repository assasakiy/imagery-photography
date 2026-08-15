@props([
    'label' => '',
    'title' => '',
    'subtitle' => '',
    'badge' => '',
    'seeAllHref' => null,
    'seeAllLabel' => 'Lihat semua',
])

<div class="mb-6 flex items-end justify-between gap-4">
    <div>
        @if ($label)
            <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $label ?: $badge }}</p>
        @endif
        <h2 class="section-heading text-ink">{{ $title }}</h2>
        @if ($subtitle)
            <p class="mt-2 max-w-2xl text-ink-muted">{{ $subtitle }}</p>
        @endif
    </div>
    @if ($seeAllHref)
        <a href="{{ $seeAllHref }}" class="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
            {{ $seeAllLabel }}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 19 19 12 12 5"/></svg>
        </a>
    @endif
</div>
