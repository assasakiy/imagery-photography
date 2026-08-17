<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Review;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with(['client', 'project']);

        if ($request->filled('rating')) {
            $query->where('rating', $request->integer('rating'));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%")
                    ->orWhere('content', 'like', "%{$q}%")
                    ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"))
                    ->orWhereHas('project', fn ($p) => $p->where('name', 'like', "%{$q}%")->orWhere('order_no', 'like', "%{$q}%"));
            });
        }

        $stats = [
            'all' => Review::count(),
            'ratings' => [],
        ];

        foreach (Review::selectRaw('rating, COUNT(*) as total')->groupBy('rating')->pluck('total', 'rating') as $rating => $total) {
            $stats['ratings'][(int) $rating] = (int) $total;
        }

        $paginated = $query->latest()->paginate(12)->withQueryString()->through(fn ($r) => $this->serialize($r));

        $result = $paginated->toArray();
        $result['stats'] = $stats;

        return response()->json($result);
    }

    public function myReview(Request $request)
    {
        $query = Review::where('client_id', $request->user()->id);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        $review = $query->latest()->first();

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

        if (!$project->isPaid() || !$project->completed_at) {
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
        ]);

        app(\App\Services\AuditLogger::class)->log('review.created', 'Review baru dari ' . $review->name . ' untuk ' . $project->name, $review);

        app(NotificationService::class)->inApp(
            User::role(['owner', 'admin'])->get(),
            'Review baru masuk',
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

    public function updateMyReview(Request $request)
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

        if (!$project->isPaid() || !$project->completed_at) {
            abort(403, 'Review hanya dapat diberikan setelah proyek selesai dan lunas.');
        }

        $review = Review::where('client_id', $user->id)->where('project_id', $project->id)->firstOrFail();

        $data['content'] = ContentSanitizer::plainText($data['content']);

        $review->update([
            'name' => $data['name'],
            'service' => $data['service'],
            'rating' => $data['rating'],
            'recommend_score' => $data['recommend_score'] ?? null,
            'title' => $data['title'] ?? null,
            'content' => $data['content'],
        ]);

        app(\App\Services\AuditLogger::class)->log('review.updated', 'Review diperbarui oleh ' . $review->name, $review);

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
            'order_no' => $review->project?->order_no,
            'name' => $review->name,
            'service' => $review->service,
            'rating' => $review->rating,
            'recommend_score' => $review->recommend_score,
            'title' => $review->title,
            'content' => $review->content,
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
