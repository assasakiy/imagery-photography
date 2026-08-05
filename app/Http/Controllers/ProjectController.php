<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Client;
use App\Models\ClientAccessToken;
use App\Models\ProjectFile;
use App\Models\ProjectUpdate;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            $projects = Project::with('client', 'payments')->latest()->paginate(20);
            $clients = Client::latest()->get();
            return view('admin.projects', compact('projects', 'clients'));
        }

        $projects = $user->client?->projects()->with('files', 'payments', 'updates')->latest()->get();
        return view('client.projects', compact('projects'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $project = Project::create($data);

        // Create access token
        $client = Client::findOrFail($data['client_id']);
        $token = ClientAccessToken::generateToken();

        ClientAccessToken::create([
            'project_id' => $project->id,
            'client_id' => $client->id,
            'user_id' => $client->user_id,
            'token' => $token,
            'expires_at' => now()->addYear(),
        ]);

        // Ensure client user exists
        if (!$client->user_id) {
            $user = User::create([
                'name' => $client->name,
                'email' => $client->email ?? ('client_' . Str::random(8) . '@imagery.local'),
                'password' => Hash::make(Str::random(16)),
                'role' => 'client',
            ]);
            $client->update(['user_id' => $user->id]);
            ClientAccessToken::where('project_id', $project->id)
                ->where('client_id', $client->id)
                ->update(['user_id' => $user->id]);
        }

        // Create initial update
        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Project "' . $project->name . '" telah dibuat.',
            'type' => 'milestone',
        ]);

        return redirect()->back()->with('success', 'Project berhasil dibuat. Link akses: ' . $token);
    }

    public function show(Project $project)
    {
        $user = Auth::user();

        if ($user->isClient() && $project->client->user_id !== $user->id) {
            abort(403);
        }

        $project->load(['client', 'files', 'payments', 'updates.user', 'accessTokens']);

        if ($user->isAdmin()) {
            return view('admin.project-detail', compact('project'));
        }

        return view('client.project-detail', compact('project'));
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,delivered',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $project->update($data);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Project "' . $project->name . '" diupdate ke status: ' . $data['status'],
            'type' => 'update',
        ]);

        return redirect()->back()->with('success', 'Project berhasil diperbarui.');
    }

    public function updateStatus(Request $request, Project $project)
    {
        $request->validate(['status' => 'required|in:pending,in_progress,completed,delivered']);
        $project->update(['status' => $request->status]);

        ProjectUpdate::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'message' => 'Status berubah menjadi: ' . $request->status,
            'type' => 'milestone',
        ]);

        return redirect()->back()->with('success', 'Status project diperbarui.');
    }

    public function uploadFile(Request $request, Project $project)
    {
        $request->validate([
            'file' => 'required|file|max:512000',
        ]);

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

        return redirect()->back()->with('success', 'File berhasil diupload.');
    }

    public function deleteFile(ProjectFile $file)
    {
        Storage::disk('public')->delete($file->path);
        $file->delete();
        return redirect()->back()->with('success', 'File berhasil dihapus.');
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

        return redirect()->back()->with('success', 'Update berhasil ditambahkan.');
    }

    public function downloadFile(ProjectFile $file)
    {
        $project = $file->project;
        $user = Auth::user();

        if ($user->isClient() && $project->client->user_id !== $user->id) {
            abort(403);
        }

        return Storage::disk('public')->download($file->path, $file->original_name);
    }
}
