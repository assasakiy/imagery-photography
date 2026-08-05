<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\TeamMember;
use App\Models\User;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    public function index()
    {
        return response()->json(TeamMember::orderByRaw('is_owner DESC')->orderBy('order')->get()->map(fn ($m) => $this->serialize($m)));
    }

    public function import()
    {
        $users = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['owner', 'admin']))->get();
        $created = 0;

        foreach ($users as $user) {
            $exists = TeamMember::where('user_id', $user->id)->exists();

            if ($exists) {
                continue;
            }

            TeamMember::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'position' => $user->isOwner() ? 'Owner & Founder' : 'Admin',
                'bio' => $user->bio,
                'photo_url' => $user->avatar_url,
                'social_facebook' => $user->social_facebook,
                'social_instagram' => $user->social_instagram,
                'social_tiktok' => $user->social_tiktok,
                'social_whatsapp' => $user->social_whatsapp,
                'is_owner' => $user->isOwner(),
                'order' => $user->isOwner() ? 1 : TeamMember::count() + 1,
            ]);
            $created++;
        }

        return response()->json(['created' => $created, 'members' => TeamMember::orderByRaw('is_owner DESC')->orderBy('order')->get()->map(fn ($m) => $this->serialize($m))]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'photo_url' => 'nullable|string|max:2048',
            'social_facebook' => 'nullable|url|max:2048',
            'social_instagram' => 'nullable|url|max:2048',
            'social_tiktok' => 'nullable|url|max:2048',
            'social_whatsapp' => 'nullable|url|max:2048',
            'is_owner' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $data['bio'] = ContentSanitizer::plainText($data['bio'] ?? '');

        $member = TeamMember::create($data + ['is_owner' => $data['is_owner'] ?? false]);
        app(\App\Services\AuditLogger::class)->log('teammember.created', 'Anggota tim dibuat', $member);

        return response()->json($this->serialize($member), 201);
    }

    public function update(Request $request, TeamMember $member)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'position' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'photo_url' => 'nullable|string|max:2048',
            'social_facebook' => 'nullable|url|max:2048',
            'social_instagram' => 'nullable|url|max:2048',
            'social_tiktok' => 'nullable|url|max:2048',
            'social_whatsapp' => 'nullable|url|max:2048',
            'is_owner' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        if (isset($data['bio'])) {
            $data['bio'] = ContentSanitizer::plainText($data['bio']);
        }

        $member->update($data);
        app(\App\Services\AuditLogger::class)->log('teammember.updated', 'Anggota tim diperbarui', $member);

        return response()->json($this->serialize($member));
    }

    public function destroy(TeamMember $member)
    {
        $member->delete();
        app(\App\Services\AuditLogger::class)->log('teammember.deleted', 'Anggota tim dihapus');

        return response()->json(['ok' => true]);
    }

    private function serialize(TeamMember $member): array
    {
        return [
            'id' => $member->id,
            'user_id' => $member->user_id,
            'name' => $member->name,
            'position' => $member->position,
            'bio' => $member->bio,
            'photo_url' => $member->photo_url,
            'photo_display_url' => $member->resolvePhotoUrl(),
            'social_facebook' => $member->social_facebook,
            'social_instagram' => $member->social_instagram,
            'social_tiktok' => $member->social_tiktok,
            'social_whatsapp' => $member->social_whatsapp,
            'is_owner' => (bool) $member->is_owner,
            'order' => $member->order,
        ];
    }
}
