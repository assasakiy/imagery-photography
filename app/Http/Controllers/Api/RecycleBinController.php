<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

/**
 * Recycle Bin global: daftar data soft-deleted + aksi pulihkan / hapus permanen.
 * Berurutan implementasi: Client dulu, lalu Booking/Project/Gallery/Blog/Invoice.
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

        $client = Client::withTrashed()->findOrFail($id);
        $client->restore();
        $client->user?->restore();

        app(\App\Services\AuditLogger::class)->log('recycle.restored', 'Dipulihkan dari recycle bin: ' . $client->name, $client);

        return response()->json(['ok' => true]);
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        if ($type !== 'client') {
            abort(422, 'Tipe recycle bin tidak didukung.');
        }

        $client = Client::withTrashed()->findOrFail($id);
        $client->user?->forceDelete();
        $client->forceDelete();

        app(\App\Services\AuditLogger::class)->log('recycle.force_deleted', 'Dihapus permanen dari recycle bin: ' . $client->name, $client);

        return response()->json(['ok' => true]);
    }

    private function clientItems(): array
    {
        $clients = Client::with(['user:id,name,email,status', 'deletedBy:id,name'])
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();

        return [
            'data' => $clients->map(fn ($c) => [
                'id' => $c->id,
                'type' => 'client',
                'name' => $c->name,
                'email' => $c->email,
                'deleted_by_name' => $c->deleted_by_name ?? $c->deletedBy?->name ?? '-',
                'deleted_at' => $c->deleted_at,
                'delete_reason' => $c->delete_reason,
            ]),
        ];
    }
}