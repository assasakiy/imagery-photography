<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoWADriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $base = rtrim((string) ($config['base_url'] ?? ''), '/');
        $endpoint = ltrim((string) ($config['endpoint_send'] ?? '/send/message'), '/');

        if ($base === '') {
            return WhatsAppSendResult::fail('gowa', 'GoWA base URL belum dikonfigurasi.');
        }

        $http = Http::timeout(20)->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]]);

        if (!empty($config['username']) || !empty($config['password'])) {
            $http->withBasicAuth((string) ($config['username'] ?? ''), (string) ($config['password'] ?? ''));
        }

        $body = [
            'phone' => $this->digits($phone),
            'message' => $message,
        ];

        if (!empty($config['device_id'])) {
            $body['device'] = $config['device_id'];
        }

        $url = $base . '/' . $endpoint;

        try {
            $response = $http->post($url, $body);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (GoWA) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'gowa', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        $code = strtoupper((string) ($data['code'] ?? ''));
        $message = trim((string) ($data['message'] ?? '')) ?: 'GoWA: tidak ada pesan dari provider';

        if ($code === 'SUCCESS' || ($response->successful() && $code !== 'ERROR' && $code !== 'UNAUTHORIZED')) {
            $id = isset($data['results']['message_id']) ? (string) $data['results']['message_id'] : null;

            Log::info('WhatsApp (GoWA) sent.', ['phone' => $phone, 'message_id' => $id]);

            return WhatsAppSendResult::ok('gowa', $message, $id, $raw);
        }

        Log::warning('WhatsApp (GoWA) send failed.', [
            'phone' => $phone,
            'code' => $code,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('gowa', $message, $raw);
    }
}