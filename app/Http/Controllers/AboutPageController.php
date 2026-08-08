<?php

namespace App\Http\Controllers;

use App\Models\LandingContent;
use App\Models\Portfolio;
use App\Models\TeamMember;

class AboutPageController extends Controller
{
    public function index()
    {
        $contents = LandingContent::all()->pluck('value', 'key')->toArray();

        $aboutImage = \App\Services\AssetResolver::landingImage('about_image', \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE);

        $featured = Portfolio::where('is_featured', true)->orderBy('order')->take(4)->get();

        $team = TeamMember::orderByDesc('is_owner')->orderBy('order')->get();

        $timeline = json_decode($contents['about_timeline'] ?? '[]', true);
        $timeline = is_array($timeline) ? array_values(array_filter($timeline, fn ($t) => !empty($t['year']))) : [];

        return view('landing_pages.about', compact('contents', 'aboutImage', 'featured', 'team', 'timeline'));
    }
}
