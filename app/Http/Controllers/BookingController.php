<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\LandingContent;
use App\Models\Package;
use App\Models\Service;
use App\Services\AuditLogger;
use App\Services\ClientRegistrationService;
use App\Services\NotificationService;
use App\Support\ContentSanitizer;
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

        $packages = Package::with('services')->active()->orderBy('display_order')->get()->map(function ($p) {
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

        return view('landing_pages.booking', compact('contents', 'services', 'packages'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'package_id' => 'required',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'event_date' => 'nullable|date',
            'event_start_time' => 'nullable|date_format:H:i',
            'event_end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        // Gabung tanggal + jam utama acara menjadi datetime.
        $startTime = $data['event_start_time'] ?? null;
        $endTime = $data['event_end_time'] ?? null;
        $data['event_start'] = $data['event_date'] && $startTime ? \Illuminate\Support\Carbon::parse($data['event_date'])->setTimeFromTimeString($startTime) : null;
        $data['event_end'] = $data['event_date'] && $endTime ? \Illuminate\Support\Carbon::parse($data['event_date'])->setTimeFromTimeString($endTime) : null;
        unset($data['event_start_time'], $data['event_end_time']);

        if ($data['package_id'] === 'custom' && empty($data['service_ids'])) {
            return back()->withErrors(['service_ids' => 'Pilih minimal satu layanan untuk paket kustom.'])->withInput();
        }

        if ($data['package_id'] !== 'custom' && !\App\Models\Package::where('id', $data['package_id'])->exists()) {
            return back()->withErrors(['package_id' => 'Paket yang dipilih tidak valid.'])->withInput();
        }

        $data['notes'] = ContentSanitizer::plainText($data['message'] ?? '');
        $data['location'] = ContentSanitizer::plainText($data['location'] ?? '');
        unset($data['message']);

        // User pending + booking + invite.
        $reg = app(ClientRegistrationService::class);
        $result = $reg->registerWithInvite(
            ['name' => $data['name'], 'email' => $data['email'] ?? null, 'phone' => $data['phone'] ?? null],
            'client',
            null,
            null
        );
        $user = $result['user'];

        if ($data['package_id'] === 'custom') {
            $services = \App\Models\Service::whereIn('id', $data['service_ids'])->get();
            $packageId = null;
            $packageLabel = 'Kustom: ' . $services->map(fn($s) => $s->event . ' (' . ucfirst($s->media) . ')')->join(' + ');
            $price = $services->sum('price');
        } else {
            $package = Package::find($data['package_id']);
            $packageId = $package->id;
            $packageLabel = $package->name;
            $price = $package->computedPrice();
        }

$booking = Booking::create([
            'user_id' => $user->id,
            'package_id' => $package->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'package_label' => $package->name,
            'event_date' => $data['event_date'] ?? ($data['event_start'] ? \Illuminate\Support\Carbon::parse($data['event_start'])->toDateString() : null),
            'event_start' => $data['event_start'] ?? null,
            'event_end' => $data['event_end'] ?? null,
            'location' => $data['location'] ?? null,
            'notes' => $data['notes'] ?? null,
            'price' => $price,
            'status' => 'pending',
        ]);

        $notifications = app(NotificationService::class);
        $notifications->toAdmins(
            'Booking baru: ' . $booking->name,
            "{$booking->name} (" . ($booking->phone ?: $booking->email) . ") memesan untuk " . ($booking->package_label ?: 'paket umum') . ($booking->event_date ? ' pada ' . $booking->event_date->format('d M Y') : '') . '.',
            '/dashboard/bookings/' . $booking->id,
            'booking.new'
        );
        $notifications->webhook('booking.new', [
            'id' => $booking->id,
            'booking_no' => $booking->booking_no,
            'name' => $booking->name,
            'phone' => $booking->phone,
            'email' => $booking->email,
            'event_date' => $booking->event_date,
            'package' => $booking->package_label,
            'location' => $booking->location,
        ]);

        app(AuditLogger::class)->log('booking.created', 'Booking baru ' . $booking->booking_no . ': ' . $booking->name . ' (' . ($booking->phone ?: $booking->email) . ')', $booking);

        return back()->with('success', 'Booking diterima! Kami akan menghubungi Anda via WhatsApp segera. Akun klien Anda telah dibuat — cek WhatsApp/Email Anda untuk mengaktifkan akun.');
    }
}
