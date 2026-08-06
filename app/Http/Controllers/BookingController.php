<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\LandingContent;
use App\Models\Service;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index()
    {
        $contents = LandingContent::whereIn('key', [
            'contact_phone', 'contact_email', 'contact_address',
            'social_whatsapp',
        ])->pluck('value', 'key')->toArray();

        $services = Service::active()->orderBy('order')->get();

        $packages = \App\Models\Package::with('services')->active()->orderBy('display_order')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'price' => $p->computedPrice(),
                'base_price' => $p->basePrice(),
                'discount' => $p->discountValue(),
                'is_featured' => $p->is_featured,
                'items' => $p->services->map(fn ($s) => $s->name)->values(),
            ];
        });

        return view('booking.index', compact('contents', 'services', 'packages'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required_without:email|nullable|string|max:20',
            'email' => 'required_without:phone|nullable|email|max:255',
            'event_date' => 'nullable|date',
            'package' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        $data['type'] = 'booking';
        $data['message'] = $data['message'] ?? '';

        $booking = ContactMessage::create($data);

        $notifications = app(NotificationService::class);
        $notifications->toAdmins(
            'Booking baru: ' . $booking->name,
            "{$booking->name} (" . ($booking->phone ?: $booking->email) . ") memesan untuk " . ($booking->package ?: 'paket umum') . ($booking->event_date ? ' pada ' . $booking->event_date : '') . '.',
            '/dashboard/messages/' . $booking->id,
            'booking.new'
        );
        $notifications->webhook('booking.new', [
            'id' => $booking->id,
            'name' => $booking->name,
            'phone' => $booking->phone,
            'email' => $booking->email,
            'event_date' => $booking->event_date,
            'package' => $booking->package,
        ]);

        app(\App\Services\AuditLogger::class)->log('booking.created', 'Booking baru: ' . $booking->name . ' (' . ($booking->phone ?: $booking->email) . ')', $booking);

        app(\App\Services\ClientRegistrationService::class)->registerWithInvite(
            [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
            ],
            'client',
            null,
            $booking
        );

        return back()->with('success', 'Booking diterima! Kami akan menghubungi Anda via WhatsApp segera. Akun klien Anda telah dibuat — cek WhatsApp/Email Anda untuk mengaktifkan akun.');
    }
}
