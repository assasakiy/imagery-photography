@php
    $subEnabled = app(\App\Services\RuntimeSettings::class)->get('blog_subscribe_enabled', '1') === '1';
@endphp

@if ($subEnabled)
<div id="subscribe-modal" class="fixed inset-0 z-[70] hidden items-center justify-center p-4" data-subscribe-modal>
    <div class="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" data-subscribe-close></div>
    <div class="animate-cookie-in relative w-full max-w-md overflow-hidden rounded-3xl border border-line/80 bg-white/95 shadow-2xl shadow-zinc-950/20 ring-1 ring-black/5 backdrop-blur-xl dark:bg-zinc-900/95 dark:shadow-black/50 dark:ring-white/10">
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"></div>

        <div class="p-6 sm:p-7">
            <button type="button" data-subscribe-close aria-label="Tutup" class="absolute right-4 top-4 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div class="flex items-center gap-4">
                <div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                    <h3 class="text-lg font-bold tracking-tight text-ink" data-subscribe-title>Subscribe Blog</h3>
                    <p class="text-xs text-ink-muted">Dapatkan update artikel terbaru langsung ke email Anda.</p>
                </div>
            </div>

            <form id="subscribe-form" class="mt-6 space-y-4" data-subscribe-form novalidate>
                <div>
                    <label for="subscribe-name" class="mb-1.5 block text-sm font-medium text-ink">Nama Lengkap</label>
                    <input id="subscribe-name" name="name" type="text" required placeholder="Nama Anda" class="input w-full" data-subscribe-name>
                </div>
                <div>
                    <label for="subscribe-email" class="mb-1.5 block text-sm font-medium text-ink">Email</label>
                    <input id="subscribe-email" name="email" type="email" required placeholder="nama@email.com" class="input w-full" data-subscribe-email>
                </div>
                <p class="text-xs text-ink-muted">Kami akan mengirimkan kode OTP untuk memverifikasi email Anda.</p>
                <button type="submit" class="btn-primary w-full" data-subscribe-submit>Kirim Kode OTP</button>
            </form>

            <form id="subscribe-otp-form" class="mt-6 hidden space-y-4" data-subscribe-otp-form novalidate>
                <p class="text-sm text-ink-muted">Kode verifikasi telah dikirim ke <span data-subscribe-otp-target class="font-semibold text-ink"></span>. Masukkan kode di bawah ini (berlaku 5 menit).</p>
                <div>
                    <label for="subscribe-otp" class="mb-1.5 block text-sm font-medium text-ink">Kode OTP</label>
                    <input id="subscribe-otp" name="otp" type="text" inputmode="numeric" maxlength="6" required placeholder="000000" class="input w-full text-center text-lg tracking-[0.3em]" data-subscribe-otp>
                </div>
                <p class="text-xs text-ink-muted" data-subscribe-otp-error style="color:#ef4444"></p>
                <button type="submit" class="btn-primary w-full" data-subscribe-otp-submit>Verifikasi & Masuk</button>
                <button type="button" class="w-full text-center text-sm font-semibold text-brand-600 transition-colors hover:underline dark:text-brand-400" data-subscribe-back>Kembali</button>
            </form>
        </div>
    </div>
</div>
@endif