<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $siteName }} - Pemeliharaan</title>
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
<body class="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50">
    <div class="max-w-lg text-center">
        <img src="{{ $siteLogo }}" alt="{{ $siteName }}" class="mx-auto mb-6 h-20 w-20 rounded-2xl object-cover ring-1 ring-line">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            Sedang Pemeliharaan
        </div>
        <h1 class="section-heading">{{ $siteName }}</h1>
        <div class="rich-content mt-4 text-ink-muted">{!! content_html($message ?? 'Kami sedang melakukan pemeliharaan. Silakan kembali beberapa saat lagi.') !!}</div>
        <p class="mt-8 text-sm text-ink-muted">Terima kasih atas kesabaran Anda.</p>
    </div>
</body>
</html>
