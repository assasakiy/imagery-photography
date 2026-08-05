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

        $services = Service::orderBy('order')->get();

        return view('booking.index', compact('contents', 'services'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
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
            "{$booking->name} ({$booking->phone}) memesan untuk " . ($booking->package ?: 'paket umum') . ($booking->event_date ? ' pada ' . $booking->event_date : '') . '.',
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

        app(\App\Services\AuditLogger::class)->log('booking.created', 'Booking baru: ' . $booking->name . ' (' . $booking->phone . ')', $booking);

        return back()->with('success', 'Booking diterima! Kami akan menghubungi Anda via WhatsApp segera.');
    }
}
