<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Package;
use App\Models\Page;
use App\Models\Portfolio;
use App\Models\Service;
use App\Services\LandingContentResolver;

class LandingPageController extends Controller
{
    public function index()
    {
        $services = Service::active()->orderBy('order')->get();

        $page = Page::where('slug', 'home')->first();
        $sections = collect(is_array($page?->sections) ? $page->sections : [])->keyBy('type');

        $blogLimit = (int) ($sections->get('blog')['limit'] ?? 3);
        $blogs = Blog::with(['author:id,username', 'author.profile'])->published()->orderByDesc('published_at')->take($blogLimit)->get();

        $faqSec = $sections->get('faq');
        $reviewSec = $sections->get('reviews');
        $statsSec = $sections->get('stats');

        $faqs = $faqSec ? LandingContentResolver::faqs($faqSec) : collect();
        $reviews = $reviewSec ? LandingContentResolver::reviews($reviewSec) : collect();
        $aboutStats = $statsSec ? LandingContentResolver::stats($statsSec) : collect();

        // Section Karya (portofolio di halaman beranda)
        $karyaSec = $sections->get('karya');
        $karyaMode = (string) ($karyaSec['mode'] ?? 'featured');
        $karyaLimit = min(9, max(1, (int) ($karyaSec['limit'] ?? 6)));
        $karyaCatIds = array_values(array_filter((array) ($karyaSec['category_ids'] ?? []), 'is_numeric'));

        $portfolios = Portfolio::where('is_featured', true)->orderBy('order')->take($karyaLimit)->get();
        if ($karyaMode === 'latest') {
            $portfolios = Portfolio::orderByDesc('id')->take($karyaLimit)->get();
        } elseif ($karyaMode === 'category' && count($karyaCatIds) > 0) {
            $portfolios = Portfolio::whereHas('categories', fn ($q) => $q->whereIn('categories.id', $karyaCatIds))
                ->orderByDesc('id')
                ->take($karyaLimit)
                ->get();
        } elseif ($portfolios->isEmpty()) {
            $portfolios = Portfolio::orderByDesc('id')->take($karyaLimit)->get();
        }

        // Section Layanan (paket di halaman beranda)
        $servicesIntro = Page::where('slug', 'services')->value('description') ?: 'Paket dokumentasi untuk momen spesial Anda.';
        $layananSec = $sections->get('layanan');
        $layananMode = (string) ($layananSec['mode'] ?? 'featured');
        $layananLimit = min(9, max(1, (int) ($layananSec['limit'] ?? 3)));

        $packagesQuery = Package::with('services')->active()->withBookingCount();
        if ($layananMode === 'popular') {
            $packagesQuery->orderByDesc('booking_count')->orderBy('display_order');
        } elseif ($layananMode === 'latest') {
            $packagesQuery->orderByDesc('id');
        } elseif ($layananMode === 'all') {
            $packagesQuery->orderBy('display_order');
        } else {
            $packagesQuery->orderByDesc('is_featured')->orderBy('display_order');
        }
        $packages = $packagesQuery->take($layananLimit)->get();

        return view('landing_pages.home', compact(
            'services',
            'packages',
            'blogs',
            'faqs',
            'reviews',
            'aboutStats',
            'portfolios',
            'faqSec',
            'reviewSec',
            'karyaSec',
            'layananSec',
            'servicesIntro',
            'page'
        ));
    }
}