<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;

class GalleryController extends Controller
{
    public function index()
    {
        $portfolios = Portfolio::orderBy('order')->paginate(12);
        $categories = Portfolio::select('category')->distinct()->pluck('category')->filter();

        return view('gallery.index', compact('portfolios', 'categories'));
    }

    public function show(string $slug)
    {
        $portfolio = Portfolio::where('slug', $slug)->firstOrFail();

        if ($user = request()->user()) {
            app(\App\Services\HistoryService::class)->viewed($user, Portfolio::class, $portfolio->id, ['title' => $portfolio->title]);
        }

        $related = Portfolio::where('category', $portfolio->category)
            ->where('id', '!=', $portfolio->id)
            ->orderBy('order')
            ->take(3)
            ->get();

        return view('gallery.show', compact('portfolio', 'related'));
    }
}
