<?php

namespace App\Http\Middleware;

use App\Support\ApiThrottle;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware rate-limit berbasis policy.
 *
 *   Route::post('/otp', ...)->middleware('api.throttle:otp.send,email=$email');
 *
 * Mode 'attempt'/'request' → atomic check+hit, abort 429 otomatis.
 * Mode 'valid'            → cek only; controller wajib panggil
 *                           ApiThrottle::record('policy.key') setelah validasi sukses.
 *
 * Identifier di-resolve dari:
 *   - argumen middleware `key=$var` (nama field request, atau 'user' untuk id user)
 *   - fallback ke request()->user()->email / request()->input('email') / ip
 */
class ApiThrottleRequests
{
    public function handle(Request $request, Closure $next, string $policy, ?string $identifier = null): Response
    {
        $policies = config('rate_limit.policies', []);
        if (!isset($policies[$policy])) {
            return $next($request);
        }

        $identifiers = $this->resolveIdentifiers($request, $policy, $identifier);

        if (ApiThrottle::exceeded($policy, $identifiers)) {
            $retry = ApiThrottle::retryAfter($policy, $identifiers) ?: (int) ($policies[$policy]['periode'] ?? 60);

            return $this->response($request, $retry);
        }

        return $next($request);
    }

    protected function resolveIdentifiers(Request $request, string $policy, ?string $field): array
    {
        $policies = config('rate_limit.policies', []);
        $scope = $policies[$policy]['scope'] ?? 'ip';

        $user = $request->user();
        $arr = [];

        // field eksplisit via middleware parameter (email=$email, identifier=phone, user=1)
        if ($field !== null && $field !== '') {
            if ($field === 'user' || $field === 'user_id') {
                $arr['user'] = $user?->id;
            } elseif ($request->has($field)) {
                $arr['email'] = $arr['identifier'] = $request->input($field);
            }
        }

        // fallback per scope
        if (str_contains($scope, 'user') && !array_key_exists('user', $arr)) {
            $arr['user'] = $user?->id;
        }
        if ((str_contains($scope, 'identifier') || str_contains($scope, 'email') || str_contains($scope, 'account')) && !isset($arr['email'])) {
            $arr['email'] = $request->input('login') ?? $request->input('email') ?? $request->input('identifier') ?? $request->input('phone') ?? $request->input('username') ?? 'anonymous';
        }

        return $arr;
    }

    protected function response(Request $request, int $retry): Response
    {
        // abaikan perilaku default Laravel rate-limit response supaya konsisten JSON
        $payload = ['message' => 'Permintaan terlalu sering. Coba lagi nanti.', 'retry_after' => $retry];

        if ($request->expectsJson() || $request->is('api/*')) {
            return (new JsonResponse($payload, 429))->header('Retry-After', $retry);
        }

        return redirect()->back()
            ->with('error', 'Permintaan terlalu sering. Coba lagi nanti.')
            ->header('Retry-After', $retry);
    }
}
