<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;
use App\Models\Category;

class GalleryController extends Controller
{
    public function index()
    {
        $portfolios = Portfolio::with('categories')->orderBy('order')->paginate(12);
        $categories = $this->activeCategories();

        return view('landing_pages.gallery.index', compact('portfolios', 'categories'));
    }

    public function show(string $slug)
    {
        $portfolio = Portfolio::with('categories')->where('slug', $slug)->firstOrFail();

        if ($user = request()->user()) {
            app(\App\Services\HistoryService::class)->viewed($user, Portfolio::class, $portfolio->id, ['title' => $portfolio->title]);
        }

        $related = Portfolio::with('categories')
            ->where('id', '!=', $portfolio->id)
            ->when($portfolio->categories->isNotEmpty(), fn ($q) => $q
                ->whereHas('categories', fn ($w) => $w->whereIn('categories.id', $portfolio->categories->pluck('id'))))
            ->orderBy('order')
            ->take(3)
            ->get();

        return view('landing_pages.gallery.show', compact('portfolio', 'related'));
    }

    public function category(string $slug)
    {
        $categories = $this->activeCategories();
        $category = $categories->firstWhere('slug', $slug);

        if (!$category) {
            abort(404);
        }

        $page = \App\Models\Page::where('slug', 'gallery')->first();

        $portfolios = Portfolio::with('categories')
            ->whereHas('categories', fn ($q) => $q->where('categories.id', $category->id))
            ->orderBy('order')
            ->paginate(12);

        return view('landing_pages.gallery.category', compact('portfolios', 'category', 'categories', 'page'));
    }

    protected function activeCategories()
    {
        return Category::withCount(['portfolios'])
            ->having('portfolios_count', '>', 0)
            ->orderBy('name')
            ->get();
    }
}
