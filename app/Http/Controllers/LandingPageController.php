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
        $portfolios = Portfolio::where('is_featured', true)->orderBy('order')->take(6)->get();
        $services = Service::active()->orderBy('order')->get();
        $packages = Package::with('services')->active()->orderBy('display_order')->take(3)->get();

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

        return view('landing_pages.home', compact('portfolios', 'services', 'packages', 'blogs', 'faqs', 'reviews', 'aboutStats', 'faqSec', 'reviewSec', 'page'));
    }
}