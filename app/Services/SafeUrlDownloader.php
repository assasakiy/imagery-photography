<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use Psr\Http\Message\RequestInterface;

/**
 * Fetch URL secara aman: validasi resolved IP di tiap hop (request awal + redirect).
 * Memblokir IP privat, loopback, dan reserved range.
 * Pakai CURLOPT_RESOLVE supaya TLS/SNI tetap jalan (hostname dipertahankan untuk cert validation).
 */
class SafeUrlDownloader
{
    public function fetchToTempFile(string $url, int $timeoutSeconds = 30): string
    {
        $handler = HandlerStack::create();

        // Satu middleware yang resolve, validasi, DAN apply CURLOPT_RESOLVE.
        // Variabel $resolveEntry ditangkap lewat closure, jadi tidak perlu PSR-7 attribute.
        $handler->push(Middleware::tap(
            function (RequestInterface &$request) use (&$resolveEntry) {
                $host = $request->getUri()->getHost();
                $port = $request->getUri()->getPort()
                    ?? ($request->getUri()->getScheme() === 'https' ? 443 : 80);

                if (filter_var($host, FILTER_VALIDATE_IP)) {
                    $ip = $host;
                } else {
                    $ip = gethostbyname($host);
                    if ($ip === $host) {
                        throw new \RuntimeException("Blocked: host {$host} tidak bisa di-resolve.");
                    }
                }

                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    throw new \RuntimeException("Blocked: {$host} ({$ip}) mengarah ke IP privat/internal.");
                }

                // Simpan hasil resolve — curl middleware di bawah akan pakai ini.
                $resolveEntry = "{$host}:{$port}:{$ip}";
            }
        ));

        // Middleware curl: apply CURLOPT_RESOLVE dari closure variable.
        $handler->push(function (callable $handler) use (&$resolveEntry) {
            return function ($request, array $options) use ($handler, &$resolveEntry) {
                if ($resolveEntry) {
                    $options['curl'][CURLOPT_RESOLVE] = [$resolveEntry];
                }
                return $handler($request, $options);
            };
        });

        $client = new Client([
            'handler' => $handler,
            'timeout' => $timeoutSeconds,
            'connect_timeout' => 10,
            'max_redirects' => 5,
            'allow_redirects' => [
                'max' => 5,
                'strict' => true,
                'referer' => true,
            ],
            'headers' => [
                'User-Agent' => 'ImageryMediaImport/1.0',
            ],
            'curl' => [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ],
        ]);

        $response = $client->get($url);

        if ($response->getStatusCode() !== 200) {
            throw new \RuntimeException("HTTP " . $response->getStatusCode());
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'media_import_');
        file_put_contents($tmpFile, $response->getBody()->getContents());

        return $tmpFile;
    }
}
