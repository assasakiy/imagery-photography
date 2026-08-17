<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\Page;
use App\Services\LandingContentResolver;

class FaqController extends Controller
{
    public function index()
    {
        $page = Page::where('slug', 'faq-page')->first();

        $section = collect(is_array($page?->sections) ? $page->sections : [])
            ->firstWhere('type', 'faq');

        $faqs = $section
            ? LandingContentResolver::faqs($section)
            : Faq::with('categories')->orderBy('order')->orderBy('id')->get();

        return view('landing_pages.faq', compact('faqs', 'page'));
    }
}