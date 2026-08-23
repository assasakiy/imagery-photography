<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectUpdate;
use App\Models\Redelivery;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipStream\ZipStream;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isStaff()) {
            // Pemutakhiran status otomatis saat daftar pesanan dibuka (tanpa cron).
            \App\Models\Project::processDueTransitions();

            $query = Project::with('user.profile', 'payments', 'files.media');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            return response()->json($query->latest()->paginate(15));
        }

        $query = $user->projects()->with(['files:id,project_id,category,variant,media_id']);
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $projects = $query->latest()->get() ?? [];

        return response()->json($projects->map(fn ($p) => $this->clientProjectList($p))->values());
    }

    public function show(Request $request, Project $project)
    {
        if ($request->user()->isClient() && $project->user_id !== $request->user()->id) {
            abort(403);
        }

        // Pemutakhiran status otomatis saat detail dibuka (tanpa cron).
        \App\Models\Project::processDueTransitions($project);

        // Bersihkan preview yg sudah lewat masa (berjalan sebagai user web = pemilik file).
        \App\Models\ProjectFile::pruneExpired($project->id);

        // Lazy-finalize day-30 (ZIP + hapus individual original) — lewat request web agar file bisa dibaca.
        if ($project->status !== 'archived' && $project->preview_ends_at && ! $project->preview_expired_at && $project->preview_ends_at->isPast()) {
            app(\App\Services\DeliveryService::class)->finalize($project);
        }

        $project->load(['user.profile', 'files.media', 'payments', 'updates.user', 'accessTokens', 'invoice', 'booking', 'reviews', 'redeliveries']);
        $project->thumb_url = $project->getMedia('thumbnail')->first()?->getUrl();

        if ($request->user()->isClient()) {
            return response()->json($this->clientProjectDetail($project));
        }

        return response()->json($project);
    }

    /** Payload klien: hanya field yg sah utk klien (tidak ada path internal / data admin). */
    private function clientProjectDetail(\App\Models\Project $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'order_no' => $p->order_no,
            'package' => $p->package?->name,
            'package_id' => $p->package_id,
            'event_date' => $p->event_date,
            'event_start' => $p->event_start,
            'event_end' => $p->event_end,
            'status' => $p->status,
            'status_label' => $p->statusLabel(),
            'description' => $p->description,
            'location' => $p->location,
            'price' => $p->price,
            'total_paid' => $p->totalPaid(),
            'remaining' => $p->remainingBalance(),
            'is_paid' => $p->isPaid(),
            'thumb_url' => $p->getMedia('thumbnail')->first()?->getUrl(),
            'preview_expired' => (bool) $p->preview_expired_at,
            'archived' => (bool) $p->isArchived(),
            'photo_total' => $p->photo_total,
            'photo_done' => $p->photo_done,
            'video_total' => $p->video_total,
            'video_done' => $p->video_done,
            'media_types' => collect($p->pricing_snapshot['items'] ?? [])->pluck('media')->filter()->unique()->values()->all(),
            'access_url' => $p->accessTokens()->valid()->latest('id')->first()?->url,
            'user' => ['id' => $p->user_id, 'name' => $p->user?->name, 'username' => $p->user?->username],
            'review_allowed' => $p->isPaid() && (bool) $p->completed_at,
            'review' => $p->reviews->first() ? [
                'id' => $p->reviews->first()->id,
                'rating' => $p->reviews->first()->rating,
                'recommend_score' => $p->reviews->first()->recommend_score,
                'title' => $p->reviews->first()->title,
                'content' => $p->reviews->first()->content,
                'is_published' => $p->reviews->first()->is_published,
                'created_at' => $p->reviews->first()->created_at,
            ] : null,
            'invoice' => $p->invoice ? [
                'number' => $p->invoice->number,
                'base_amount' => $p->invoice->base_amount,
                'dp_amount' => $p->invoice->dp_amount,
                'paid_amount' => $p->invoice->paid_amount,
                'remaining' => $p->invoice->remaining(),
                'status' => $p->invoice->status,
                'issued_at' => $p->invoice->issued_at,
                'due_at' => $p->invoice->due_at,
            ] : null,
            'payments' => $p->payments->map(fn ($pay) => [
                'id' => $pay->id,
                'amount' => $pay->amount,
                'status' => $pay->status,
                'method' => $pay->method,
                'paid_at' => $pay->paid_at,
                'created_at' => $pay->created_at,
            ])->values(),
            'files' => $p->files->map(fn (\App\Models\ProjectFile $f) => [
                'id' => $f->id,
                'category' => $f->category,
                'variant' => $f->variant,
                'original_name' => $f->original_name,
                'size' => $f->size,
                'url' => $f->url,
                'created_at' => $f->created_at,
                'media_id' => $f->media_id,
            ])->values(),
            'updates' => $p->updates->map(fn ($u) => [
                'id' => $u->id,
                'message' => $u->message,
                'kind' => $u->kind,
                'user' => $u->user?->name,
                'created_at' => $u->created_at,
            ])->values(),
            'redeliveries' => $p->redeliveries->map(fn ($r) => [
                'id' => $r->id,
                'status' => $r->status,
                'fee' => $r->fee,
                'note' => $r->note,
                'expires_at' => $r->expires_at,
                'created_at' => $r->created_at,
            ])->values(),
        ];
    }

    /** Payload list utk klien: minimal, tanpa detail internal. */
    private function clientProjectList(\App\Models\Project $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'order_no' => $p->order_no,
            'package' => $p->package?->name ?? ($p->pricing_snapshot['package'] ?? null),
            'status' => $p->status,
            'status_label' => $p->statusLabel(),
            'event_date' => $p->event_date,
            'price' => $p->price,
            'total_paid' => $p->totalPaid(),
            'remaining' => $p->remainingBalance(),
            'is_paid' => $p->isPaid(),
            'has_preview' => in_array($p->status, ['awaiting_payment', 'completed', 'archived'], true) && $p->files->contains(fn ($f) => in_array($f->category, ['photo', 'video'], true) && ($f->media_id || $f->variant === 'original')),
            'thumb_url' => $p->getMedia('thumbnail')->first()?->getUrl(),
            'preview_expired' => (bool) $p->preview_expired_at,
            'archived' => (bool) $p->isArchived(),
            'updated_at' => $p->updated_at,
        ];
    }

    public function store(Request $request)
    {
        $settings = app(\App\Services\RuntimeSettings::class);
        $emailEnabled = $settings->channelEnabled('email');
        $waEnabled = $settings->channelEnabled('whatsapp');

        // Jika membuat klien baru (tanpa user_id), wajibkan kontak sesuai integrasi aktif.
        $emailRule = $emailEnabled && !$waEnabled ? 'required_without:user_id' : 'required_without_all:user_id,client_phone';
        $phoneRule = $waEnabled && !$emailEnabled ? 'required_without:user_id' : 'required_without_all:user_id,client_email';

        $data = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'client_name' => 'required_without:user_id|string|max:255',
            'client_phone' => "{$phoneRule}|nullable|string|max:20",
            'client_email' => "{$emailRule}|nullable|email|max:255",
            'client_notes' => 'nullable|string|max:1000',
            'name' => 'required|string|max:255',
            'package_id' => 'nullable|exists:packages,id',
            'event_date' => 'nullable|date',
            'event_start' => 'nullable|date',
            'event_end' => 'nullable|date|after:event_start',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'dp_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:' . implode(',', \App\Models\Project::STATUSES),
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['client_notes'] = ContentSanitizer::plainText($data['client_notes'] ?? '');
        $data['location'] = ContentSanitizer::plainText($data['location'] ?? '');

        // Jadwal acara: input wall-clock lokal (timezone bisnis) → simpan UTC.
        $businessTime = app(\App\Support\BusinessTime::class);
        $eventStart = $businessTime->parseToUtc($data['event_start'] ?? null);
        $eventEnd = $businessTime->parseToUtc($data['event_end'] ?? null);

        if (!empty($data['user_id'])) {
            $user = User::findOrFail($data['user_id']);
        } else {
            $reg = app(\App\Services\ClientRegistrationService::class);
            $user = $reg->ensureUser([
                'name' => $data['client_name'],
                'email' => $data['client_email'] ?? null,
                'phone' => $data['client_phone'] ?? null,
            ], 'client');
        }

        $package = null;
        $snapshot = null;
        if (!empty($data['package_id'])) {
            $package = \App\Models\Package::with('services')->find($data['package_id']);
            if ($package) {
                $snapshot = [
                    'package' => $package->name,
                    'package_id' => $package->id,
                    'items' => $package->services->map(fn ($s) => [
                        'service' => $s->name,
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

        $project = Project::createWithOrderNumber([
            'user_id' => $user->id,
            'name' => $data['name'],
            'package_id' => $package?->id ?? null,
            'event_date' => $data['event_date'] ?? ($eventStart ? $eventStart->toDateString() : null),
            'event_start' => $eventStart,
            'event_end' => $eventEnd,
            'description' => $data['description'] ?? null,
            'location' => $data['location'] ?? null,
            'price' => $data['price'] ?? ($package ? $package->computedPrice() : null),
            'pricing_snapshot' => $snapshot,
            'status' => $data['status'] ?? 'scheduled',
        ]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Pesanan "' . $project->name . '" telah dibuat dan dijadwalkan untuk pelaksanaan acara.',
            'type' => 'milestone',
            'kind' => 'system',
        ]);

        // Invoice dibuat saat ini HANYA jika admin menentukan DP di muka.
        // Jika tanpa DP, invoice ditunda sampai tahap "Preview Tersedia".
        if ((float) ($data['dp_amount'] ?? 0) > 0) {
            $this->createInvoice($project);
            $project->invoice->update(['dp_amount' => (float) $data['dp_amount']]);
            $project->invoice->refreshStatus();
            $project->addSystemUpdate('Invoice ' . $project->invoice->number . ' dibuat dengan DP Rp ' . number_format((float) $data['dp_amount'], 0, ',', '.') . '.');
        }

        $notifications = app(NotificationService::class);
        $notifications->toAdmins(
            'Project baru: ' . $project->name,
            'Project untuk ' . $user->name . ' dengan nilai ' . ($project->price ? 'Rp ' . number_format((float) $project->price, 0, ',', '.') : 'belum ditentukan') . '.',
            '/dashboard/projects/' . $project->id,
            'project.created'
        );

        app(AuditLogger::class)->log('project.created', 'Project dibuat: "' . $project->name . '" untuk ' . $user->name, $project);

        return response()->json([
            'project' => $project->load('user.profile'),
            'credentials' => [
                'login_url' => url('/login'),
                'email' => $user->email,
                'password' => null,
                'access_url' => url('/dashboard/preview/' . $project->order_no),
            ],
        ], 201);
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'package_id' => 'nullable|exists:packages,id',
            'event_date' => 'nullable|date',
            'event_start' => 'nullable|date',
            'event_end' => 'nullable|date|after:event_start',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'dp_amount' => 'nullable|numeric|min:0',
            'photo_total' => 'nullable|integer|min:0',
            'photo_done' => 'nullable|integer|min:0',
            'video_total' => 'nullable|integer|min:0',
            'video_done' => 'nullable|integer|min:0',
            'status' => 'nullable|in:' . implode(',', \App\Models\Project::STATUSES),
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['location'] = ContentSanitizer::plainText($data['location'] ?? '');

        // Jadwal acara: input wall-clock lokal (timezone bisnis) → simpan UTC.
        $businessTime = app(\App\Support\BusinessTime::class);
        if (array_key_exists('event_start', $data) || array_key_exists('event_end', $data)) {
            $data['event_start'] = $businessTime->parseToUtc($data['event_start'] ?? null);
            $data['event_end'] = $businessTime->parseToUtc($data['event_end'] ?? null);
            $data['event_date'] = $data['event_date'] ?? ($data['event_start'] ? $data['event_start']->toDateString() : null);
        }

        if (array_key_exists('package_id', $data)) {
            $project->package_id = $data['package_id'] ?: null;
            if ($project->package_id) {
                $package = \App\Models\Package::with('services')->find($project->package_id);
                if ($package) {
                    $project->pricing_snapshot = [
                        'package' => $package->name,
                        'package_id' => $package->id,
                        'items' => $package->services->map(fn ($s) => [
                            'service' => $s->name,
                            'media' => $s->media,
                            'price' => (float) $s->price,
                            'qty' => (int) $s->pivot->qty,
                            'line_total' => (float) $s->price * (int) $s->pivot->qty,
                        ])->values(),
                        'discount' => ['type' => $package->promo_type, 'value' => $package->promo_value ?? 0],
                        'total' => $package->computedPrice(),
                    ];
                    $data['price'] = $data['price'] ?? $package->computedPrice();
                }
            } else {
                $project->pricing_snapshot = null;
            }
        }

        $newStatus = $data['status'] ?? $project->status;
        $statusChanged = $newStatus !== $project->status;

        $project->update($data);

        // DP terupdate: sinkronkan ke invoice.
        if (array_key_exists('dp_amount', $data) && $project->invoice) {
            $project->invoice->update(['dp_amount' => (float) $data['dp_amount']]);
            $project->invoice->refreshStatus();
        }

        // Saat melaju ke "Preview Tersedia", pastikan invoice tersedia.
        if ($newStatus === 'awaiting_payment' && !$project->invoice) {
            $this->createInvoice($project);
            app(NotificationService::class)->notifyGalleryReady($project);
        }

        app(AuditLogger::class)->log('project.updated', 'Project diperbarui: "' . $project->name . '"', $project);

        // Satu pesan timeline saja saat status berganti (hindari duplikat dgn advance).
        if ($statusChanged) {
            $project->addSystemUpdate(\App\Models\Project::transitionMessage($newStatus));
            app(NotificationService::class)->notifyProjectStatusChanged($project, $newStatus);
        }

        $notifications = app(NotificationService::class);

        $this->syncInvoiceAmount($project);

        return response()->json($project->load('user.profile'));
    }

    public function updateStatus(Request $request, Project $project)
    {
        $request->validate(['status' => 'required|in:' . implode(',', \App\Models\Project::STATUSES)]);
        $old = $project->status;
        $project->update(['status' => $request->status]);

        app(AuditLogger::class)->log('project.status_changed', 'Status project "' . $project->name . '" menjadi ' . $request->status, $project);

        if ($request->status !== $old) {
            $project->addSystemUpdate(\App\Models\Project::transitionMessage($request->status));
        }

        app(NotificationService::class)->webhook('project.status_changed', [
            'status' => $request->status,
        ]);

        return response()->json($project);
    }

    /** Majukan alur satu langkah (stepper). Forward-only, tak bisa mundur. */
    public function advance(Request $request, Project $project)
    {
        $next = $project->nextStep();
        $target = $request->input('status', $next);

        if ($target !== $next) {
            abort(422, 'Proyek hanya dapat melaju ke tahap: ' . ($next ? \App\Models\Project::STATUS_LABELS[$next] : '-') . '.');
        }

        if ($target === 'completed' && !$project->isPaid()) {
            abort(422, 'Proyek belum lunas. Selesaikan pembayaran untuk menutup alur.');
        }

        $project->advanceStep($target);

        if ($target === 'awaiting_payment' && !$project->invoice) {
            $this->createInvoice($project);
        }

        app(AuditLogger::class)->log('project.advanced', 'Alur project "' . $project->name . '" melaju ke ' . $target, $project);

        $notifications = app(NotificationService::class);

        if ($project->user) {
            $notifications->inApp(
                $project->user,
                'Alur pesanan diperbarui',
                "Pesanan \"{$project->name}\" kini di tahap: " . $project->statusLabel() . '.',
                $notifications->orderUrl($project),
                'project.advanced'
            );
        }

        return response()->json($project->load('user.profile', 'invoice'));
    }

    public function addUpdate(Request $request, Project $project)
    {
        $request->validate(['message' => 'required|string']);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => $request->message,
            'type' => 'note',
            'kind' => 'manual',
        ]);

        return response()->json($project->updates()->get());
    }

    public function setGalleryStatus(Request $request, Project $project)
    {
        $request->validate(['gallery_status' => 'required|in:preparing,preview_ready,released']);

        $project->files()->update(['gallery_status' => $request->gallery_status]);

        if ($request->gallery_status === 'preview_ready' && $project->status === 'editing') {
            $project->update(['status' => 'awaiting_payment']);
            $project->addSystemUpdate('Preview tersedia — menunggu pembayaran.');
            app(AuditLogger::class)->log('project.preview_ready', 'Preview tersedia utk project "' . $project->name . '"', $project);
        } elseif ($request->gallery_status === 'released') {
            $project->addSystemUpdate('Galeri dirilis penuh untuk klien.');
            app(AuditLogger::class)->log('project.gallery_released', 'Galeri project "' . $project->name . '" dirilis', $project);
        }

        return response()->json($project->files()->latest()->get());
    }

    public function archive(Request $request, Project $project)
    {
        // Percepat seluruh alur: pastikan ZIP siap (verify-before-kill) baru arsipkan.
        app(\App\Services\DeliveryService::class)->ensureReady($project);

        $project->archived_at = now();
        $project->status = 'archived';
        $project->save();
        $project->addSystemUpdate('Pesanan diarsipkan.');
        app(AuditLogger::class)->log('project.archived', 'Galeri diarsipkan: "' . $project->name . '"', $project);

        return response()->json($project);
    }

    public function restore(Request $request, Project $project)
    {
        $project->archived_at = null;
        $project->status = 'completed';
        $project->save();
        $project->addSystemUpdate('Pesanan dipulihkan dari arsip.');
        app(AuditLogger::class)->log('project.restored', 'Galeri dikembalikan: "' . $project->name . '"', $project);

        return response()->json($project);
    }

    /** Klien mengajukan permintaan unduh ulang (proyek arsip). */
    private function createInvoice(Project $project): \App\Models\Invoice
    {
        $existing = $project->invoice;

        $invoice = $project->invoice()->firstOrCreate([
            'number' => \App\Models\Invoice::nextNumber(),
            'issued_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'base_amount' => $project->price,
        ]);

        $project->addSystemUpdate('Invoice ' . $invoice->number . ' dibuat sebesar Rp ' . number_format((float) ($project->price ?? 0), 0, ',', '.') . '.');

        // Notifikasi "Invoice Baru" hanya untuk invoice yang benar-benar baru diterbitkan.
        if (!$existing) {
            app(NotificationService::class)->notifyInvoiceCreated($invoice);
        }

        return $invoice;
    }

    /** Sinkronkan nominal & status invoice mengikuti harga/tagihan proyek. */
    private function syncInvoiceAmount(Project $project): void
    {
        $invoice = $project->invoice;
        if (!$invoice) {
            return;
        }
        $invoice->base_amount = $project->price ?? 0;
        $invoice->refreshStatus();
    }

}
