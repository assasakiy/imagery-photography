<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Review;
use App\Services\NotificationService;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with('client');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->paginate(15)->through(fn ($r) => $this->serialize($r)));
    }

    public function myReview(Request $request)
    {
        $review = Review::where('client_id', $request->user()->id)->first();

        return response()->json(['review' => $review ? $this->serialize($review) : null]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'service' => 'nullable|string|max:255',
            'rating' => 'required|integer|between:1,5',
            'content' => 'required|string|max:2000',
        ]);

        $data['content'] = ContentSanitizer::plainText($data['content']);

        $existing = Review::where('client_id', $user->id)->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah mengirim review.'], 422);
        }

        $review = Review::create($data + [
            'client_id' => $user->id,
            'status' => 'pending',
        ]);

        app(\App\Services\AuditLogger::class)->log('review.created', 'Review baru dari ' . $review->name, $review);

        app(NotificationService::class)->inApp(
            \App\Models\User::role(['owner', 'admin'])->get(),
            'Review baru menunggu persetujuan',
            "{$review->name} memberi rating {$review->rating}/5.",
            '/dashboard/reviews',
            'review.new'
        );

        return response()->json($this->serialize($review), 201);
    }

    public function update(Request $request, Review $review)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'service' => 'nullable|string|max:255',
            'rating' => 'sometimes|integer|between:1,5',
            'content' => 'sometimes|string|max:2000',
            'order' => 'integer|min:0',
        ]);

        if (isset($data['content'])) {
            $data['content'] = ContentSanitizer::plainText($data['content']);
        }

        $review->update($data);
        app(\App\Services\AuditLogger::class)->log('review.updated', 'Review diperbarui', $review);

        return response()->json($this->serialize($review));
    }

    public function updateStatus(Request $request, Review $review)
    {
        $data = $request->validate([
            'status' => 'required|string|in:approved,rejected,pending',
        ]);

        $review->update($data);

        if ($data['status'] === 'approved' && $review->client) {
            app(NotificationService::class)->inApp(
                $review->client,
                'Review Anda disetujui',
                'Terima kasih! Review Anda sudah tampil di website.',
                '/dashboard/reviews',
                'review.approved'
            );
        }

        return response()->json($this->serialize($review));
    }

    public function destroy(Review $review)
    {
        $review->delete();
        app(\App\Services\AuditLogger::class)->log('review.deleted', 'Review dihapus');

        return response()->json(['ok' => true]);
    }

    private function serialize(Review $review): array
    {
        return [
            'id' => $review->id,
            'client_id' => $review->client_id,
            'client_name' => $review->client?->name,
            'name' => $review->name,
            'service' => $review->service,
            'rating' => $review->rating,
            'content' => $review->content,
            'status' => $review->status,
            'order' => $review->order,
            'created_at' => $review->created_at,
        ];
    }
}
