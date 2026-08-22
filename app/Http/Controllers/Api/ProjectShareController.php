<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Redelivery;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\NotificationService;

class ProjectShareController extends Controller
{
    public function regenerateCredentials(Request $request, Project $project)
    {
        $newCode = strtoupper(Str::random(8));
        $project->update(['access_code' => $newCode]);

        $project->accessTokens()->delete();
        $token = $project->accessTokens()->create([
            'token' => Str::random(32),
            'purpose' => 'project',
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'message' => 'Kredensial dan link akses baru berhasil dibuat.',
            'access_code' => $newCode,
            'url' => $token->url,
        ]);
    }

    public function sendAccessLink(Request $request, Project $project)
    {
        $request->validate([
            'enabled' => 'required|boolean',
            'expires_in_days' => 'nullable|integer|min:1|max:365'
        ]);

        if (!$request->enabled) {
            $project->accessTokens()->delete();
            return response()->json(['message' => 'Link akses dinonaktifkan.']);
        }

        $project->accessTokens()->delete();
        $days = $request->expires_in_days ?? 7;
        
        $token = $project->accessTokens()->create([
            'token' => Str::random(32),
            'purpose' => 'project',
            'expires_at' => now()->addDays($days),
        ]);

        $project->updates()->create([
            'kind' => 'system',
            'message' => "Link akses dikirim ke klien (berlaku {$days} hari)."
        ]);

        if ($project->user) {
            app(NotificationService::class)->sendProjectStatus($project, $project->user);
        }

        return response()->json([
            'message' => 'Link dikirim.',
            'url' => $token->url,
            'expires_at' => $token->expires_at
        ]);
    }

    public function storeRedeliveryRequest(Request $request, Project $project)
    {
        $request->validate(['note' => 'nullable|string|max:1000']);
        
        $user = auth()->user();
        if ($project->user_id !== $user->id && $user->role !== 'admin' && $user->role !== 'owner') {
            abort(403);
        }
        
        if ($project->status !== 'archived') {
            abort(400, 'Hanya pesanan yang diarsipkan yang dapat diminta unduh ulang.');
        }

        $redelivery = $project->redeliveryRequests()->create([
            'user_id' => $user->id,
            'note' => $request->note,
            'status' => 'pending'
        ]);

        $project->updates()->create([
            'kind' => 'system',
            'message' => "Klien mengajukan permintaan unduh ulang."
        ]);

        app(NotificationService::class)->toAdmins("Permintaan Unduh Ulang ({$project->name})", "Klien meminta akses kembali ke file proyek yang sudah diarsipkan.");

        return response()->json($redelivery, 201);
    }

    public function reviewRedelivery(Request $request, Redelivery $redelivery)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'fee' => 'nullable|numeric|min:0'
        ]);

        $redelivery->update([
            'status' => $request->status,
            'fee_amount' => $request->status === 'approved' ? ($request->fee ?: 0) : 0,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now()
        ]);

        $project = $redelivery->project;
        $statusStr = $request->status === 'approved' ? 'disetujui' : 'ditolak';
        
        $project->updates()->create([
            'kind' => 'system',
            'message' => "Permintaan unduh ulang {$statusStr}."
        ]);

        if ($request->status === 'approved') {
            $project->accessTokens()->delete();
            $token = $project->accessTokens()->create([
                'token' => Str::random(32),
                'purpose' => 'project',
                'expires_at' => now()->addDays(3),
            ]);
            
            if ($project->user) {
                app(NotificationService::class)->sendProjectStatus($project, $project->user);
            }
            
            return response()->json([
                'message' => 'Permintaan disetujui, link baru dikirim.',
                'url' => $token->url
            ]);
        }

        return response()->json(['message' => 'Permintaan ditolak.']);
    }
}
