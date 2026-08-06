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

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isStaff()) {
            $query = Project::with('user.profile', 'payments', 'files');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            return response()->json($query->latest()->paginate(15));
        }

        $projects = $user->projects()->with('files', 'payments', 'updates')->latest()->get() ?? [];

        return response()->json($projects);
    }

    public function show(Request $request, Project $project)
    {
        if ($request->user()->isClient() && $project->user_id !== $request->user()->id) {
            abort(403);
        }

        $project->load(['user.profile', 'files', 'payments', 'updates.user', 'accessTokens']);

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
            'type' => 'nullable|string|max:100',
            'package_id' => 'nullable|exists:packages,id',
            'event_date' => 'nullable|date',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['client_notes'] = ContentSanitizer::plainText($data['client_notes'] ?? '');

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
                        'price' => (float) $s->price,
                        'qty' => (int) $s->pivot->qty,
                        'line_total' => (float) $s->price * (int) $s->pivot->qty,
                    ])->values(),
                    'discount' => ['type' => $package->promo_type, 'value' => $package->promo_value ?? 0],
                    'total' => $package->computedPrice(),
                ];
            }
        }

        $project = Project::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'type' => $data['type'] ?? null,
            'package_id' => $package?->id ?? null,
            'event_date' => $data['event_date'] ?? null,
            'description' => $data['description'] ?? null,
            'price' => $data['price'] ?? ($package ? $package->computedPrice() : null),
            'pricing_snapshot' => $snapshot,
            'status' => $data['status'],
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
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
        ]);

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
            'type' => 'nullable|string|max:100',
            'package_id' => 'nullable|exists:packages,id',
            'event_date' => 'nullable|date',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');

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

        $project->update($data);

        app(AuditLogger::class)->log('project.updated', 'Project diperbarui: "' . $project->name . '"', $project);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Project "' . $project->name . '" diupdate ke status: ' . $data['status'],
            'type' => 'update',
        ]);

        $notifications = app(NotificationService::class);
        $notifications->webhook('project.updated', ['project_id' => $project->id, 'status' => $data['status']]);

        if ($project->user) {
            if ($project->user->phone) {
                $notifications->whatsapp(
                    $project->user->phone,
                    "Halo {$project->user->name}, status project *{$project->name}* Anda: *" . strtoupper(str_replace('_', ' ', $data['status'])) . '*',
                    null,
                    $project->user,
                    'project.updated'
                );
            }
            $notifications->inApp(
                $project->user,
                'Status project diperbarui',
                "Project \"{$project->name}\" kini berstatus: " . strtoupper(str_replace('_', ' ', $data['status'])) . '.',
                '/dashboard/projects/' . $project->id,
                'project.updated'
            );
        }

        return response()->json($project->load('user.profile'));
    }

    public function updateStatus(Request $request, Project $project)
    {
        $request->validate(['status' => 'required|in:pending,in_progress,completed,delivered']);
        $project->update(['status' => $request->status]);

        app(AuditLogger::class)->log('project.status_changed', 'Status project "' . $project->name . '" menjadi ' . $request->status, $project);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Status berubah menjadi: ' . $request->status,
            'type' => 'milestone',
        ]);

        app(NotificationService::class)->webhook('project.status_changed', [
            'project_id' => $project->id,
            'status' => $request->status,
        ]);

        return response()->json($project);
    }

    public function uploadFile(Request $request, Project $project)
    {
        $request->validate(['file' => 'required|file|max:512000']);

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
            'expires_at' => $expiresAt,
        ]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'File "' . $file->getClientOriginalName() . '" telah diupload.',
            'type' => 'update',
        ]);

        return response()->json($project->files()->latest()->get(), 201);
    }

    public function deleteFile(ProjectFile $file)
    {
        Storage::disk('public')->delete($file->path);
        $file->delete();

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

        app(AuditLogger::class)->log('project.file_downloaded', 'File diunduh: "' . $file->original_name . '" (project ' . $file->project->name . ')', $file);
        app(\App\Services\HistoryService::class)->downloaded($user, ProjectFile::class, $file->id, ['name' => $file->original_name]);

        return Storage::disk('public')->download($file->path, $file->original_name);
    }

    public function archive(Request $request, Project $project)
    {
        $project->update(['archived_at' => now()]);
        app(AuditLogger::class)->log('project.archived', 'Galeri diarsipkan: "' . $project->name . '"', $project);

        return response()->json($project);
    }

    public function restore(Request $request, Project $project)
    {
        $project->update(['archived_at' => null]);
        app(AuditLogger::class)->log('project.restored', 'Galeri dikembalikan: "' . $project->name . '"', $project);

        return response()->json($project);
    }
}
