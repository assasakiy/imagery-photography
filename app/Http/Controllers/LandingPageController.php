<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Faq;
use App\Models\LandingContent;
use App\Models\Portfolio;
use App\Models\Review;
use App\Models\Service;

class LandingPageController extends Controller
{
    public function index()
    {
        $contents = LandingContent::all()->pluck('value', 'key')->toArray();
        $portfolios = Portfolio::where('is_featured', true)->orderBy('order')->take(6)->get();
        $services = Service::orderBy('order')->get();
        $blogs = Blog::with('author:id,name')->published()->orderByDesc('published_at')->take(3)->get();
        $faqs = Faq::where('published', true)->orderBy('order')->get();
        $reviews = Review::approved()->orderBy('order')->orderByDesc('id')->take(6)->get();

        return view('landing.index', compact('contents', 'portfolios', 'services', 'blogs', 'faqs', 'reviews'));
    }
}
