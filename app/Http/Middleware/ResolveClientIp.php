<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveClientIp
{
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $this->clientIp($request);

        if ($ip !== null) {
            $request->server->set('REMOTE_ADDR', $ip);
        }

        return $next($request);
    }

    private function clientIp(Request $request): ?string
    {
        $candidates = [];

        $cf = trim((string) $request->header('CF-Connecting-IP'));
        if ($cf !== '') {
            $candidates[] = $cf;
        }

        $forwarded = trim((string) $request->header('X-Forwarded-For'));
        if ($forwarded !== '') {
            $first = trim(explode(',', $forwarded)[0]);
            if ($first !== '') {
                $candidates[] = $first;
            }
        }

        $real = trim((string) $request->header('X-Real-IP'));
        if ($real !== '') {
            $candidates[] = $real;
        }

        foreach ($candidates as $candidate) {
            $candidate = strtok($candidate, ',') ?: $candidate;
            if (filter_var(trim($candidate), FILTER_VALIDATE_IP)) {
                return trim($candidate);
            }
        }

        return null;
    }
}
