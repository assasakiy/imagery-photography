<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\LandingContent;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index()
    {
        $contents = LandingContent::whereIn('key', [
            'contact_phone', 'contact_email', 'contact_address',
            'social_facebook', 'social_instagram', 'social_tiktok', 'social_whatsapp',
        ])->pluck('value', 'key')->toArray();

        return view('contact.index', compact('contents'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string',
        ]);

        $message = ContactMessage::create($data);

        $notifications = app(NotificationService::class);
        $notifications->toAdmins(
            'Pesan kontak baru',
            "{$message->name} ({$message->email}) mengirim pesan.",
            '/dashboard/messages/' . $message->id,
            'message.new'
        );
        $notifications->webhook('message.new', [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'message' => $message->message,
        ]);

        return back()->with('success', 'Pesan berhasil dikirim! Kami akan menghubungi Anda segera.');
    }

    public function services()
    {
        $services = \App\Models\Service::active()->orderBy('order')->get();
        return view('services.index', compact('services'));
    }
}
