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
    <div id="app"></div>
    @vite('resources/js/dashboard.jsx')
</body>
</html>
