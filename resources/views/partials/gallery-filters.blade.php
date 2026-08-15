@props(['activeCategory' => null])

<section class="sticky top-16 z-30 border-b border-line bg-zinc-50/90 backdrop-blur-md dark:bg-zinc-950/90">
    <div class="container-site relative py-3">
        <div class="relative flex min-w-0 items-center">
            <div data-cat-fade-left class="pointer-events-none absolute inset-y-0 left-0 z-[5] w-24 bg-gradient-to-r from-zinc-50 to-transparent opacity-0 transition-opacity dark:from-zinc-950"></div>
            <button
                type="button"
                data-cat-prev
                aria-label="Geser kiri"
                class="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-sm transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>

            <div role="group" aria-label="Filter kategori" data-cat-scroll class="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-2">
                <a href="{{ route('gallery') }}" class="chip shrink-0 {{ $activeCategory ? '' : 'chip-active' }}">Semua</a>
                @foreach ($categories as $item)
                    <a href="{{ route('gallery.category', $item['slug']) }}" class="chip shrink-0 {{ $activeCategory === $item['slug'] ? 'chip-active' : '' }}">{{ $item['name'] }}</a>
                @endforeach
            </div>

            <div data-cat-fade-right class="pointer-events-none absolute inset-y-0 right-0 z-[5] w-24 bg-gradient-to-l from-zinc-50 to-transparent opacity-0 transition-opacity dark:from-zinc-950"></div>
            <button
                type="button"
                data-cat-next
                aria-label="Geser kanan"
                class="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-sm transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>
    </div>
</section>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const scroller = document.querySelector('[data-cat-scroll]');
        if (!scroller) return;

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
    });
</script>