<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
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

        if ($user->isAdmin()) {
            $query = Project::with('client', 'payments', 'files');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            return response()->json($query->latest()->paginate(15));
        }

        $projects = $user->client?->projects()->with('files', 'payments', 'updates')->latest()->get() ?? [];

        return response()->json($projects);
    }

    public function show(Request $request, Project $project)
    {
        if ($request->user()->isClient() && $project->client?->user_id !== $request->user()->id) {
            abort(403);
        }

        $project->load(['client', 'files', 'payments', 'updates.user', 'accessTokens']);

        return response()->json($project);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'client_name' => 'required_without:client_id|string|max:255',
            'client_phone' => 'required_without:client_id|string|max:20',
            'client_email' => 'nullable|email|max:255',
            'client_notes' => 'nullable|string|max:1000',
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'event_date' => 'nullable|date',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['client_notes'] = ContentSanitizer::plainText($data['client_notes'] ?? '');

        if (!empty($data['client_id'])) {
            $client = Client::findOrFail($data['client_id']);
        } else {
            $client = $this->findOrCreateClient($data);
        }

        $password = Str::random(10);
        $this->ensureClientUser($client, $password);

        $project = Project::create([
            'client_id' => $client->id,
            'user_id' => $client->user_id,
            'name' => $data['name'],
            'type' => $data['type'] ?? null,
            'event_date' => $data['event_date'] ?? null,
            'description' => $data['description'] ?? null,
            'price' => $data['price'] ?? null,
            'status' => $data['status'],
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
        ]);

        $accessToken = ClientAccessToken::create([
            'project_id' => $project->id,
            'client_id' => $client->id,
            'user_id' => $client->user_id,
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
            'Project untuk ' . $client->name . ' dengan nilai ' . ($project->price ? 'Rp ' . number_format((float) $project->price, 0, ',', '.') : 'belum ditentukan') . '.',
            '/dashboard/projects/' . $project->id,
            'project.created'
        );

        app(AuditLogger::class)->log('project.created', 'Project dibuat: "' . $project->name . '" untuk ' . $client->name, $project);

        return response()->json([
            'project' => $project->load('client', 'accessTokens'),
            'credentials' => [
                'login_url' => url('/login'),
                'email' => $client->user?->email,
                'password' => $password,
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

        $client = $project->client;

        $password = Str::random(10);
        $this->ensureClientUser($client, $password);

        if ($request->boolean('reset_password') && $client->user) {
            $client->user->update(['password' => Hash::make($password)]);
        }

        $accessToken = ClientAccessToken::create([
            'project_id' => $project->id,
            'client_id' => $client->id,
            'user_id' => $client->user_id,
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
                'email' => $client->user?->email,
                'password' => $password,
                'access_url' => $accessToken->url,
            ],
        ]);
    }

    private function findOrCreateClient(array $data): Client
    {
        $client = null;

        if (!empty($data['client_email'])) {
            $client = Client::where('email', $data['client_email'])->first();
        }

        if (!$client && !empty($data['client_phone'])) {
            $client = Client::where('phone', $data['client_phone'])->first();
        }

        if ($client) {
            $client->update(array_filter([
                'name' => $data['client_name'] ?? $client->name,
                'email' => $data['client_email'] ?? $client->email,
                'phone' => $data['client_phone'] ?? $client->phone,
                'notes' => $data['client_notes'] ?? $client->notes,
            ]));

            return $client;
        }

        return Client::create([
            'name' => $data['client_name'],
            'email' => $data['client_email'] ?? null,
            'phone' => $data['client_phone'],
            'notes' => $data['client_notes'] ?? null,
        ]);
    }

    private function ensureClientUser(Client $client, string $password): void
    {
        if ($client->user_id) {
            User::where('id', $client->user_id)->update(['password' => Hash::make($password)]);
            return;
        }

        $user = User::create([
            'name' => $client->name,
            'email' => $client->email ?? ('client_' . Str::random(8) . '@imagery.local'),
            'password' => Hash::make($password),
            'role' => 'client',
        ]);
        $user->assignRole('client');

        $client->update(['user_id' => $user->id]);
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'event_date' => 'nullable|date',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');

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

        if ($project->client) {
            if ($project->client->phone) {
                $notifications->whatsapp(
                    $project->client->phone,
                    "Halo {$project->client->name}, status project *{$project->name}* Anda: *" . strtoupper(str_replace('_', ' ', $data['status'])) . '*',
                    null,
                    $project->client->user,
                    'project.updated'
                );
            }
            if ($project->client->user) {
                $notifications->inApp(
                    $project->client->user,
                    'Status project diperbarui',
                    "Project \"{$project->name}\" kini berstatus: " . strtoupper(str_replace('_', ' ', $data['status'])) . '.',
                    '/dashboard/projects/' . $project->id,
                    'project.updated'
                );
            }
        }

        return response()->json($project->load('client'));
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

        ProjectFile::create([
            'project_id' => $project->id,
            'filename' => $file->hashName(),
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'type' => $file->getMimeType(),
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

    public function downloadFile(ProjectFile $file)
    {
        $user = Auth::user();
        if ($user->isClient() && $file->project->client?->user_id !== $user->id) {
            abort(403);
        }

        app(AuditLogger::class)->log('project.file_downloaded', 'File diunduh: "' . $file->original_name . '" (project ' . $file->project->name . ')', $file);

        return Storage::disk('public')->download($file->path, $file->original_name);
    }
}
