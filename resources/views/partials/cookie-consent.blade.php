@php
    $cookieBannerEnabled = app(\App\Services\RuntimeSettings::class)->cookieBannerEnabled();
@endphp

@if ($cookieBannerEnabled)
<div id="cookie-consent" class="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md sm:inset-x-6 sm:bottom-6" data-cookie-consent hidden>
    <div class="animate-cookie-in relative overflow-hidden rounded-3xl border border-line/80 bg-white/85 shadow-2xl shadow-zinc-950/20 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/85 dark:shadow-black/50 dark:ring-white/10">
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"></div>

        <div class="p-6 sm:p-7">
            <div class="flex items-start gap-4">
                <div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" /></svg>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-3">
                        <h3 class="text-base font-bold tracking-tight text-ink">Preferensi Cookie</h3>
                        <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                            Aman & Privat
                        </span>
                    </div>
                    <p class="mt-1.5 text-[13px] leading-relaxed text-ink-muted" data-cookie-message>
                        {{ app(\App\Services\RuntimeSettings::class)->cookieBannerMessage() }}
                    </p>
                </div>
            </div>

            <div id="cookie-preferences" class="animate-cookie-fade mt-5 hidden space-y-2.5" data-cookie-preferences>
                <div class="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface-muted/60 px-4 py-3">
                    <div>
                        <p class="text-sm font-semibold text-ink">Esensial</p>
                        <p class="mt-0.5 text-xs leading-relaxed text-ink-muted">Diperlukan agar situs berfungsi (sesi, keamanan).</p>
                    </div>
                    <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        Selalu aktif
                    </span>
                </div>
                <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface-muted/60 px-4 py-3 transition-colors hover:border-brand-500/40">
                    <div>
                        <p class="text-sm font-semibold text-ink">Analitik</p>
                        <p class="mt-0.5 text-xs leading-relaxed text-ink-muted">Membantu kami memahami kunjungan untuk meningkatkan situs.</p>
                    </div>
                    <span class="relative inline-flex shrink-0">
                        <input type="checkbox" id="cookie-analytics" checked class="peer sr-only" />
                        <span class="block h-6 w-11 rounded-full bg-zinc-300/80 transition-colors duration-200 peer-checked:bg-brand-600 dark:bg-zinc-600"></span>
                        <span class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-white"></span>
                    </span>
                </label>
            </div>

            <div class="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button type="button" data-cookie-accept class="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:brightness-110 active:scale-[0.98]">
                    Terima Semua
                </button>
                <button type="button" data-cookie-necessary class="flex-1 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-muted active:scale-[0.98]">
                    Tolak
                </button>
                <button type="button" data-cookie-custom class="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 transition-colors duration-200 hover:bg-brand-500/10 active:scale-[0.98] dark:text-brand-400">
                    Kustom
                </button>
            </div>

            <button type="button" data-cookie-save class="mt-2 hidden w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:brightness-110 active:scale-[0.98]">
                Simpan Preferensi
            </button>

            <div class="mt-4 flex items-center justify-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-muted/70"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
                <a href="{{ route('privacy') }}" class="text-xs font-medium text-ink-muted transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                    Lihat Kebijakan Privasi
                </a>
            </div>
        </div>
    </div>
</div>
@endif