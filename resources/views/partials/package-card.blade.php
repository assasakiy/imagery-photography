<div class="reveal reveal-scale card group relative flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
    <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
    @if ($pkg->booking_count > 0 || $pkg->is_featured)
        <div class="flex flex-wrap gap-1.5">
            @if ($pkg->booking_count > 0)
                <span class="accent-surface inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></svg>Populer</span>
            @endif
            @if ($pkg->is_featured)
                <span class="accent-surface inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Unggulan</span>
            @endif
        </div>
    @endif
    <h3 class="mt-3 text-lg font-bold text-ink">{{ $pkg->name }}</h3>
    <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{{ $pkg->summary() }}</p>
    <div class="mt-6">
        @if ($pkg->discountValue() > 0)
            <p class="text-sm text-ink-muted line-through">Rp {{ number_format($pkg->basePrice(), 0, ',', '.') }}</p>
            <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($pkg->discountValue(), 0, ',', '.') }}</p>
        @endif
        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($pkg->computedPrice(), 0, ',', '.') }}</p>
    </div>
</div>