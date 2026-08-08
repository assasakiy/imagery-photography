<?php

namespace App\Http\Controllers;

use App\Models\Faq;

class FaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::where('published', true)->orderBy('order')->get();

        return view('landing_pages.faq', compact('faqs'));
    }
}
