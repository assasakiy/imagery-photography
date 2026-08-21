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

        // Middleware 1: resolve + validasi IP, simpan hasilnya di request attribute.
        $handler->push(Middleware::tap(
            function (RequestInterface &$request) {
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

                // Simpan resolved IP di attribute — middleware curl akan baca dari sini.
                $request = $request->withAttribute('resolved_ip', $ip);
                $request = $request->withAttribute('resolved_port', $port);
            }
        ));

        // Middleware 2: apply CURLOPT_RESOLVE dari attribute (per-request, bukan global).
        $handler->push(self::curlResolveMiddleware());

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

    /**
     * Guzzle middleware: baca request attributes (resolved_ip, resolved_port),
     * inject CURLOPT_RESOLVE ke curl options supaya TCP terkoneksi ke IP valid
     * tapi hostname asli tetap dipakai untuk TLS SNI & cert validation.
     */
    private static function curlResolveMiddleware(): callable
    {
        return function (callable $handler) {
            return function ($request, array $options) use ($handler) {
                $ip = $request->getAttribute('resolved_ip');
                $port = $request->getAttribute('resolved_port');

                if ($ip && $port) {
                    $host = $request->getUri()->getHost();
                    $options['curl'][CURLOPT_RESOLVE] = ["{$host}:{$port}:{$ip}"];
                    $request = $request->withoutAttribute('resolved_ip')->withoutAttribute('resolved_port');
                }

                return $handler($request, $options);
            };
        };
    }
}
