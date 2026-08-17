<?php

namespace App\Services;

use App\Models\Faq;
use App\Models\Review;
use App\Models\Stat;
use Illuminate\Database\Eloquent\Collection;

class LandingContentResolver
{
    public static function faqs(?array $section, int $limit = 0): Collection
    {
        if (empty($section)) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        $mode = $section['mode'] ?? 'all';
        $query = Faq::with('categories')->orderBy('order')->orderBy('id');

        if ($mode === 'ids') {
            $ids = array_values(array_filter((array) ($section['items'] ?? []), 'is_numeric'));
            if (count($ids) === 0) {
                return new \Illuminate\Database\Eloquent\Collection();
            }
            $query->whereIn('id', $ids);
        } elseif ($mode === 'category') {
            $catIds = array_values(array_filter((array) ($section['categories'] ?? []), 'is_numeric'));
            if (count($catIds) === 0) {
                return new \Illuminate\Database\Eloquent\Collection();
            }
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $catIds));
        } elseif ($limit > 0) {
            $query->limit($limit);
        }

        return $query->get();
    }

    public static function reviews(?array $section): Collection
    {
        if (empty($section)) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        $mode = $section['mode'] ?? 'all';

        if ($mode === 'star' || $mode === 'above') {
            $ids = array_values(array_filter((array) ($section['items'] ?? []), 'is_numeric'));
            if (count($ids) === 0) {
                return new \Illuminate\Database\Eloquent\Collection();
            }

            $query = Review::whereIn('id', $ids);

            if ($mode === 'star') {
                $query->where('rating', (int) ($section['star'] ?? 0));
            } else {
                $query->where('rating', '>=', (int) ($section['min_star'] ?? 1));
            }

            return $query->orderBy('order')->orderByDesc('id')->get();
        }

        $ratings = array_values(array_filter(array_map('intval', (array) ($section['all_ratings'] ?? [])), fn ($r) => $r >= 1 && $r <= 5));
        if (count($ratings) === 0) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        return Review::whereIn('rating', $ratings)->orderBy('order')->orderByDesc('id')->get();
    }

    public static function stats(?array $section): Collection
    {
        if (empty($section)) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        $mode = $section['mode'] ?? 'ids';
        $query = Stat::orderBy('order')->orderBy('id');

        if ($mode === 'ids') {
            $ids = array_values(array_filter((array) ($section['items'] ?? []), 'is_numeric'));
            if (count($ids) === 0) {
                return new \Illuminate\Database\Eloquent\Collection();
            }
            $query->whereIn('id', $ids);
        }

        return $query->get();
    }
}