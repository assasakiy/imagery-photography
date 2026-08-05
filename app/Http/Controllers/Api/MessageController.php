<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $query = ContactMessage::query();

        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function show(ContactMessage $message)
    {
        if (!$message->read_at) {
            $message->update(['read_at' => now()]);
        }

        return response()->json($message);
    }

    public function unreadCount()
    {
        return response()->json(['count' => ContactMessage::whereNull('read_at')->count()]);
    }

    public function destroy(ContactMessage $message)
    {
        $message->delete();

        return response()->json(['ok' => true]);
    }

    public static function notifyNewMessage(ContactMessage $message): void
    {
        $notifications = app(NotificationService::class);
        $notifications->webhook('message.new', [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'message' => $message->message,
        ]);
    }
}
