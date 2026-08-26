<?php

use App\Http\Controllers\AboutPageController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\WatermarkController;
use Illuminate\Support\Facades\Route;

// Public pages (Blade SSR - SEO friendly)
Route::middleware('maintenance')->group(function () {
    Route::get('/', [LandingPageController::class, 'index'])->name('home');
    Route::get('/gallery', [GalleryController::class, 'index'])->name('gallery');
    Route::get('/gallery/kategori/{slug}', [GalleryController::class, 'category'])->name('gallery.category');
    Route::get('/gallery/{slug}', [GalleryController::class, 'show'])->name('gallery.show');
    Route::get('/services', [ContactController::class, 'services'])->name('services');
    Route::get('/contact', [ContactController::class, 'index'])->name('contact');
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

    // Content pages
    Route::get('/tentang', [AboutPageController::class, 'index'])->name('about');
    Route::get('/faq', [FaqController::class, 'index'])->name('faq');
    Route::get('/kebijakan-privasi', [PageController::class, 'privacy'])->name('privacy');
    Route::get('/syarat-ketentuan', [PageController::class, 'terms'])->name('terms');
    Route::get('/booking', [BookingController::class, 'index'])->name('booking');
    Route::post('/booking', [BookingController::class, 'store'])->name('booking.store')->middleware('api.throttle:booking.create');
    Route::get('/blog', [BlogController::class, 'index'])->name('blog');
    Route::get('/blog/penulis/@{username}', [BlogController::class, 'author'])->name('blog.author');
    Route::get('/blog/penulis/{id}', [BlogController::class, 'authorLegacy'])->whereNumber('id')->name('blog.author.legacy');
    Route::get('/blog/kategori/{slug}', [BlogController::class, 'category'])->name('blog.category');
    Route::get('/blog/tag/{slug}', [BlogController::class, 'tag'])->name('blog.tag');
    Route::get('/blog/jelajah', [BlogController::class, 'topics'])->name('blog.topics');
    Route::get('/blog/{section}', [BlogController::class, 'section'])->whereIn('section', ['featured', 'latest', 'populer'])->name('blog.section');
    Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');
    Route::get('/watermark/{hash}', [WatermarkController::class, 'show'])->name('watermark');
});

// Auth
Route::get('/login', function () {
    return view('app');
})->middleware('guest')->name('login');
Route::get('/register', function () {
    return view('app');
})->middleware('guest')->name('register');

// PWA
Route::get('/manifest.webmanifest', function () {
    $settings = app(\App\Services\RuntimeSettings::class);
    $name = $settings->siteName();
    $shortName = str_word_count($name) > 2
        ? collect(explode(' ', $name))->map(fn ($w) => mb_substr($w, 0, 1))->join('')
        : $name;

    return response()
        ->json([
            'name' => $name,
            'short_name' => $shortName,
            'description' => "Dashboard {$name}",
            'id' => '/dashboard',
            'start_url' => '/dashboard',
            'scope' => '/',
            'display' => 'standalone',
            'orientation' => 'portrait-primary',
            'background_color' => '#09090b',
            'theme_color' => $settings->brandColor(),
            'lang' => 'id',
            'dir' => 'ltr',
            'categories' => ['photography', 'business', 'productivity'],
            'icons' => [
                ['src' => '/icons/pwa-192.png', 'sizes' => '192x192', 'type' => 'image/png'],
                ['src' => '/icons/pwa-512.png', 'sizes' => '512x512', 'type' => 'image/png'],
                ['src' => '/icons/pwa-maskable-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
            ],
            'shortcuts' => [
                [
                    'name' => 'Pesanan Saya',
                    'url' => '/dashboard/pesanan',
                    'icons' => [['src' => '/icons/pwa-192.png', 'sizes' => '192x192']],
                ],
                [
                    'name' => 'Pesan',
                    'url' => '/dashboard/client-messages',
                    'icons' => [['src' => '/icons/pwa-192.png', 'sizes' => '192x192']],
                ],
            ],
        ])
        ->header('Content-Type', 'application/manifest+json');
})->name('pwa.manifest');

Route::view('/offline', 'errors.offline')->name('pwa.offline');
Route::get('/access/{token}', [AuthController::class, 'accessViaToken'])->name('access.token');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// React dashboard shell (SPA)
Route::middleware(['auth', 'maintenance'])->group(function () {
    Route::get('/dashboard', function () {
        return view('app');
    })->name('dashboard');
    Route::get('/dashboard/{any}', function () {
        return view('app');
    })->where('any', '.*');
});

// Halaman guest SPA (lupa/reset/set password)
Route::middleware(['guest', 'maintenance'])->group(function () {
    Route::get('/forgot', fn () => view('app'))->name('forgot');
});
Route::get('/set-password', fn () => view('app'))->name('set-password');
Route::get('/reset-password', fn () => view('app'))->name('reset-password');
