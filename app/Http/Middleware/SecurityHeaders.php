<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (method_exists($response, 'header')) {
            // Paksa penggunaan HTTPS (HSTS) - 1 tahun
            $response->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            
            // Mencegah Clickjacking
            $response->header('X-Frame-Options', 'SAMEORIGIN');
            
            // Mencegah eksploitasi MIME sniffing (menyuntik script ke file CSS/gambar)
            $response->header('X-Content-Type-Options', 'nosniff');
            
            // Membatasi informasi referrer yang dikirim
            $response->header('Referrer-Policy', 'strict-origin-when-cross-origin');
            
            // Content Security Policy dasar: mencegah XSS (mengizinkan script & gaya lokal, analitik standar, dll.)
            // Konfigurasi longgar yang aman untuk mencegah XSS inline namun tetap mendukung aset eksternal dan Laravel Vite
            $csp = "default-src 'self' data: https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:;";
            $response->header('Content-Security-Policy', $csp);
            
            // Hapus versi PHP jika ditambahkan di runtime (opsional sebagai proteksi lapis dua jika expose_php tidak mati di php.ini)
            if (function_exists('header_remove')) {
                header_remove('X-Powered-By');
            }
        }

        return $response;
    }
}
