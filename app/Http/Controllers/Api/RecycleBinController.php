<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Payment;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ClientCascadeService;
use Illuminate\Http\Request;

/**
 * Recycle Bin global: daftar data soft-deleted + aksi pulihkan / hapus permanen.
 * Saat klien di-trash, semua data terkait (proyek, booking, dsb.) ikut tidak tampil;
 * pemulihan & penghapusan permanen hanya lewat entri klien (cascade).
 */
class RecycleBinController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type', 'client');

        return match ($type) {
            default => $this->clientItems(),
        };
    }

    public function restore(Request $request, string $type, int $id)
    {
        if ($type !== 'client') {
            abort(422, 'Tipe recycle bin belum didukung.');
        }

        $user = User::role('client')->withTrashed()->findOrFail($id);
        $name = $user->name;
        app(ClientCascadeService::class)->restoreClient($user);

        app(AuditLogger::class)->log('recycle.restored', 'Dipulihkan dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        if ($type !== 'client') {
            abort(422, 'Tipe recycle bin tidak didukung.');
        }

        $user = User::role('client')->withTrashed()->findOrFail($id);
        $name = $user->name;
        app(ClientCascadeService::class)->purgeClient($user);

        app(AuditLogger::class)->log('recycle.force_deleted', 'Dihapus permanen dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    private function clientItems(): array
    {
        $users = User::role('client')
            ->with(['profile', 'deletedBy:id,username', 'deletedBy.profile'])
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();

        return [
            'data' => $users->map(function ($u) {
                $projectIds = $u->projects()->withTrashed()->pluck('id');

                return [
                    'id' => $u->id,
                    'type' => 'client',
                    'name' => $u->name,
                    'email' => $u->email,
                    'deleted_by_name' => $u->deleted_by_name ?? $u->deletedBy?->name ?? '-',
                    'deleted_at' => $u->deleted_at,
                    'delete_reason' => $u->delete_reason,
                    'projects_count' => $projectIds->count(),
                    'bookings_count' => $u->bookings()->count(),
                    'payments_count' => Payment::whereIn('project_id', $projectIds)->count(),
                    'messages_count' => ContactMessage::whereIn('project_id', $projectIds)->count(),
                ];
            }),
        ];
    }
}