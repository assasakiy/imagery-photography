<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CustomApiDriver implements WhatsAppDriver
{
    private const DEFAULT_TEMPLATE = "{\n  \"phone\": \"{{phone}}\",\n  \"message\": \"{{message}}\"\n}";

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $base = rtrim((string) ($config['base_url'] ?? ''), '/');
        $endpoint = ltrim((string) ($config['endpoint'] ?? '/send'), '/');
        $method = strtoupper((string) ($config['method'] ?? 'POST'));

        if ($base === '') {
            return WhatsAppSendResult::fail('custom', 'Custom REST API: base URL belum dikonfigurasi.');
        }

        $url = $base . '/' . $endpoint;

        $http = Http::timeout(20)->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]]);

        $this->applyAuth($http, $config);

        $template = (string) ($config['body_template'] ?? self::DEFAULT_TEMPLATE);
        $rendered = strtr($template, [
            '{{phone}}' => $phone,
            '{{message}}' => $message,
        ]);

        $decoded = json_decode($rendered, true);

        try {
            $response = is_array($decoded)
                ? $http->asJson()->send($method, $url, ['json' => $decoded])
                : $http->withBody($rendered, 'text/plain')->send($method, $url);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (Custom REST API) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'custom', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        if ($response->successful()) {
            $id = isset($data['id']) ? (string) $data['id'] : (isset($data['message_id']) ? (string) $data['message_id'] : null);
            $text = trim((string) ($data['message'] ?? '')) ?: 'Custom REST API: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('custom', $text, $id, $raw);
        }

        $text = trim((string) ($data['message'] ?? $data['error'] ?? '')) ?: 'Custom REST API: HTTP ' . $response->status();

        Log::warning('WhatsApp (Custom REST API) send failed.', [
            'phone' => $phone,
            'url' => $url,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('custom', $text, $raw);
    }

    private function applyAuth($http, array $config): void
    {
        $authType = (string) ($config['auth_type'] ?? 'none');
        $headerKey = (string) ($config['header_key'] ?? 'Authorization');
        $headerValue = (string) ($config['header_value'] ?? '');

        switch ($authType) {
            case 'bearer':
                $http->withHeaders([$headerKey !== '' ? $headerKey : 'Authorization' => 'Bearer ' . $headerValue]);
                break;

            case 'api_key':
                $http->withHeaders([$headerKey !== '' ? $headerKey : 'Authorization' => $headerValue]);
                break;

            case 'basic':
                $http->withBasicAuth(...array_pad(explode(':', $headerValue, 2), 2, ''));
                break;
        }
    }
}