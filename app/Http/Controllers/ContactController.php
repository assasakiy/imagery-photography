<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Setting;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index()
    {
        $contents = [
            'contact_phone' => Setting::getValue('contact_phone'),
            'contact_email' => Setting::getValue('contact_email'),
            'contact_address' => Setting::getValue('contact_address'),
            'social_facebook' => Setting::getValue('social_facebook'),
            'social_instagram' => Setting::getValue('social_instagram'),
            'social_tiktok' => Setting::getValue('social_tiktok'),
            'social_whatsapp' => Setting::getValue('social_whatsapp'),
        ];

        $page = \App\Models\Page::where('slug', 'contact')->first();

        return view('landing_pages.contact', compact('contents', 'page'));
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
        $page = \App\Models\Page::where('slug', 'services')->first();
        return view('landing_pages.services', compact('services', 'page'));
    }
}
