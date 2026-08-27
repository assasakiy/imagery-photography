<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Portfolio;
use App\Models\User;
use App\Services\AssetResolver;
use App\Services\LandingContentResolver;

class AboutPageController extends Controller
{
    public function index()
    {
        $page = Page::where('slug', 'tentang')->first();

        $aboutImage = $page
            ? AssetResolver::pageImage($page, 'about_image', AssetResolver::DEFAULT_ABOUT_IMAGE, 'preview')
            : AssetResolver::DEFAULT_ABOUT_IMAGE;

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
        $timMembers = collect(is_array($tim['members'] ?? null) ? $tim['members'] : [])->keyBy('user_id');

        $team = User::with('profile', 'socials.platform')
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['owner', 'admin']))
            ->orderByDesc('id')
            ->get()
            ->sortByDesc(fn (User $u) => $u->isOwner())
            ->filter(function (User $u) use ($timMembers) {
                $ov = is_array($timMembers->get($u->id)) ? $timMembers[$u->id] : [];

                return ($ov['show'] ?? true) !== false;
            })
            ->map(function (User $u) use ($timMembers) {
                $ov = is_array($timMembers->get($u->id)) ? $timMembers[$u->id] : [];
                $socials = $u->socials->keyBy('platform.slug');

                return [
                    'name' => trim((string) ($ov['name'] ?? '')) !== '' ? $ov['name'] : $u->name,
                    'position' => trim((string) ($ov['position'] ?? '')) !== '' ? $ov['position'] : ($u->occupation ?: ($u->isOwner() ? 'Owner & Founder' : 'Admin')),
                    'bio' => trim((string) ($ov['bio'] ?? '')) !== '' ? $ov['bio'] : ($u->bio ?? ''),
                    'joined_at' => $u->created_at?->translatedFormat('d M Y') ?? '',
                    'email' => $u->email ?? '',
                    'phone' => $u->phone ?? '',
                    'photo' => AssetResolver::resolveImageValue((string) ($ov['photo_url'] ?? ''), $u->avatar() ?: AssetResolver::DEFAULT_AVATAR),
                    'is_owner' => $u->isOwner(),
                    'socials' => [
                        'facebook' => trim((string) ($ov['social_facebook'] ?? '')) !== '' ? $ov['social_facebook'] : ($socials->get('facebook')?->url ?? ''),
                        'instagram' => trim((string) ($ov['social_instagram'] ?? '')) !== '' ? $ov['social_instagram'] : ($socials->get('instagram')?->url ?? ''),
                        'tiktok' => trim((string) ($ov['social_tiktok'] ?? '')) !== '' ? $ov['social_tiktok'] : ($socials->get('tiktok')?->url ?? ''),
                        'whatsapp' => trim((string) ($ov['social_whatsapp'] ?? '')) !== '' ? $ov['social_whatsapp'] : ($socials->get('whatsapp')?->url ?? ''),
                    ],
                ];
            })
            ->values();

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
            'team',
            'karyaSubtitle',
            'karyaTitle',
            'featured',
            'aboutStats'
        ));
    }
}