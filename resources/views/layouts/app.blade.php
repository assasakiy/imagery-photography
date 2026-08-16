<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', $siteName) - {{ $siteName }}</title>
    <meta name="description" content="@yield('meta_description', $siteDescription ?: ($siteName . ' - Photography & Videography profesional di Lombok. Mengabadikan momen berharga Anda.'))">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/svg+xml" href="{{ $siteFavicon }}">
    <link rel="icon" type="image/x-icon" href="{{ $siteFavicon }}">
    <link rel="apple-touch-icon" href="{{ $siteFavicon }}">
    <script>
        (function () {
            var theme = localStorage.getItem('theme');
            if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.classList.toggle('dark', theme === 'dark');
        })();
    </script>
    @include('partials.brand-colors')
    @vite('resources/css/app.css')
</head>
<body class="bg-zinc-50 text-zinc-900 antialiased transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50">
    @php
        $navLinks = [
            ['label' => 'Beranda', 'href' => route('home'), 'active' => Route::is('home')],
            ['label' => 'Galeri', 'href' => route('gallery'), 'active' => Route::is('gallery*')],
            ['label' => 'Layanan', 'href' => route('services'), 'active' => Route::is('services')],
            ['label' => 'Tentang', 'href' => route('about'), 'active' => Route::is('about')],
            ['label' => 'Blog', 'href' => route('blog'), 'active' => Route::is('blog*')],
            ['label' => 'Kontak', 'href' => route('contact'), 'active' => Route::is('contact')],
        ];
        $authUser = Auth::user();
        if ($authUser) {
            $authInitials = collect(explode(' ', trim($authUser->name ?? '?')))->filter()->take(2)->map(fn ($w) => strtoupper(mb_substr($w, 0, 1)))->join('');
            $authRole = ($authUser->roles->pluck('name')->first() ?? 'client');
            $authAvatar = $authUser->avatar();
            $onDashboard = Route::is('dashboard');
        }
    @endphp

    <header class="sticky top-0 z-40 border-b border-line/70 bg-zinc-50/80 backdrop-blur-lg dark:bg-zinc-950/80">
        <div class="container-site flex h-16 items-center justify-between">
            <a href="{{ route('home') }}" class="flex items-center gap-3">
                <img src="{{ $siteLogo }}" alt="{{ $siteName }}" class="h-9 w-9 rounded-xl object-cover ring-1 ring-line">
                <span class="text-lg font-bold tracking-tight text-ink">@include('partials.site-brand')</span>
            </a>

            <nav class="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
                @foreach ($navLinks as $link)
                    <a href="{{ $link['href'] }}"
                       class="group relative px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 dark:after:bg-brand-400 {{ $link['active'] ? 'text-ink after:scale-x-100' : 'text-ink-muted after:scale-x-0 hover:text-ink hover:after:scale-x-100' }}">
                        {{ $link['label'] }}
                    </a>
                @endforeach
                @guest
                    <a href="{{ route('booking') }}" class="ml-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700">Pesan Sekarang</a>
                @endguest
            </nav>

            <div class="flex items-center gap-1">
                @guest
                    <a href="{{ route('booking') }}" class="mr-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 md:hidden">Pesan</a>
                @endguest

                @auth
                    <div class="relative">
                        <button type="button" data-notif-toggle aria-label="Notifikasi" class="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            <span data-notif-badge class="absolute right-0.5 top-0.5 hidden h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">0</span>
                        </button>
                        <div data-notif-panel class="dropdown-panel absolute right-0 top-full z-50 mt-2 hidden w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-black/5 dark:bg-zinc-900 md:block">
                            <div class="flex items-center justify-between border-b border-line px-4 py-3">
                                <h3 class="text-sm font-bold text-ink">Notifikasi</h3>
                                <div class="flex items-center gap-3">
                                    <span data-notif-markread class="cursor-pointer text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Tandai dibaca</span>
                                    <a href="{{ route('dashboard') }}/notifications" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</a>
                                </div>
                            </div>
                            <div data-notif-list class="max-h-80 overflow-y-auto"></div>
                        </div>
                    </div>

                    <button type="button" data-theme-toggle aria-label="Ganti tema" class="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                        <svg data-icon="moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        <svg data-icon="sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                    </button>

                    <div class="relative hidden md:block">
                        <button type="button" data-profile-toggle aria-label="Menu profil" class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted">
                            @if ($authAvatar)
                                <img src="{{ $authAvatar }}" alt="" class="h-8 w-8 rounded-full object-cover ring-2 ring-brand-500/30">
                            @else
                                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{{ $authInitials }}</span>
                            @endif
                            <span class="hidden max-w-[120px] truncate text-sm font-medium text-ink sm:block">{{ $authUser->name }}</span>
                            <svg data-profile-chevron xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden text-ink-muted transition-transform duration-200 sm:block"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                        <div data-profile-menu class="dropdown-panel absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-black/5 dark:bg-zinc-900">
                            <div class="border-b border-line px-4 py-3">
                                <p class="truncate text-sm font-bold text-ink">{{ $authUser->name }}</p>
                                <p class="text-xs capitalize text-ink-muted">{{ $authRole }}</p>
                            </div>
                            <div class="p-1.5">
                                @if ($onDashboard)
                                    <a href="{{ route('dashboard') }}/profile" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        Profil Saya
                                    </a>
                                @else
                                    <a href="{{ route('dashboard') }}" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                                        Dashboard
                                    </a>
                                @endif
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-surface-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                        Keluar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                @endauth

                @guest
                    <a href="{{ route('login') }}" class="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400">Masuk</a>

                    <button type="button" data-theme-toggle aria-label="Ganti tema" class="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                        <svg data-icon="moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        <svg data-icon="sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                    </button>
                @endguest

                <button type="button" data-menu-toggle aria-label="Buka menu" aria-expanded="false" class="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink md:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
        </div>

        <div data-mobile-menu class="hidden border-t border-line/70 bg-zinc-50 dark:bg-zinc-950 md:hidden">
            <nav class="container-site flex flex-col gap-1 py-4" aria-label="Navigasi mobile">
                @auth
                    <div class="mb-2 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                        @if ($authAvatar)
                            <img src="{{ $authAvatar }}" alt="" class="h-10 w-10 rounded-full object-cover ring-2 ring-brand-500/30">
                        @else
                            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{{ $authInitials }}</span>
                        @endif
                        <div class="min-w-0">
                            <p class="truncate text-sm font-bold text-ink">{{ $authUser->name }}</p>
                            <p class="text-xs capitalize text-ink-muted">{{ $authRole }}</p>
                        </div>
                    </div>
                @endauth

                @foreach ($navLinks as $link)
                    <a href="{{ $link['href'] }}" class="rounded-lg px-3 py-2.5 text-sm font-medium {{ $link['active'] ? 'bg-surface-muted text-ink' : 'text-ink hover:bg-surface-muted' }}">{{ $link['label'] }}</a>
                @endforeach

                @auth
                    <div class="mt-2 flex flex-col gap-2 border-t border-line pt-3">
                        <a href="{{ route('dashboard') }}" class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            Dashboard
                        </a>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-surface-muted">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                Keluar
                            </button>
                        </form>
                    </div>
                @endauth

                @guest
                    <a href="{{ route('login') }}" class="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-500/10 dark:text-brand-400">Masuk</a>
                @endguest
            </nav>
        </div>
    </header>

    @auth
        <div data-notif-backdrop class="fixed inset-0 z-40 hidden bg-zinc-950/40 backdrop-blur-sm md:hidden"></div>
        <div data-notif-sheet class="fixed inset-x-0 bottom-0 z-50 hidden max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-white shadow-xl shadow-black/5 dark:bg-zinc-900 md:hidden">
            <div class="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 class="text-sm font-bold text-ink">Notifikasi</h3>
                <div class="flex items-center gap-3">
                    <span data-notif-markread class="cursor-pointer text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Tandai dibaca</span>
                    <a href="{{ route('dashboard') }}/notifications" class="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</a>
                    <button type="button" data-notif-close aria-label="Tutup notifikasi" class="rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </div>
            <div data-notif-list class="max-h-[60vh] overflow-y-auto"></div>
        </div>
    @endauth

    <main>
        @yield('content')
    </main>

    <footer class="border-t border-line bg-zinc-100/60 dark:bg-zinc-900/60">
        <div class="container-site py-12">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div class="md:col-span-2 md:pr-10 lg:pr-16">
                <a href="{{ route('home') }}" class="mb-4 flex items-center gap-3 text-ink transition-opacity hover:opacity-80">
                    <img src="{{ $siteLogo }}" alt="{{ $siteName }}" class="h-10 w-auto">
                    <div class="flex flex-col">
                        <span class="text-xl font-bold leading-none text-ink">@include('partials.site-brand')</span>
                        @if ($siteTagline)
                            <span class="mt-1 text-xs uppercase tracking-widest text-ink-muted">{{ $siteTagline }}</span>
                        @endif
                    </div>
                </a>
                <p class="max-w-sm text-sm leading-relaxed text-ink-muted">
                    {!! content_html($siteDescription) !!}
                </p>
                <div class="mt-5 flex items-center gap-2">
                    @include('partials.social-icon', ['type' => 'instagram', 'url' => \App\Models\Setting::getValue('social_instagram')])
                    @include('partials.social-icon', ['type' => 'facebook', 'url' => \App\Models\Setting::getValue('social_facebook')])
                    @include('partials.social-icon', ['type' => 'tiktok', 'url' => \App\Models\Setting::getValue('social_tiktok')])
                    @include('partials.social-icon', ['type' => 'whatsapp', 'url' => \App\Models\Setting::getValue('social_whatsapp')])
                </div>
            </div>

            <div>
                <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-ink">Navigasi</h3>
                <ul class="space-y-2 text-sm text-ink-muted">
                    <li><a href="{{ route('home') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Beranda</a></li>
                    <li><a href="{{ route('gallery') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Galeri</a></li>
                    <li><a href="{{ route('services') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Layanan</a></li>
                    <li><a href="{{ route('about') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Tentang</a></li>
                    <li><a href="{{ route('blog') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Blog</a></li>
                    <li><a href="{{ route('contact') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Kontak</a></li>                
                </ul>
            </div>

            <div>
                <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-ink">Informasi</h3>
                <ul class="space-y-2 text-sm text-ink-muted">
                    <li><a href="{{ route('faq') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">FAQ</a></li>
                    <li><a href="{{ route('blog') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Kategori</a></li>
                    <li><a href="{{ route('blog') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Tag</a></li>
                    <li><a href="{{ route('blog') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Author</a></li>
                    <li><a href="{{ route('booking') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Booking</a></li>
                </ul>
            </div>
        </div>

        <div class="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-6 text-sm text-ink-muted sm:flex-row">
            <p>&copy; {{ date('Y') }} {{ $siteName }}. Semua hak dilindungi.</p>
            <div class="flex items-center gap-4">
                <a href="{{ route('privacy') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Privasi</a>
                <span class="text-line">•</span>
                <a href="{{ route('terms') }}" class="transition-colors hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-brand-600 dark:hover:text-brand-400">Term</a>
            </div>
        </div>
        </div>
    </footer>

    @yield('extra')

    @vite('resources/js/app.js')
</body>
</html>
