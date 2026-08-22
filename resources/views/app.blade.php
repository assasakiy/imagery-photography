<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $siteName }} — Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="{{ $siteFavicon }}">
    <link rel="icon" type="image/x-icon" href="{{ $siteFavicon }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
    <meta name="description" content="Dashboard {{ $siteName }} - Photography & Videography">
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
<body>
    @php
        $shellSettings = app(\App\Services\RuntimeSettings::class);
    @endphp
    <script>
        window.APP_CONFIG = {
            logo: @json($siteLogo),
            favicon: @json($siteFavicon),
            brandColor: @json($shellSettings->brandColor()),
            googleAuth: @json($shellSettings->googleAuthEnabled() && $shellSettings->googleClientId() && $shellSettings->googleClientSecret()),
            siteName: @json($siteName),
            googleRedirect: @json(url('/auth/google/redirect')),
            rememberEnabled: @json($shellSettings->loginRememberEnabled()),
            businessTimezone: @json($shellSettings->timezone()),
            otp: {
                enabled: @json($shellSettings->loginMethodEnabled('otp')),
                whatsapp: @json($shellSettings->channelAvailable('whatsapp')),
                email: @json($shellSettings->channelAvailable('email')),
            },
        };
    </script>
    <div id="app">
        <!-- Initial Loading State -->
        <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-surface, #ffffff);z-index:9999;" id="initial-loader">
            <div style="display:flex;flex-direction:column;align-items:center;gap:1.5rem;">
                <div style="position:relative;display:flex;height:4rem;width:4rem;align-items:center;justify-content:center;">
                    <!-- Outer rotating ring -->
                    <div style="position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--brand-500, #7c3aed);border-right-color:var(--brand-500, #7c3aed);opacity:0.2;"></div>
                    <div style="position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--brand-500, #7c3aed);animation:spin 1s linear infinite;"></div>
                    <!-- Inner logo/icon placeholder -->
                    <div style="height:2rem;width:2rem;border-radius:0.5rem;background-color:var(--brand-500, #7c3aed);opacity:0.1;"></div>
                    @if($siteLogo)
                        <img src="{{ $siteLogo }}" alt="Loading" style="position:absolute;height:2rem;width:2rem;object-fit:cover;border-radius:0.5rem;" />
                    @endif
                </div>
                <div style="font-family:ui-sans-serif, system-ui, sans-serif;font-size:0.875rem;font-weight:500;letter-spacing:0.05em;color:var(--text-muted, #71717a);animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">MEMUAT...</div>
            </div>
        </div>
        <style>
            .dark #initial-loader { background: #09090b !important; }
            .dark #initial-loader div { color: #a1a1aa !important; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        </style>
    </div>
    @vite('resources/js/dashboard.jsx')
</body>
</html>
