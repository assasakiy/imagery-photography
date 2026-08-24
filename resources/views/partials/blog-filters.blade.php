@props(['activeCategory' => null, 'searchAction' => null, 'authorUsername' => null])

@php
    $activeCategorySlug = $activeCategory ?: request('category');
    $searchAction = $searchAction ?: route('blog');
    $allUrl = $authorUsername ? route('blog.author', ['username' => $authorUsername]) : route('blog');
    $categoryUrl = fn ($slug) => $authorUsername
        ? route('blog.author', ['username' => $authorUsername]) . '?' . http_build_query(array_filter(['category' => $slug, 'q' => request('q')]))
        : route('blog.category', $slug);
@endphp

<section class="sticky top-16 z-30 border-b border-line bg-zinc-50/90 backdrop-blur-md dark:bg-zinc-950/90">
    <div class="container-site relative py-3">
        <div class="flex items-center gap-3">
            <div class="relative flex min-w-0 flex-1 items-center">
                <div data-cat-fade-left class="pointer-events-none absolute left-0 top-0 bottom-0 z-[5] w-28 bg-gradient-to-r from-zinc-50 to-transparent opacity-0 transition-opacity dark:from-zinc-950"></div>
                <div data-cat-fade-right class="pointer-events-none absolute right-0 top-0 bottom-0 z-[5] w-28 bg-gradient-to-l from-zinc-50 to-transparent opacity-0 transition-opacity dark:from-zinc-950"></div>
                <button
                    type="button"
                    data-cat-prev
                    aria-label="Geser kiri"
                    class="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-sm transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>

                <div data-cat-scroll class="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-2">
                    <a href="{{ $allUrl }}" class="chip shrink-0 {{ $activeCategorySlug || request('tag') ? '' : 'chip-active' }}">Semua</a>
                    @foreach ($categories as $category)
                        <a href="{{ $categoryUrl($category->slug) }}" class="chip shrink-0 {{ $activeCategorySlug === $category->slug ? 'chip-active' : '' }}">
                            {{ $category->name }}
                        </a>
                    @endforeach
                </div>

                <button
                    type="button"
                    data-cat-next
                    aria-label="Geser kanan"
                    class="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-sm transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>

            <form method="GET" action="{{ $searchAction }}" class="relative hidden shrink-0 lg:block">
                @if ($authorUsername && $activeCategorySlug)
                    <input type="hidden" name="category" value="{{ $activeCategorySlug }}">
                @endif
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" inputmode="search" name="q" value="{{ request('q') }}" placeholder="Cari artikel…" class="w-64 rounded-full border border-line bg-surface-muted/50 py-2.5 pl-12 pr-4 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-brand-500 focus:bg-surface focus:ring-2 focus:ring-brand-500/20">
            </form>

            <button
                type="button"
                data-search-toggle
                aria-label="Cari"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 lg:hidden"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
        </div>

        <div
            data-mobile-search
            class="pointer-events-none absolute inset-0 z-20 flex origin-right scale-x-75 items-center gap-2 bg-zinc-50/95 px-3 opacity-0 backdrop-blur-md transition-all duration-300 ease-out lg:hidden dark:bg-zinc-950/95"
        >
            <form method="GET" action="{{ $searchAction }}" class="relative w-full">
                @if ($authorUsername && $activeCategorySlug)
                    <input type="hidden" name="category" value="{{ $activeCategorySlug }}">
                @endif
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" inputmode="search" name="q" value="{{ request('q') }}" placeholder="Cari artikel…" class="w-full rounded-full border border-line bg-surface py-2.5 pl-12 pr-4 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
            </form>
            <button
                type="button"
                data-search-close
                aria-label="Tutup pencarian"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
    </div>
</section>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const scroller = document.querySelector('[data-cat-scroll]');
        if (scroller) {
            const prev = document.querySelector('[data-cat-prev]');
            const next = document.querySelector('[data-cat-next]');
            const fadeLeft = document.querySelector('[data-cat-fade-left]');
            const fadeRight = document.querySelector('[data-cat-fade-right]');

            const update = () => {
                const scrollable = scroller.scrollWidth > scroller.clientWidth + 2;
                const atStart = scroller.scrollLeft <= 0;
                const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
                const hideL = !scrollable || atStart;
                const hideR = !scrollable || atEnd;

                prev.classList.toggle('disabled', hideL);
                prev.classList.toggle('opacity-0', hideL);
                next.classList.toggle('disabled', hideR);
                next.classList.toggle('opacity-0', hideR);
                fadeLeft.classList.toggle('opacity-0', hideL);
                fadeRight.classList.toggle('opacity-0', hideR);
            };

            prev.addEventListener('click', () => scroller.scrollBy({ left: -240, behavior: 'smooth' }));
            next.addEventListener('click', () => scroller.scrollBy({ left: 240, behavior: 'smooth' }));
            scroller.addEventListener('scroll', update);
            window.addEventListener('resize', update);
            update();
        }

        const mSearch = document.querySelector('[data-mobile-search]');
        const mToggle = document.querySelector('[data-search-toggle]');
        const mClose = document.querySelector('[data-search-close]');
        if (mSearch && mToggle && mClose) {
            const input = mSearch.querySelector('input');
            const open = () => {
                mSearch.classList.remove('pointer-events-none', 'opacity-0', 'scale-x-75');
                setTimeout(() => input && input.focus(), 250);
            };
            const close = () => {
                mSearch.classList.add('pointer-events-none', 'opacity-0', 'scale-x-75');
            };

            mToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                open();
            });
            mClose.addEventListener('click', close);
            document.addEventListener('click', (e) => {
                if (!e.target.closest('[data-mobile-search]') && !e.target.closest('[data-search-toggle]')) {
                    close();
                }
            });
        }
    });
</script>
