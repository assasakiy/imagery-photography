<?php

namespace App\Http\Middleware;

use App\Services\VisitTracker;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackVisits
{
    public function __construct(private VisitTracker $tracker)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $this->tracker->handle($request);
        $this->tracker->applySessionCookie($request, $response);

        return $response;
    }
}