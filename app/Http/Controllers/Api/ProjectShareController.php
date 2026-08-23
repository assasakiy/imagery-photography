<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Redelivery;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;

class ProjectShareController extends Controller
{
    public function storeRedeliveryRequest(Request $request, Project $project)
    {
        $request->validate(['note' => 'nullable|string|max:1000']);

        $user = auth()->user();
        if ($project->user_id !== $user->id && !$user->hasRole(['admin', 'owner'])) {
            abort(403);
        }

        if ($project->status !== 'archived') {
            abort(400, 'Hanya pesanan yang diarsipkan yang dapat diminta unduh ulang.');
        }

        $redelivery = $project->redeliveries()->create([
            'user_id' => $user->id,
            'note' => $request->note,
            'status' => 'pending'
        ]);

        $project->updates()->create([
            'kind' => 'system',
            'message' => "Klien mengajukan permintaan unduh ulang."
        ]);

        app(NotificationService::class)->toAdmins(
            "Permintaan Unduh Ulang ({$project->name})",
            "Klien meminta akses kembali ke file proyek yang sudah diarsipkan.",
            null,
            'redelivery.requested'
        );

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

        if ($project->user) {
            $url = url(app(NotificationService::class)->orderUrl($project));
            $name = $project->user->name;

            if ($request->status === 'approved') {
                $days = app(RuntimeSettings::class)->redeliveryAccessDays();
                $redelivery->update(['expires_at' => now()->addDays($days)]);

                $waMsg = "Halo {$name}, permintaan unduh ulang untuk *{$project->name}* {$statusStr}.\n\n" .
                         "Akses download dibuka selama {$days} hari. Silakan unduh file melalui dashboard:\n{$url}";

                $emailHtml = "Halo <strong>{$name}</strong>,<br><br>" .
                             "Permintaan unduh ulang untuk <strong>{$project->name}</strong> {$statusStr}.<br><br>" .
                             "Akses download dibuka selama <strong>{$days} hari</strong>.<br><br>" .
                             "<a href='{$url}' style='background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Unduh File</a>";
            } else {
                $waMsg = "Halo {$name}, permintaan unduh ulang untuk *{$project->name}* {$statusStr}.";

                $emailHtml = "Halo <strong>{$name}</strong>,<br><br>" .
                             "Permintaan unduh ulang untuk <strong>{$project->name}</strong> {$statusStr}.";
            }

            if (!empty($project->user->phone)) {
                app(NotificationService::class)->whatsapp($project->user->phone, $waMsg, null, $project->user, 'redelivery.reviewed');
            }

            app(NotificationService::class)->email(
                new \App\Mail\AlertMail($name, 'Status Unduh Ulang', $emailHtml),
                $project->user->email,
                'redelivery.reviewed'
            );

            app(NotificationService::class)->inApp(
                $project->user,
                'Status Unduh Ulang',
                "Permintaan unduh ulang {$project->name} {$statusStr}.",
                $url,
                'redelivery.reviewed'
            );
        }

        return response()->json(['message' => 'Permintaan ' . $statusStr . '.']);
    }
}
