<?php

namespace App\Http\Controllers;

use App\Models\Faq;

class FaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::where('published', true)->orderBy('order')->get();
        $page = \App\Models\Page::where('slug', 'faq-page')->first();

        return view('landing_pages.faq', compact('faqs', 'page'));
    }
}
