<?php

namespace App\Http\Middleware;

use App\Services\RuntimeSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Maintenance
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = app(RuntimeSettings::class);

        if (!$settings->maintenanceEnabled()) {
            return $next($request);
        }

        $path = $request->path();

        if ($request->is('login') || $request->is('api/login') || $request->is('api/send-otp') || $request->is('api/verify-otp') || $request->is('api/whatsapp-status') || $request->is('auth/google/redirect') || $request->is('auth/google/callback') || $request->is('up')) {
            return $next($request);
        }

        if (str_starts_with($path, 'build/') || str_starts_with($path, 'storage/') || str_starts_with($path, 'favicon')) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && ($user->isOwner() || $user->isStaff())) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Situs sedang dalam pemeliharaan.'], 503);
        }

        return response()
            ->view('maintenance', ['message' => $settings->maintenanceMessage()])
            ->setStatusCode(503);
    }
}
