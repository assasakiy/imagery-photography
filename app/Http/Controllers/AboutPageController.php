<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Portfolio;
use App\Models\TeamMember;
use App\Services\AssetResolver;
use App\Services\LandingContentResolver;

class AboutPageController extends Controller
{
    public function index()
    {
        $page = Page::where('slug', 'tentang')->first();

        $aboutImage = $page
            ? AssetResolver::pageImage($page, 'about_image', AssetResolver::DEFAULT_ABOUT_IMAGE)
            : AssetResolver::DEFAULT_ABOUT_IMAGE;

        $team = TeamMember::orderByDesc('is_owner')->orderBy('order')->get();

        $sections = is_array($page?->sections) ? $page->sections : [];
        $sections = collect($sections);

        $cerita = $sections->firstWhere('type', 'cerita') ?: [];
        $ceritaSubtitle = (string) ($cerita['subtitle'] ?? 'Cerita Kami');
        $ceritaTitle = (string) ($cerita['title'] ?? 'Cerita Kami');
        $ceritaContent = (string) ($cerita['content'] ?? ($page?->content ?? ''));

        $perjalanan = $sections->firstWhere('type', 'perjalanan') ?: [];
        $perjalananSubtitle = (string) ($perjalanan['subtitle'] ?? 'Perjalanan');
        $perjalananTitle = (string) ($perjalanan['title'] ?? 'Tentang Situs & Layanan');
        $history = (string) ($perjalanan['history'] ?? ($sections->firstWhere('type', 'history')['text'] ?? ''));

        $timeline = $sections->firstWhere('type', 'timeline');
        $timeline = $timeline && is_array($timeline['data'] ?? null)
            ? array_values(array_filter($timeline['data'], fn ($t) => !empty($t['year'])))
            : [];

        $tim = $sections->firstWhere('type', 'tim') ?: [];
        $timSubtitle = (string) ($tim['subtitle'] ?? 'Tim');
        $timTitle = (string) ($tim['title'] ?? 'Di Balik Lensa');

        $karya = $sections->firstWhere('type', 'karya') ?: [];
        $karyaSubtitle = (string) ($karya['subtitle'] ?? 'Karya Unggulan');
        $karyaTitle = (string) ($karya['title'] ?? 'Sebagian Karya Kami');
        $karyaMode = (string) ($karya['mode'] ?? 'featured');
        $karyaLimit = min(9, max(1, (int) ($karya['limit'] ?? 3)));
        $karyaCatIds = array_values(array_filter((array) ($karya['category_ids'] ?? []), 'is_numeric'));

        $featured = Portfolio::where('is_featured', true)->orderBy('order')->take($karyaLimit)->get();
        if ($karyaMode === 'latest') {
            $featured = Portfolio::orderByDesc('id')->take($karyaLimit)->get();
        } elseif ($karyaMode === 'category' && count($karyaCatIds) > 0) {
            $featured = Portfolio::whereHas('categories', fn ($q) => $q->whereIn('categories.id', $karyaCatIds))
                ->orderByDesc('id')
                ->take($karyaLimit)
                ->get();
        } elseif ($featured->isEmpty()) {
            $featured = Portfolio::orderByDesc('id')->take($karyaLimit)->get();
        }

        $statsSec = $sections->firstWhere('type', 'stats');
        $aboutStats = $statsSec ? LandingContentResolver::stats($statsSec) : collect();

        return view('landing_pages.about', compact(
            'page',
            'aboutImage',
            'ceritaSubtitle',
            'ceritaTitle',
            'ceritaContent',
            'perjalananSubtitle',
            'perjalananTitle',
            'history',
            'timeline',
            'timSubtitle',
            'timTitle',
            'karyaSubtitle',
            'karyaTitle',
            'featured',
            'team',
            'aboutStats'
        ));
    }
}
