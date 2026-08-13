<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ProjectFile;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $projects = $user->projects()->get();

        return response()->json([
            'projects' => $projects->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'status' => $p->status,
                'price' => $p->price,
                'updated_at' => $p->updated_at,
            ]),
            'bookings' => ContactMessage::where('type', 'booking')
                ->where(fn ($q) => $q->where('email', $user->email)->orWhere('phone', $user->phone))
                ->count(),
            'bookmarks' => $user->bookmarks()->count(),
            'downloadable' => ProjectFile::whereIn('project_id', $projects->pluck('id'))
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->count(),
        ]);
    }

    public function packages()
    {
        return response()->json(\App\Models\Package::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'type', 'manual_price', 'price_mode', 'promo_value', 'promo_type']));
    }

    public function services()
    {
        return response()->json(\App\Models\Service::where('active', true)->orderBy('order')->get(['id', 'event', 'media', 'price']));
    }

    public function bookings(Request $request)
    {
        $user = $request->user();

        return response()->json(
            Booking::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->get(['id', 'booking_no', 'name', 'phone', 'email', 'package_label', 'event_date', 'location', 'notes', 'price', 'status', 'project_id', 'created_at'])
        );
    }

    public function storeBooking(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'package_id' => 'required',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'event_date' => 'nullable|date',
            'event_start' => 'nullable|date',
            'event_end' => 'nullable|date|after:event_start',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($data['package_id'] === 'custom' && empty($data['service_ids'])) {
            return response()->json(['errors' => ['service_ids' => ['Pilih minimal satu layanan untuk paket kustom.']]], 422);
        }

        if ($data['package_id'] !== 'custom' && !\App\Models\Package::where('id', $data['package_id'])->exists()) {
            return response()->json(['errors' => ['package_id' => ['Paket yang dipilih tidak valid.']]], 422);
        }

        $data['notes'] = \App\Support\ContentSanitizer::plainText($data['notes'] ?? '');
        $data['location'] = \App\Support\ContentSanitizer::plainText($data['location'] ?? '');

        // Record limit: counter naik HANYA pada request valid. Cek sudah oleh middleware.
        \App\Support\ApiThrottle::record('booking.create', ['email' => $user->email ?? '']);
        
        if ($data['package_id'] === 'custom') {
            $services = \App\Models\Service::whereIn('id', $data['service_ids'])->get();
            $packageId = null;
            $packageLabel = 'Kustom: ' . $services->map(fn($s) => $s->event . ' (' . ucfirst($s->media) . ')')->join(' + ');
            $price = $services->sum('price');
        } else {
            $package = \App\Models\Package::find($data['package_id']);
            $packageId = $package->id;
            $packageLabel = $package->name;
            $price = $package->computedPrice();
        }

        // Jadwal acara: input wall-clock lokal (timezone bisnis) → simpan UTC.
        $businessTime = app(\App\Support\BusinessTime::class);
        $eventStart = $businessTime->parseToUtc($data['event_start'] ?? null);
        $eventEnd = $businessTime->parseToUtc($data['event_end'] ?? null);

        $booking = Booking::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'package_id' => $packageId,
            'package_label' => $packageLabel,
            'event_date' => $data['event_date'] ?? ($eventStart ? $eventStart->toDateString() : null),
            'event_start' => $eventStart,
            'event_end' => $eventEnd,
            'location' => $data['location'] ?? null,
            'notes' => $data['notes'] ?? null,
            'price' => $price,
            'status' => 'pending',
        ]);

        app(\App\Services\NotificationService::class)->toAdmins('Booking Baru (Member)', 'Booking dari ' . $user->name, '/dashboard/bookings');

        return response()->json($booking);
    }

    public function cancelBooking(Request $request, Booking $booking)
    {
        $user = $request->user();

        if ($booking->user_id !== $user->id) {
            abort(403);
        }

        \App\Support\ApiThrottle::record('booking.update', ['email' => $user->email ?? '']);

        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            abort(422, 'Hanya booking yang menunggu atau dikonfirmasi yang bisa dibatalkan.');
        }

        $booking->update(['status' => 'cancelled']);
        
        app(\App\Services\AuditLogger::class)->log('booking.cancelled_by_client', 'Booking ' . $booking->booking_no . ' dibatalkan oleh klien.', $booking);
        
        return response()->json(['ok' => true]);
    }

    public function invoices(Request $request)
    {
        $projectIds = $request->user()->projects()->pluck('id');

        $invoices = Invoice::with(['project'])
            ->whereIn('project_id', $projectIds)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'number' => $inv->number,
                'project_id' => $inv->project_id,
                'project' => $inv->project?->name,
                'price' => $inv->base_amount,
                'dp_amount' => $inv->dp_amount,
                'paid' => $inv->paid_amount,
                'remaining' => $inv->remaining(),
                'status' => $inv->status,
                'issued_at' => $inv->issued_at,
                'due_at' => $inv->due_at,
            ]);

        return response()->json($invoices);
    }

    public function payments(Request $request)
    {
        $user = $request->user();
        $projectIds = $user->projects()->pluck('id');

        return response()->json(
            Payment::whereIn('project_id', $projectIds)->orderByDesc('created_at')->get()
        );
    }

    public function gallery(Request $request)
    {
        $projectId = $request->query('project_id');
        $user = $request->user();
        
        // Admin/staff: lihat semua. Klien: aset baru tampil SETELAH admin konfirmasi (status preview/akhir/arsip).
        $query = $user->isStaff()
            ? \App\Models\Project::query()
            : \App\Models\Project::whereIn('status', ['awaiting_payment', 'completed', 'archived']);

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $projectsQuery = clone $query;

        if ($projectId) {
            $projectsQuery->where(function ($q) use ($projectId) {
                $q->where('id', $projectId)->orWhere('order_no', $projectId);
            });
        }

        $projects = $projectsQuery->with(['files.media', 'payments', 'invoice', 'accessTokens', 'redeliveries'])->latest()->get();

        return response()->json(
            $projects->filter(fn ($p) => $p->files->filter(fn ($f) => in_array($f->category, ['photo', 'video'], true) && ($f->media_id || $f->variant === 'original'))->count() > 0)
                ->map(function ($p) {
                    return [
                'id' => $p->id,
                'order_no' => $p->order_no,
                'name' => $p->name,
                'event_date' => $p->event_date,
                'status' => $p->status,
                'client_name' => $p->user?->name,
                'is_paid' => $p->isPaid(),
                'preview_expired' => (bool) $p->preview_expired_at,
                'archived' => (bool) $p->isArchived(),
                'thumb_url' => $p->getMedia('thumbnail')->first()?->getUrl(),
                'access_url' => $p->accessTokens()->valid()->latest('id')->first()?->url,
                'redeliveries' => $p->redeliveries->map(fn ($r) => [
                    'id' => $r->id,
                    'status' => $r->status,
                    'fee' => $r->fee,
                    'note' => $r->note,
                    'expires_at' => $r->expires_at,
                ])->values(),
                'files' => $p->files
                    ->filter(fn ($f) => in_array($f->category, ['photo', 'video'], true) && ($f->media_id || $f->variant === 'original'))
                    ->map(function ($f) {
                        $available = $f->isPreviewAvailable();

                        return [
                            'id' => $f->id,
                            'name' => $f->original_name,
                            'url' => $available ? $f->url : null,
                            'type' => $f->type,
                            'category' => $f->category,
                            'size' => $f->size,
                            'expires_at' => $f->expires_at,
                            'available' => $available,
                        ];
                    })->values(),
            ];
        })->values());
    }

    public function messages(Request $request)
    {
        $user = $request->user();
        $query = \App\Models\ContactMessage::with(['project', 'replyTo.user'])
            ->where(function($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('email', $user->email)
                  ->orWhere('phone', $user->phone);
            });

        return response()->json($query->orderBy('created_at', 'asc')->get());
    }

    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'message' => 'nullable|string|max:2000',
            'project_id' => 'nullable',
            'reply_to_id' => 'nullable|exists:contact_messages,id',
            'file' => 'nullable|file|max:51200'
        ]);

        if (empty($data['message']) && !$request->hasFile('file')) {
            abort(422, 'Pesan atau file harus diisi.');
        }

        $user = $request->user();
        $projectId = null;

        if (!empty($data['project_id'])) {
            $project = $user->isStaff() ? \App\Models\Project::where('id', $data['project_id'])->orWhere('order_no', $data['project_id'])->firstOrFail() : $user->projects()->where(function ($q) use ($data) {
                $q->where('id', $data['project_id'])->orWhere('order_no', $data['project_id']);
            })->firstOrFail();
            $projectId = $project->id;
        }

        $url = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->storeAs('messages/' . now()->format('Y/m'), \Illuminate\Support\Str::random(10) . '_' . $file->getClientOriginalName(), 'public');
            $url = \Illuminate\Support\Facades\Storage::disk('public')->url($path);
        }

        $messageRecord = \App\Models\ContactMessage::create([
            'user_id' => $user->id,
            'sender_type' => 'client',
            'type' => 'text',
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'message' => $data['message'] ?: '',
            'attachment_url' => $url,
            'project_id' => $projectId,
            'reply_to_id' => $data['reply_to_id'] ?? null,
        ]);

        return response()->json($messageRecord->load(['project', 'replyTo.user']));
    }

    public function deleteMessage(Request $request, \App\Models\ContactMessage $message)
    {
        $user = $request->user();
        // Client can only delete their own messages
        if ($message->user_id !== $user->id || $message->sender_type !== 'client') {
            abort(403, 'Tidak diizinkan.');
        }

        $message->delete();
        return response()->json(['ok' => true]);
    }
}