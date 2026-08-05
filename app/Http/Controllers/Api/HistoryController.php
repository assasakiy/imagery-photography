<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $limit = min(50, (int) $request->query('limit', 20));

        $events = $request->user()->historyEvents()->latest()->limit($limit)->get();

        return response()->json($events->map(function ($e) {
            $target = $e->target;
            $title = $target?->title ?? $target?->name ?? null;

            return [
                'id' => $e->id,
                'action' => $e->action,
                'target_type' => $e->target_type ? class_basename($e->target_type) : null,
                'target_id' => $e->target_id,
                'title' => $title,
                'meta' => $e->meta,
                'created_at' => $e->created_at,
            ];
        }));
    }
}