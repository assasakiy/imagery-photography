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
        $query = Review::with(['client', 'project']);

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
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
            'service' => 'nullable|string|max:255',
            'rating' => 'required|integer|between:1,5',
            'recommend_score' => 'nullable|integer|between:0,10',
            'title' => 'nullable|string|max:255',
            'content' => 'required|string|max:2000',
        ]);

        $project = $user->projects()->findOrFail($data['project_id']);

        if (!$project->isPaid() || $project->status !== 'completed') {
            abort(403, 'Review hanya dapat diberikan setelah proyek selesai dan lunas.');
        }

        $existing = Review::where('client_id', $user->id)->where('project_id', $project->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Anda sudah memberikan review untuk proyek ini.'], 422);
        }

        $data['content'] = ContentSanitizer::plainText($data['content']);

        $review = Review::create([
            'client_id' => $user->id,
            'project_id' => $project->id,
            'name' => $data['name'],
            'service' => $data['service'],
            'rating' => $data['rating'],
            'recommend_score' => $data['recommend_score'] ?? null,
            'title' => $data['title'] ?? null,
            'content' => $data['content'],
            'status' => 'pending',
        ]);

        app(\App\Services\AuditLogger::class)->log('review.created', 'Review baru dari ' . $review->name . ' untuk ' . $project->name, $review);

        app(NotificationService::class)->inApp(
            \App\Models\User::role(['owner', 'admin'])->get(),
            'Review baru menunggu persetujuan',
            "{$review->name} memberi rating {$review->rating}/5 untuk {$project->name}.",
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
            'recommend_score' => 'nullable|integer|between:0,10',
            'title' => 'nullable|string|max:255',
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

        $data['published_at'] = $data['status'] === 'approved' ? now() : null;
        $review->update($data);

        if ($data['status'] === 'approved' && $review->client) {
            app(NotificationService::class)->inApp(
                $review->client,
                'Review Anda disetujui',
                'Terima kasih! Review Anda sudah tampil di website.',
                '/dashboard/projects/' . $review->project_id . '?tab=review',
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
            'project_id' => $review->project_id,
            'project' => $review->project?->name,
            'name' => $review->name,
            'service' => $review->service,
            'rating' => $review->rating,
            'recommend_score' => $review->recommend_score,
            'title' => $review->title,
            'content' => $review->content,
            'status' => $review->status,
            'published_at' => $review->published_at,
            'order' => $review->order,
            'created_at' => $review->created_at,
            'client' => $review->client ? [
                'id' => $review->client->id,
                'name' => $review->client->name,
                'email' => $review->client->email,
                'avatar' => $review->client->avatar(),
            ] : null,
        ];
    }
}
