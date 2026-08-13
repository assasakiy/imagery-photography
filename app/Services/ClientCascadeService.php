<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\LoginHistory;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Operasi berantai saat klien dihapus / dipulihkan.
 * - trash   : soft-delete klien + semua proyek terkait + cabut akses (token login & link akses).
 * - restore : pulihkan klien + semua proyek terkaitnya (hanya lewat klien).
 * - purge   : hapus permanen klien + proyek + file storage + data terkait.
 */
class ClientCascadeService
{
    public function trashClient(User $user, ?string $reason = null, ?User $actor = null): bool
    {
        // Cabut akses supaya klien yang di-trash tidak bisa login/akses lewat link.
        $user->tokens()->delete();
        $user->accessTokens()->valid()->update(['expires_at' => now()]);

        // Semua proyek ikut di-soft-delete agar tidak tampil di tampilan admin/klien.
        $user->projects()->get()->each(fn (Project $p) => $p->softDeleteBy($reason, $actor));

        return $user->softDeleteBy($reason, $actor);
    }

    public function restoreClient(User $user): bool
    {
        Project::withTrashed()->where('user_id', $user->id)->get()->each->restore();

        return $user->restore();
    }

    public function purgeClient(User $user): bool
    {
        Project::withTrashed()->where('user_id', $user->id)->get()->each(fn (Project $p) => $this->purgeProject($p));

        $user->profile()?->delete();
        $user->socials()->delete();
        $user->bookmarks()->delete();
        $user->historyEvents()->delete();
        $user->accessTokens()->delete();
        $user->tokens()->delete();
        LoginHistory::where('user_id', $user->id)->delete();
        Review::where('client_id', $user->id)->delete();
        Booking::where('user_id', $user->id)->delete();

        return (bool) $user->forceDelete();
    }

    private function purgeProject(Project $project): void
    {
        // Hapus file (media + file di storage) dulu, lalu record.
        foreach ($project->files()->with('media')->get() as $file) {
            $file->media?->delete();
            $file->delete();
        }

        $project->clearMediaCollection('thumbnail');

        if ($project->delivery_zip) {
            Storage::disk('local')->delete($project->delivery_zip);
        }

        $project->invoice()?->delete();
        $project->payments()->delete();
        $project->updates()->delete();
        $project->accessTokens()->delete();
        $project->redeliveries()->delete();
        Review::where('project_id', $project->id)->delete();
        Booking::where('project_id', $project->id)->delete();

        $project->forceDelete();
    }
}
