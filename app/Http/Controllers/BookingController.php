<?php

namespace App\Http\Controllers;

use App\Models\Booking;
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
        $contents = [
            'contact_phone' => \App\Models\Setting::getValue('contact_phone'),
            'contact_email' => \App\Models\Setting::getValue('contact_email'),
            'contact_address' => \App\Models\Setting::getValue('contact_address'),
            'social_whatsapp' => \App\Models\Setting::getValue('social_whatsapp'),
        ];

        $services = Service::active()->orderBy('order')->get();

        $packages = Package::with('services')->active()->withBookingCount()->orderBy('display_order')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'price' => $p->computedPrice(),
                'base_price' => $p->basePrice(),
                'discount' => $p->discountValue(),
                'is_featured' => $p->is_featured,
                'booking_count' => $p->booking_count,
                'items' => $p->services->map(fn ($s) => trim($s->event . ' (' . ucfirst((string) $s->media) . ')'))->values(),
            ];
        });

        $page = \App\Models\Page::where('slug', 'booking')->first();

        $sidebar = collect(is_array($page?->sections) ? $page->sections : [])->keyBy('type')->get('booking_sidebar') ?: [];
        $showKontak = ($sidebar['show_kontak'] ?? true) !== false;
        $showPopuler = ($sidebar['show_populer'] ?? true) !== false;
        $showCara = ($sidebar['show_cara'] ?? true) !== false;
        $kontakTitle = trim((string) ($sidebar['kontak_title'] ?? '')) !== '' ? $sidebar['kontak_title'] : 'Kontak Kami';
        $populerTitle = trim((string) ($sidebar['populer_title'] ?? '')) !== '' ? $sidebar['populer_title'] : 'Paket Populer';
        $caraTitle = trim((string) ($sidebar['cara_title'] ?? '')) !== '' ? $sidebar['cara_title'] : 'Cara Booking';
        $caraSteps = array_values(array_filter((array) ($sidebar['cara_steps'] ?? []), fn ($s) => is_string($s) && trim($s) !== ''));
        if (count($caraSteps) === 0) {
            $caraSteps = [
                'Isi formulir dengan data diri & detail acara Anda.',
                'Kami konfirmasi ketersediaan via WhatsApp/Email.',
                'Cicilan atau pelunasan bisa dilakukan dari portal klien.',
            ];
        }

        $faqMode = $sidebar['cara_faq_mode'] ?? 'all';
        $faqTitle = trim((string) ($sidebar['cara_faq_title'] ?? '')) !== '' ? $sidebar['cara_faq_title'] : 'Pertanyaan Umum';
        $faqSection = [
            'mode' => $faqMode,
            'items' => $sidebar['cara_faq_items'] ?? [],
            'categories' => $sidebar['cara_faq_categories'] ?? [],
        ];
        $faqs = \App\Services\LandingContentResolver::faqs($faqSection);
        $showFaq = $faqs->isNotEmpty();

        return view('landing_pages.booking', compact(
            'contents', 'services', 'packages', 'page',
            'showKontak', 'showPopuler', 'showCara', 'kontakTitle', 'populerTitle', 'caraTitle', 'caraSteps',
            'faqs', 'showFaq', 'faqTitle'
        ));
    }

    public function store(Request $request)
    {
        $settings = app(\App\Services\RuntimeSettings::class);
        $emailEnabled = $settings->channelEnabled('email');
        $waEnabled = $settings->channelEnabled('whatsapp');

        // Jika hanya salah satu integrasi yang aktif, paksa field tersebut wajib.
        // Jika keduanya aktif (atau keduanya nonaktif untuk fallback), wajibkan salah satu.
        $emailRule = $emailEnabled && !$waEnabled ? 'required' : 'required_without:phone';
        $phoneRule = $waEnabled && !$emailEnabled ? 'required' : 'required_without:email';

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "{$emailRule}|nullable|email|max:255",
            'phone' => "{$phoneRule}|nullable|string|max:20",
            'package_id' => 'required',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'event_date' => 'nullable|date',
            'event_start_time' => 'nullable|date_format:H:i',
            'event_end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        // Gabung tanggal + jam utama acara menjadi datetime (timezone bisnis → UTC).
        $startTime = $data['event_start_time'] ?? null;
        $endTime = $data['event_end_time'] ?? null;
        $businessTime = app(\App\Support\BusinessTime::class);
        $data['event_start'] = $businessTime->toUtc($data['event_date'] ?? null, $startTime);
        $data['event_end'] = $businessTime->toUtc($data['event_date'] ?? null, $endTime);
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

        // Record limit: counter naik HANYA saat request lolos validasi (mode valid).
        \App\Support\ApiThrottle::record('booking.create', ['email' => $data['email'] ?? '']);

        $authUser = $request->user();
        $isNewClient = false;

        if ($authUser) {
            if (!$authUser->hasRole('client')) {
                $authUser->assignRole('client');
            }
            $user = $authUser;
        } else {
            $reg = app(ClientRegistrationService::class);
            $result = $reg->registerWithInvite(
                ['name' => $data['name'], 'email' => $data['email'] ?? null, 'phone' => $data['phone'] ?? null],
                'client',
                null,
                null
            );
            $user = $result['user'];
            $isNewClient = $result['new'];
        }

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
            'package_id' => $packageId,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'package_label' => $packageLabel,
            'event_date' => $data['event_date'] ?? ($data['event_start'] ? $businessTime->fromUtc($data['event_start'])->toDateString() : null),
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
            '/dashboard/bookings',
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

        if ($authUser && $authUser->status === 'active') {
            $msg = 'Booking diterima! Pesanan Anda telah tercatat di dashboard.';
        } elseif ($authUser) {
            $msg = 'Booking diterima! Pesanan Anda telah tercatat. Hubungi kami untuk aktivasi akun.';
        } else {
            $msg = 'Booking diterima! Kami akan menghubungi Anda via WhatsApp segera. Akun klien Anda telah dibuat — cek WhatsApp/Email Anda untuk mengaktifkan akun.';
        }

        return back()->with('success', $msg);
    }
}
