<?php

namespace App\Providers;

use App\Services\RuntimeSettings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\URL;
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
        if (str_starts_with(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        // Only share settings with views if we are not running console commands that might fail without DB
        if (! $this->app->runningInConsole() || app()->runningUnitTests()) {
            try {
                $settings = app(RuntimeSettings::class);
                View::share([
                    'siteName' => $settings->siteName(),
                    'siteTagline' => $settings->siteTagline(),
                    'siteDescription' => $settings->siteDescription(),
                    'siteLogo' => $settings->siteLogo(),
                    'siteFavicon' => $settings->siteFavicon(),
                    'shellSettings' => $settings,
                ]);
            } catch (\Exception $e) {
                // Ignore DB errors during initial setup/migration
            }
        }

        RateLimiter::for('forgot', function ($job) {
            return [
                Limit::perHour(5)->by('email:' . Str::lower(request()->input('identifier', 'anonymous'))),
                Limit::perDay(10)->by('ip:' . request()->ip()),
            ];
        });
    }
}
