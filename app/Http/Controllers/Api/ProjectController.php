<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectUpdate;
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

        $projects = $user->projects()->with('files.media', 'payments', 'updates')->latest()->get() ?? [];

        return response()->json($projects);
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

        $project->load(['user.profile', 'files.media', 'payments', 'updates.user', 'accessTokens', 'invoice', 'booking', 'reviews']);

        return response()->json($project);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'client_name' => 'required_without:user_id|string|max:255',
            'client_phone' => 'nullable|string|max:20',
            'client_email' => 'nullable|email|max:255',
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
            'event_date' => $data['event_date'] ?? ($data['event_start'] ? \Illuminate\Support\Carbon::parse($data['event_start'])->toDateString() : null),
            'event_start' => $data['event_start'] ?? null,
            'event_end' => $data['event_end'] ?? null,
            'description' => $data['description'] ?? null,
            'location' => $data['location'] ?? null,
            'price' => $data['price'] ?? ($package ? $package->computedPrice() : null),
            'pricing_snapshot' => $snapshot,
            'status' => $data['status'] ?? 'scheduled',
        ]);

        $accessToken = ClientAccessToken::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'token' => ClientAccessToken::generateToken(),
            'expires_at' => now()->addYear(),
        ]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Project "' . $project->name . '" telah dibuat.',
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
        $notifications->webhook('project.created', ['project_id' => $project->id, 'name' => $project->name]);
        $notifications->toAdmins(
            'Project baru: ' . $project->name,
            'Project untuk ' . $user->name . ' dengan nilai ' . ($project->price ? 'Rp ' . number_format((float) $project->price, 0, ',', '.') : 'belum ditentukan') . '.',
            '/dashboard/projects/' . $project->id,
            'project.created'
        );

        app(AuditLogger::class)->log('project.created', 'Project dibuat: "' . $project->name . '" untuk ' . $user->name, $project);

        return response()->json([
            'project' => $project->load('user.profile', 'accessTokens'),
            'credentials' => [
                'login_url' => url('/login'),
                'email' => $user->email,
                'password' => null,
                'access_url' => $accessToken->url,
            ],
        ], 201);
    }

    public function regenerateCredentials(Request $request, Project $project)
    {
        $request->validate(['reset_password' => 'boolean']);

        ClientAccessToken::where('project_id', $project->id)
            ->valid()
            ->update(['expires_at' => now()]);

        $user = $project->user;

        $password = Str::random(10);
        if ($request->boolean('reset_password') && $user) {
            $user->update(['password' => Hash::make($password)]);
        }

        $accessToken = ClientAccessToken::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'token' => ClientAccessToken::generateToken(),
            'expires_at' => now()->addYear(),
        ]);

        app(NotificationService::class)->webhook('project.credentials_regenerated', [
            'project_id' => $project->id,
            'name' => $project->name,
        ]);

        app(AuditLogger::class)->log('project.credentials_regenerated', 'Kredensial project "' . $project->name . '" direset', $project);

        return response()->json([
            'token' => $accessToken,
            'credentials' => [
                'login_url' => url('/login'),
                'email' => $user?->email,
                'password' => $password,
                'access_url' => $accessToken->url,
            ],
        ]);
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
        $this->ensureStatusTimeline($project, $newStatus);

        $project->update($data);

        // DP terupdate: sinkronkan ke invoice.
        if (array_key_exists('dp_amount', $data) && $project->invoice) {
            $project->invoice->update(['dp_amount' => (float) $data['dp_amount']]);
            $project->invoice->refreshStatus();
        }

        // Saat melaju ke "Preview Tersedia", pastikan invoice tersedia.
        if ($newStatus === 'awaiting_payment' && !$project->invoice) {
            $this->createInvoice($project);
        }

        app(AuditLogger::class)->log('project.updated', 'Project diperbarui: "' . $project->name . '"', $project);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Project "' . $project->name . '" diupdate ke status: ' . $newStatus,
            'type' => 'update',
        ]);

        $notifications = app(NotificationService::class);
        $notifications->webhook('project.updated', ['project_id' => $project->id, 'status' => $newStatus]);

        if ($project->user) {
            if ($project->user->phone) {
                $notifications->whatsapp(
                    $project->user->phone,
                    "Halo {$project->user->name}, status project *{$project->name}* Anda: *" . strtoupper(str_replace('_', ' ', $newStatus)) . '*',
                    null,
                    $project->user,
                    'project.updated'
                );
            }
            $notifications->inApp(
                $project->user,
                'Status project diperbarui',
                "Project \"{$project->name}\" kini berstatus: " . strtoupper(str_replace('_', ' ', $newStatus)) . '.',
                '/dashboard/projects/' . $project->id,
                'project.updated'
            );
        }

        $this->syncInvoiceAmount($project);

        return response()->json($project->load('user.profile'));
    }

    public function updateStatus(Request $request, Project $project)
    {
        $request->validate(['status' => 'required|in:' . implode(',', \App\Models\Project::STATUSES)]);
        $old = $project->status;
        $project->update(['status' => $request->status]);

        app(AuditLogger::class)->log('project.status_changed', 'Status project "' . $project->name . '" menjadi ' . $request->status, $project);

        $this->ensureStatusTimeline($project, $request->status, $old);

        app(NotificationService::class)->webhook('project.status_changed', [
            'project_id' => $project->id,
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
        $notifications->webhook('project.advanced', ['project_id' => $project->id, 'status' => $target]);

        if ($project->user) {
            $notifications->inApp(
                $project->user,
                'Alur pesanan diperbarui',
                "Pesanan \"{$project->name}\" kini di tahap: " . $project->statusLabel() . '.',
                '/dashboard/projects/' . $project->id,
                'project.advanced'
            );
        }

        return response()->json($project->load('user.profile', 'invoice'));
    }

    public function uploadFile(Request $request, Project $project)
    {
        // Mode baru: multi-foto hasil edit (Spatie, original privat + preview watermark).
        if ($request->hasFile('files')) {
            return $this->uploadFiles($request, $project);
        }

        // Legacy: bukti mulai/selesai sesi (satu foto, path-based).
        $request->validate([
            'file' => 'required|file|max:512000',
            'gallery_status' => 'nullable|in:preparing,preview_ready,released',
        ]);

        $file = $request->file('file');
        $path = $file->store('project-files/' . $project->id, 'public');

        $expiresAt = null;
        $retentionDays = $project->retentionDays();
        if ($retentionDays) {
            $expiresAt = now()->addDays($retentionDays);
        }

        ProjectFile::create([
            'project_id' => $project->id,
            'filename' => $file->hashName(),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'type' => $file->getMimeType(),
            'category' => $this->inferCategory($file),
            'gallery_status' => $request->gallery_status ?? 'preview_ready',
            'expires_at' => $expiresAt,
        ]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'File "' . $file->getClientOriginalName() . '" telah diupload.',
            'type' => 'update',
            'kind' => 'manual',
        ]);

        return response()->json($project->files()->with('media')->latest()->get(), 201);
    }

    /**
     * Upload multi-foto final. Tiap foto -> 1 media Spatie (original di disk privat 'local')
     * + conversion 'preview' ber-watermark di disk 'public' + rekaman ProjectFile bisnis.
     */
    private function uploadFiles(Request $request, Project $project)
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:jpeg,jpg,png,webp|max:512000',
        ]);

        $created = collect();

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $size = $file->getSize();
            $mime = $file->getMimeType();

            $media = $project
                ->addMedia($file)
                ->usingFileName($file->hashName())
                ->withCustomProperties([
                    'original_name' => $originalName,
                    'type' => 'photo',
                    'variant' => 'original',
                ])
                ->toMediaCollection('files', 'local');

            $media->uploaded_by = Auth::id();
            $media->is_public = false;
            $media->save();

            $created->push(ProjectFile::create([
                'project_id' => $project->id,
                'media_id' => $media->id,
                'asset_key' => (string) Str::uuid(),
                'variant' => 'original',
                'filename' => $media->file_name,
                'original_name' => $originalName,
                'path' => null,
                'size' => $size,
                'type' => $mime,
                'category' => 'photo',
                'gallery_status' => 'preview_ready',
                'preview_expires_at' => now()->addDays(30),
            ]));
        }

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => $created->count() . ' foto final telah diupload.',
            'type' => 'update',
            'kind' => 'manual',
        ]);

        return response()->json($project->files()->with('media')->latest()->get(), 201);
    }

    /**
     * Upload satu video = pasangan dua media Spatie dgn asset_key sama:
     * preview (sudah ber-watermark dari editor, disk 'public') + original (disk privat 'local').
     */
    public function uploadVideo(Request $request, Project $project)
    {
        $data = $request->validate([
            'preview' => 'required|file|mimes:mp4,webm,mov|max:1024000',
            'original' => 'required|file|mimes:mp4,webm,mov|max:2048000',
        ]);

        $assetKey = (string) Str::uuid();

        $previewFile = $request->file('preview');
        $originalFile = $request->file('original');

        $previewName = $previewFile->getClientOriginalName();
        $previewSize = $previewFile->getSize();
        $previewMime = $previewFile->getMimeType();
        $originalName = $originalFile->getClientOriginalName();
        $originalSize = $originalFile->getSize();
        $originalMime = $originalFile->getMimeType();

        $previewMedia = $project
            ->addMedia($previewFile)
            ->usingFileName(Str::random(40) . '.' . $previewFile->extension())
            ->withCustomProperties(['type' => 'video', 'variant' => 'preview', 'asset_key' => $assetKey])
            ->toMediaCollection('files', 'public');
        $previewMedia->uploaded_by = Auth::id();
        $previewMedia->is_public = true;
        $previewMedia->save();

        $originalMedia = $project
            ->addMedia($originalFile)
            ->usingFileName(Str::random(40) . '.' . $originalFile->extension())
            ->withCustomProperties(['type' => 'video', 'variant' => 'original', 'asset_key' => $assetKey])
            ->toMediaCollection('files', 'local');
        $originalMedia->uploaded_by = Auth::id();
        $originalMedia->is_public = false;
        $originalMedia->save();

        ProjectFile::create([
            'project_id' => $project->id,
            'media_id' => $previewMedia->id,
            'asset_key' => $assetKey,
            'variant' => 'preview',
            'filename' => $previewMedia->file_name,
            'original_name' => $previewName,
            'path' => null,
            'size' => $previewSize,
            'type' => $previewMime,
            'category' => 'video',
            'gallery_status' => 'preview_ready',
            'preview_expires_at' => now()->addDays(30),
        ]);

        ProjectFile::create([
            'project_id' => $project->id,
            'media_id' => $originalMedia->id,
            'asset_key' => $assetKey,
            'variant' => 'original',
            'filename' => $originalMedia->file_name,
            'original_name' => $originalName,
            'path' => null,
            'size' => $originalSize,
            'type' => $originalMime,
            'category' => 'video',
            'gallery_status' => 'preview_ready',
        ]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Video "' . $previewName . '" diupload (preview + original).',
            'type' => 'update',
            'kind' => 'manual',
        ]);

        return response()->json($project->files()->with('media')->latest()->get(), 201);
    }

    public function deleteFile(ProjectFile $file)
    {
        if ($file->category === 'video' && $file->asset_key) {
            $group = $file->project->files()->where('asset_key', $file->asset_key)->get();
            foreach ($group as $pf) {
                if ($pf->media) {
                    $pf->media->delete();
                }
                $pf->delete();
            }
        } else {
            if ($file->media) {
                $file->media->delete();
            } else {
                Storage::disk('public')->delete($file->path);
            }
            $file->delete();
        }

        app(AuditLogger::class)->log('project.file_deleted', 'File dihapus: "' . $file->original_name . '"', $file);

        return response()->json(['ok' => true]);
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

    public function downloadFile(Request $request, ProjectFile $file)
    {
        $user = Auth::user();
        if ($user->isClient() && $file->project->user_id !== $user->id) {
            abort(403);
        }

        if ($file->expires_at && $file->expires_at->isPast()) {
            abort(403, 'File sudah diarsipkan. Hubungi admin untuk bantuan.');
        }

        if ($user->isClient() && $file->project->archived_at) {
            abort(403, 'Galeri ini sudah diarsipkan.');
        }

        // Download HD selalu merujuk ke file original (video: pasangan via asset_key).
        $file = $file->originalFile();

        // Download penuh hanya utk staff ATAU klien yg sudah lunas (galeri released).
        if ($user->isClient()) {
            $paid = $file->project->isPaid();
            if (!$paid) {
                abort(403, 'Pelunasan belum selesai. Anda dapat melihat preview, bukan mengunduh file HD.');
            }
            if ($file->gallery_status === 'preparing') {
                abort(403, 'Galeri masih disiapkan.');
            }
        }

        app(AuditLogger::class)->log('project.file_downloaded', 'File diunduh: "' . $file->original_name . '" (project ' . $file->project->name . ')', $file);
        app(\App\Services\HistoryService::class)->downloaded($user, ProjectFile::class, $file->id, ['name' => $file->original_name]);

        if ($file->media) {
            return Storage::disk($file->media->disk)->download($file->media->getPathRelativeToRoot(), $file->original_name ?: $file->filename);
        }

        return Storage::disk('public')->download($file->path, $file->original_name);
    }

    /** Unduh semua file original (HD) sebagai ZIP. Klien wajib lunas; original privat di-stream server-side. */
    public function downloadZip(Request $request, Project $project)
    {
        $user = Auth::user();

        if ($user->isClient() && $project->user_id !== $user->id) {
            abort(403);
        }

        if ($user->isClient() && !$project->isPaid()) {
            abort(403, 'Pelunasan belum selesai. Anda dapat melihat preview, bukan mengunduh file HD.');
        }

        $files = $project->files()
            ->with('media')
            ->where('variant', 'original')
            ->get()
            ->filter(fn (ProjectFile $f) => $f->media && $f->media->getPath() && is_file($f->media->getPath()));

        app(AuditLogger::class)->log('project.zip_downloaded', 'ZIP diunduh: "' . $project->name . '" (' . $files->count() . ' file)', $project);

        $zip = new ZipStream(outputName: 'PSN-' . $project->order_no . '-files.zip');

        foreach ($files as $f) {
            $zip->addFileFromPath($f->original_name ?: $f->filename, $f->media->getPath());
        }

        $zip->finish();
    }

    /** Admin menandai status gallery & memicu timeline system. */
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
        $project->update(['archived_at' => now(), 'status' => 'archived']);
        $project->addSystemUpdate('Pesanan diarsipkan.');
        app(AuditLogger::class)->log('project.archived', 'Galeri diarsipkan: "' . $project->name . '"', $project);

        return response()->json($project);
    }

    public function restore(Request $request, Project $project)
    {
        $project->update(['archived_at' => null, 'status' => 'completed']);
        $project->addSystemUpdate('Pesanan dipulihkan dari arsip.');
        app(AuditLogger::class)->log('project.restored', 'Galeri dikembalikan: "' . $project->name . '"', $project);

        return response()->json($project);
    }

    /** Buat invoice utk proyek baru (saat project dibuat / booking diterima). */
    private function createInvoice(Project $project): \App\Models\Invoice
    {
        $invoice = $project->invoice()->firstOrCreate([
            'number' => \App\Models\Invoice::nextNumber(),
            'issued_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'base_amount' => $project->price,
        ]);

        $project->addSystemUpdate('Invoice ' . $invoice->number . ' dibuat sebesar Rp ' . number_format((float) ($project->price ?? 0), 0, ',', '.') . '.');

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

    /** Catatan timeline system saat status berubah (tanpa duplikat utk status sama). */
    private function ensureStatusTimeline(Project $project, string $status, ?string $old = null): void
    {
        if ($old === $status) {
            return;
        }
        $label = \App\Models\Project::STATUS_LABELS[$status] ?? $status;
        $project->addSystemUpdate('Status project menjadi: ' . $label . '.');
    }

    private function inferCategory($file): string
    {
        $mime = $file->getMimeType() ?? '';
        if (str_starts_with($mime, 'image')) {
            return 'photo';
        }
        if (str_starts_with($mime, 'video')) {
            return 'video';
        }

        return 'document';
    }
}
