<?php

namespace App\Providers;

use App\Services\RuntimeSettings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(
        );

        $settings = app(RuntimeSettings::class);

        View::share([
            'siteName' => $settings->siteName(),
            'siteTagline' => $settings->siteTagline(),
            'siteDescription' => $settings->siteDescription(),
            'siteLogo' => $settings->siteLogo(),
            'siteFavicon' => $settings->siteFavicon(),
            'shellSettings' => $settings,
        ]);

        RateLimiter::for('forgot', function ($job) {
            return [
                Limit::perHour(5)->by('email:' . Str::lower(request()->input('identifier', 'anonymous'))),
                Limit::perDay(10)->by('ip:' . request()->ip()),
            ];
        });
    }
}
