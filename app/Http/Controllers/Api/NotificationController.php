<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->user()->notifications()->latest();

        $category = $request->input('category');
        if ($category && $category !== 'semua') {
            $q->where(function ($sub) use ($category) {
                switch ($category) {
                    case 'pesan':
                        $sub->where('data->type', 'message.new');
                        break;
                    case 'booking':
                        $sub->where('data->type', 'booking.new');
                        break;
                    case 'review':
                        $sub->whereIn('data->type', ['review.new', 'review.approved']);
                        break;
                    case 'sistem':
                        $sub->where(function ($q2) {
                            $q2->whereNull('data->type')
                                ->orWhereNotIn('data->type', ['message.new', 'booking.new', 'review.new', 'review.approved']);
                        });
                        break;
                }
            });
        }

        $notifications = $q->paginate(20)->through(fn ($n) => $this->serialize($n));

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        return response()->json(['count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        if ($notification->notifiable_id === $request->user()->id) {
            $notification->markAsRead();
        }

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function clearAll(Request $request)
    {
        $request->user()->notifications()->delete();

        return response()->json(['ok' => true]);
    }

    private function serialize(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'data' => $data,
            'url' => $data['url'] ?? null,
            'type' => $data['type'] ?? null,
            'category' => $this->mapCategory($data['type'] ?? null, $data),
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
        ];
    }

    private function mapCategory(?string $type, array $data): string
    {
        $url = (string) ($data['url'] ?? '');
        $title = (string) ($data['title'] ?? '');

        if ($type === 'message.new' || str_contains($url, '/messages') || str_contains($title, 'Pesan')) {
            return 'pesan';
        }
        if ($type === 'booking.new' || str_contains($url, '/bookings') || str_contains($title, 'Booking')) {
            return 'booking';
        }
        if (in_array($type, ['review.new', 'review.approved'], true) || str_contains($url, '/reviews') || str_contains($title, 'Review')) {
            return 'review';
        }

        return 'sistem';
    }
}
