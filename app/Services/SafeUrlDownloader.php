<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use Psr\Http\Message\RequestInterface;

/**
 * Fetch URL secara aman: validasi resolved IP di tiap hop (request awal + redirect).
 * Memblokir IP privat, loopback, dan reserved range.
 */
class SafeUrlDownloader
{
    public function fetchToTempFile(string $url, int $timeoutSeconds = 30): string
    {
        $handler = HandlerStack::create();
        $handler->push(Middleware::tap(
            function (RequestInterface &$request) {
                $host = $request->getUri()->getHost();
                $ip = gethostbyname($host);

                if ($ip === $host || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    throw new \RuntimeException(
                        "Blocked: host {$host} resolves to private/reserved IP {$ip}"
                    );
                }

                // Force connection ke IP literal, bukan hostname (mencegah DNS rebinding).
                $port = $request->getUri()->getPort() ?? ($request->getUri()->getScheme() === 'https' ? 443 : 80);
                $newUri = $request->getUri()
                    ->withHost($ip)
                    ->withPort($port);
                $request = $request->withUri($newUri)
                    ->withHeader('Host', $host);
            }
        ));

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
