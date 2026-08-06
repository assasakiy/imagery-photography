<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Recycle Bin global: daftar data soft-deleted + aksi pulihkan / hapus permanen.
 * Berurutan implementasi: Client (User role client) dulu, lalu Booking/Project/Gallery/Blog/Invoice.
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
        $user->restore();

        app(\App\Services\AuditLogger::class)->log('recycle.restored', 'Dipulihkan dari recycle bin: ' . $user->name, $user);

        return response()->json(['ok' => true]);
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        if ($type !== 'client') {
            abort(422, 'Tipe recycle bin tidak didukung.');
        }

        $user = User::role('client')->withTrashed()->findOrFail($id);
        $user->forceDelete();

        app(\App\Services\AuditLogger::class)->log('recycle.force_deleted', 'Dihapus permanen dari recycle bin: ' . $user->name, $user);

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
            'data' => $users->map(fn ($u) => [
                'id' => $u->id,
                'type' => 'client',
                'name' => $u->name,
                'email' => $u->email,
                'deleted_by_name' => $u->deleted_by_name ?? $u->deletedBy?->name ?? '-',
                'deleted_at' => $u->deleted_at,
                'delete_reason' => $u->delete_reason,
            ]),
        ];
    }
}