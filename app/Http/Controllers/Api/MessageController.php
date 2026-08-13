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
        $subQuery = ContactMessage::selectRaw('MAX(id)')->groupByRaw('IFNULL(user_id, COALESCE(email, phone))');

        $query = ContactMessage::with('project', 'user')
            ->whereIn('id', $subQuery)
            ->where(fn ($q) => $q->whereNull('project_id')->orWhereHas('project'));

        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $unreadSub = ContactMessage::selectRaw('IFNULL(user_id, COALESCE(email, phone))')
                ->whereNull('read_at')
                ->where('sender_type', '!=', 'admin');
            
            $query->whereIn(\DB::raw('IFNULL(user_id, COALESCE(email, phone))'), $unreadSub);
        }

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }
        
        if ($request->filled('project_id')) {
            $projectId = $request->input('project_id');
            $projectSub = ContactMessage::selectRaw('IFNULL(user_id, COALESCE(email, phone))')
                ->whereHas('project', function ($q) use ($projectId) {
                    $q->where('id', $projectId)->orWhere('order_no', $projectId);
                });
                
            $query->whereIn(\DB::raw('IFNULL(user_id, COALESCE(email, phone))'), $projectSub);
        }

        return response()->json($query->latest()->paginate(25));
    }

    public function show(ContactMessage $message)
    {
        if (!$message->read_at && $message->sender_type !== 'admin') {
            $message->update(['read_at' => now()]);
        }

        return response()->json($message);
    }

    public function thread(ContactMessage $message)
    {
        $query = ContactMessage::with(['project', 'user', 'replyTo.user']);
        
        if ($message->user_id) {
            $query->where('user_id', $message->user_id);
            ContactMessage::where('user_id', $message->user_id)->where('sender_type', '!=', 'admin')->whereNull('read_at')->update(['read_at' => now()]);
        } else {
            $query->where(function($q) use ($message) {
                if ($message->email) $q->where('email', $message->email);
                elseif ($message->phone) $q->where('phone', $message->phone);
                else $q->where('id', $message->id);
            });
            
            ContactMessage::where(function($q) use ($message) {
                if ($message->email) $q->where('email', $message->email);
                elseif ($message->phone) $q->where('phone', $message->phone);
                else $q->where('id', $message->id);
            })->where('sender_type', '!=', 'admin')->whereNull('read_at')->update(['read_at' => now()]);
        }
        
        return response()->json($query->orderBy('created_at', 'asc')->get());
    }

    public function reply(Request $request, ContactMessage $message)
    {
        $request->validate([
            'message' => 'nullable|string|max:2000',
            'file' => 'nullable|file|max:51200'
        ]);

        if (!$request->filled('message') && !$request->hasFile('file')) {
            abort(422, 'Pesan atau file harus diisi.');
        }

        $url = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->storeAs('messages/' . now()->format('Y/m'), \Illuminate\Support\Str::random(10) . '_' . $file->getClientOriginalName(), 'public');
            $url = \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        }
        
        $reply = ContactMessage::create([
            'user_id' => $message->user_id,
            'project_id' => $request->project_id,
            'reply_to_id' => $request->reply_to_id,
            'name' => $request->user()->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'message' => $request->message ?: '',
            'attachment_url' => $url,
            'sender_type' => 'admin',
            'type' => 'text',
        ]);
        
        return response()->json($reply->load(['project', 'replyTo.user']));
    }

    public function unreadCount()
    {
        return response()->json(['count' => ContactMessage::whereNull('read_at')->where('sender_type', '!=', 'admin')->where(fn ($q) => $q->whereNull('project_id')->orWhereHas('project'))->count()]);
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
