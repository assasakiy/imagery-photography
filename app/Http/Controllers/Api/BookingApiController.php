<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Project;
use App\Models\ProjectUpdate;
use App\Services\ClientRegistrationService;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingApiController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['user.profile', 'package'])->latest('id');

        // Data klien yang sudah di-trash tidak ditampilkan.
        $query->where(fn ($w) => $w->whereNull('user_id')->orWhereHas('user', fn ($u) => $u->whereNull('deleted_at')));

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('name', 'like', '%' . $q . '%')
                ->orWhere('booking_no', 'like', '%' . $q . '%')
                ->orWhere('email', 'like', '%' . $q . '%')
                ->orWhere('phone', 'like', '%' . $q . '%'));
        }

        return response()->json($query->paginate(15));
    }

    public function show(Booking $booking)
    {
        return response()->json($booking->load(['user.profile', 'package', 'project']));
    }

    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'package_id' => 'nullable|exists:packages,id',
            'package_label' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'event_start' => 'nullable|date',
            'event_end' => 'nullable|date|after:event_start',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'price' => 'nullable|numeric|min:0',
        ]);

        $data['notes'] = ContentSanitizer::plainText($data['notes'] ?? '');

        // Jadwal acara: input wall-clock lokal (timezone bisnis) → simpan UTC.
        $businessTime = app(\App\Support\BusinessTime::class);
        if (array_key_exists('event_start', $data) || array_key_exists('event_end', $data)) {
            $data['event_start'] = $businessTime->parseToUtc($data['event_start'] ?? null);
            $data['event_end'] = $businessTime->parseToUtc($data['event_end'] ?? null);
            $data['event_date'] = $data['event_date'] ?? ($data['event_start'] ? $data['event_start']->toDateString() : null);
        }

        if (!empty($data['package_id'])) {
            $package = \App\Models\Package::find($data['package_id']);
            $data['package_label'] = $package?->name;
            $data['price'] = $data['price'] ?? $package?->computedPrice();
        }

        $booking->update($data);

        app(AuditLogger::class)->log('booking.updated', 'Booking ' . $booking->booking_no . ' diperbarui', $booking);

        return response()->json($booking->load(['user.profile', 'package']));
    }

    public function confirm(Request $request, Booking $booking)
    {
        if (!$booking->isPending()) {
            abort(422, 'Booking tidak dalam status menunggu.');
        }

        $booking->update(['status' => 'confirmed']);
        app(AuditLogger::class)->log('booking.confirmed', 'Booking ' . $booking->booking_no . ' dikonfirmasi', $booking);

        return response()->json($booking->fresh(['user.profile', 'package']));
    }

    public function accept(Request $request, Booking $booking)
    {
        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            abort(422, 'Booking tidak valid untuk diubah jadi proyek.');
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'package_id' => 'nullable|integer',
            'event_date' => 'nullable|date',
            'event_start' => 'nullable|date',
            'event_end' => 'nullable|date|after:event_start',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'dp_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:' . implode(',', \App\Models\Project::STATUSES),
        ]);

        // Jadwal acara: input wall-clock lokal (timezone bisnis) → simpan UTC.
        $businessTime = app(\App\Support\BusinessTime::class);
        $data['event_start'] = $businessTime->parseToUtc($data['event_start'] ?? null);
        $data['event_end'] = $businessTime->parseToUtc($data['event_end'] ?? null);
        $data['event_date'] = $data['event_date'] ?? ($data['event_start'] ? $data['event_start']->toDateString() : null);

        $user = $booking->user;
        if (!$user) {
            $user = app(ClientRegistrationService::class)->ensureUser([
                'name' => $booking->name,
                'email' => $booking->email ?? null,
                'phone' => $booking->phone ?? null,
            ], 'client');
            $booking->update(['user_id' => $user->id]);
        }

        // Paket: prioritas pilihan form, fallback paket dari booking.
        $pkgId = !empty($data['package_id']) ? (int) $data['package_id'] : $booking->package_id;
        $package = $pkgId ? \App\Models\Package::with('services')->find($pkgId) : null;
        $snapshot = $package ? $this->snapshot($package) : null;

        $project = Project::createWithOrderNumber([
            'user_id' => $user->id,
            'name' => $data['name'] ?? $booking->package_label ?: ($booking->name . ' ' . ($booking->event_date?->year ?? '')),
            'package_id' => $package?->id ?? null,
            'event_date' => $data['event_date'] ?? $booking->event_date,
            'event_start' => $data['event_start'] ?? $booking->event_start,
            'event_end' => $data['event_end'] ?? $booking->event_end,
            'description' => ContentSanitizer::plainText($data['description'] ?? ($booking->notes ?? '')) ?: null,
            'location' => ContentSanitizer::plainText($data['location'] ?? ($booking->location ?? '')) ?: null,
            'price' => $data['price'] ?? $booking->price ?? ($package ? $package->computedPrice() : null),
            'pricing_snapshot' => $snapshot,
            'status' => $data['status'] ?? 'scheduled',
        ]);

        // Hubungkan booking → project (histori tetap).
        $booking->update(['status' => 'converted', 'project_id' => $project->id]);

        // Invoice dibuat bila DP di muka ditentukan (selainnya ditunda ke tahap Preview Tersedia).
        if ((float) ($data['dp_amount'] ?? 0) > 0) {
            $invoice = \App\Models\Invoice::create([
                'project_id' => $project->id,
                'number' => \App\Models\Invoice::nextNumber(),
                'issued_at' => now()->toDateString(),
                'due_at' => now()->addDays(7)->toDateString(),
                'base_amount' => $project->price ?? 0,
                'dp_amount' => (float) $data['dp_amount'],
                'status' => 'awaiting_dp',
            ]);
            $project->addSystemUpdate('Invoice ' . $invoice->number . ' dibuat dengan DP Rp ' . number_format((float) $data['dp_amount'], 0, ',', '.') . '.');
        }

        $project->addSystemUpdate('Booking ' . $booking->booking_no . ' diterima — pesanan dibuat dan dijadwalkan untuk pelaksanaan acara.');

        app(AuditLogger::class)->log('booking.accepted', 'Booking ' . $booking->booking_no . ' diterima → project ' . $project->id, $booking);

        app(NotificationService::class)->webhook('booking.accepted', [
            'booking_id' => $booking->id,
            'project_id' => $project->id,
        ]);
        app(NotificationService::class)->notifyBookingAccepted($booking, $project);

        return response()->json([
            'booking' => $booking->fresh(['user.profile', 'package']),
            'project' => $project->load('user.profile'),
        ]);
    }

    public function reject(Request $request, Booking $booking)
    {
        if ($booking->status !== 'pending') {
            abort(422, 'Hanya booking yang menunggu yang bisa ditolak. Gunakan pembatalan untuk booking terkonfirmasi.');
        }

        $request->validate(['reason' => 'nullable|string|max:500']);

        $booking->update(['status' => 'rejected']);

        app(AuditLogger::class)->log('booking.rejected', 'Booking ' . $booking->booking_no . ' ditolak' . ($request->reason ? ": {$request->reason}" : ''), $booking);

        return response()->json($booking->fresh());
    }

    public function cancel(Request $request, Booking $booking)
    {
        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            abort(422, 'Booking tidak valid untuk dibatalkan.');
        }

        $request->validate(['reason' => 'nullable|string|max:500']);

        $wasConfirmed = $booking->status === 'confirmed';
        $booking->update(['status' => 'cancelled']);

        app(AuditLogger::class)->log('booking.cancelled_by_admin', 'Booking ' . $booking->booking_no . ' dibatalkan oleh admin' . ($request->reason ? ": {$request->reason}" : ''), $booking);

        if ($wasConfirmed && $booking->user) {
            app(NotificationService::class)->inApp(
                $booking->user,
                'Booking Dibatalkan',
                'Booking ' . $booking->booking_no . ' telah dibatalkan oleh tim kami.',
                '/dashboard/client-bookings'
            );
        }

        return response()->json($booking->fresh());
    }

    private function snapshot(\App\Models\Package $package): array
    {
        return [
            'package' => $package->name,
            'package_id' => $package->id,
            'items' => $package->services->map(fn ($s) => [
                'service' => $s->event,
                'media' => $s->media,
                'price' => (float) $s->price,
                'qty' => (int) $s->pivot->qty,
                'line_total' => (float) $s->price * (int) $s->pivot->qty,
            ])->values(),
            'discount' => ['type' => $package->promo_type, 'value' => $package->promo_value ?? 0],
            'total' => $package->computedPrice(),
        ];
    }
}