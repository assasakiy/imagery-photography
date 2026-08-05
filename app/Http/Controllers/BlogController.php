<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\User;

class BlogController extends Controller
{
    public function index()
    {
        $query = Blog::with(['author', 'category', 'tags'])->published()->latest('published_at');

        if ($slug = request('category')) {
            $category = BlogCategory::where('slug', $slug)->first();

            if ($category) {
                $query->where('category_id', $category->id);
            }
        }

        if ($slug = request('tag')) {
            $tag = BlogTag::where('slug', $slug)->first();

            if ($tag) {
                $query->whereHas('tags', fn ($q) => $q->where('blog_tags.id', $tag->id));
            }
        }

        if ($q = trim((string) request('q'))) {
            $query->where(fn ($w) => $w
                ->where('title', 'like', '%' . $q . '%')
                ->orWhere('excerpt', 'like', '%' . $q . '%'));
        }

        $posts = $query->paginate(9)->withQueryString();

        $categories = BlogCategory::withCount('publishedPosts')->get();
        $tags = BlogTag::withCount('posts')->get();

        $featured = Blog::with(['author', 'category', 'tags'])->published()->featured()
            ->latest('published_at')->take(5)->get();

        if ($featured->isEmpty()) {
            $featured = Blog::with(['author', 'category', 'tags'])->published()
                ->latest('published_at')->take(5)->get();
        }

        $popular = Blog::with(['author', 'category', 'tags'])->published()
            ->orderByDesc('views_count')->orderByDesc('published_at')->take(5)->get();

        return view('blog.index', compact('posts', 'categories', 'tags', 'featured', 'popular'));
    }

    public function show(string $slug)
    {
        $post = Blog::with(['author', 'category', 'tags'])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        $post->increment('views_count');

        if ($user = request()->user()) {
            app(\App\Services\HistoryService::class)->read($user, Blog::class, $post->id, ['title' => $post->title]);
        }

        $related = Blog::published()
            ->where('id', '!=', $post->id)
            ->when($post->category_id, fn ($q) => $q->where('category_id', $post->category_id))
            ->latest('published_at')
            ->take(3)
            ->get();

        return view('blog.show', compact('post', 'related'));
    }

    public function author(string $identifier)
    {
        $author = User::where('id', (int) $identifier)->firstOrFail();

        $posts = Blog::with(['author', 'category', 'tags'])->published()
            ->where('author_id', $author->id)
            ->latest('published_at')
            ->paginate(9)
            ->withQueryString();

        $categories = BlogCategory::withCount('publishedPosts')->get();
        $tags = BlogTag::withCount('posts')->get();

        return view('blog.author', compact('author', 'posts', 'categories', 'tags'));
    }

    public function category(string $slug)
    {
        $category = BlogCategory::where('slug', $slug)->firstOrFail();

        $posts = Blog::with(['author', 'category', 'tags'])->published()
            ->where('category_id', $category->id)
            ->latest('published_at')
            ->paginate(9)
            ->withQueryString();

        $categories = BlogCategory::withCount('publishedPosts')->get();

        return view('blog.category', compact('category', 'posts', 'categories'));
    }

    public function tag(string $slug)
    {
        $tag = BlogTag::where('slug', $slug)->firstOrFail();

        $posts = Blog::with(['author', 'category', 'tags'])->published()
            ->whereHas('tags', fn ($q) => $q->where('blog_tags.id', $tag->id))
            ->latest('published_at')
            ->paginate(9)
            ->withQueryString();

        $categories = BlogCategory::withCount('publishedPosts')->get();

        return view('blog.tag', compact('tag', 'posts', 'categories'));
    }
}