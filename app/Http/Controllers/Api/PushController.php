<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('services.vapid.public_key', env('VAPID_PUBLIC_KEY')),
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint'         => 'required|string|max:500',
            'publicKey'        => 'required|string|max:255',
            'authToken'        => 'required|string|max:255',
            'contentEncoding'  => 'nullable|string|max:25',
        ]);

        $user = $request->user();

        PushSubscription::updateOrCreate(
            ['user_id' => $user->id, 'endpoint' => $validated['endpoint']],
            [
                'public_key'       => $validated['publicKey'],
                'auth_token'       => $validated['authToken'],
                'content_encoding' => $validated['contentEncoding'] ?? 'aes128gcm',
                'is_active'        => true,
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|max:500',
        ]);

        $request->user()->pushSubscriptions()
            ->where('endpoint', $validated['endpoint'])
            ->update(['is_active' => false]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, PushSubscription $subscription): JsonResponse
    {
        if ($subscription->user_id !== $request->user()->id) {
            abort(403);
        }

        $subscription->delete();

        return response()->json(['ok' => true]);
    }
}
