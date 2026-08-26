<div class="card group relative flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
    <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
    @if ($pkg->booking_count > 0 || $pkg->is_featured)
        <div class="flex flex-wrap gap-1.5">
            @if ($pkg->booking_count > 0)
                <span class="action-surface inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold">Populer</span>
            @endif
            @if ($pkg->is_featured)
                <span class="action-surface inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold">Unggulan</span>
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