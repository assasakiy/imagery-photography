<?php

namespace App\Providers;

use App\Services\RuntimeSettings;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

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
        $settings = app(RuntimeSettings::class);

        View::share([
            'siteName' => $settings->siteName(),
            'siteTagline' => $settings->siteTagline(),
            'siteDescription' => $settings->siteDescription(),
            'siteLogo' => $settings->siteLogo(),
            'siteFavicon' => $settings->siteFavicon(),
        ]);
    }
}
