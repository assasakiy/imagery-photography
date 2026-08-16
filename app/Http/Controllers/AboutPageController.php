<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Portfolio;
use App\Models\TeamMember;

class AboutPageController extends Controller
{
    public function index()
    {
        $page = Page::where('slug', 'tentang')->first();

        $aboutImage = $page
            ? \App\Services\AssetResolver::pageImage($page, 'about_image', \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE)
            : \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE;

        $featured = Portfolio::where('is_featured', true)->orderBy('order')->take(4)->get();

        $team = TeamMember::orderByDesc('is_owner')->orderBy('order')->get();

        $sections = is_array($page?->sections) ? $page->sections : [];

        $timeline = collect($sections)->firstWhere('type', 'timeline');
        $timeline = $timeline && is_array($timeline['data'] ?? null)
            ? array_values(array_filter($timeline['data'], fn ($t) => !empty($t['year'])))
            : [];

        $history = collect($sections)->firstWhere('type', 'history');
        $history = is_array($history) ? (string) ($history['text'] ?? '') : '';

        return view('landing_pages.about', compact('page', 'aboutImage', 'featured', 'team', 'timeline', 'history'));
    }
}
