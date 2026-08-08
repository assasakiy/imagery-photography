<?php

namespace App\Http\Controllers;

use App\Models\Page;

class PageController extends Controller
{
    public function privacy()
    {
        return $this->showPage('privacy');
    }

    public function terms()
    {
        return $this->showPage('terms');
    }

    private function showPage(string $slug)
    {
        $page = Page::where('slug', $slug)->where('published', true)->first();

        abort_unless($page, 404);

        return view('landing_pages.page', compact('page'));
    }
}
