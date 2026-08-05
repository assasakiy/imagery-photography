<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WahaDriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $base = rtrim((string) ($config['base_url'] ?? ''), '/');

        if ($base === '') {
            return WhatsAppSendResult::fail('waha', 'WAHA base URL belum dikonfigurasi.');
        }

        $headers = ['Content-Type' => 'application/json'];

        if (!empty($config['api_key'])) {
            $headers['X-Api-Key'] = (string) $config['api_key'];
        }

        $url = $base . '/api/sendText';

        try {
            $response = Http::timeout(20)
                ->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])
                ->withHeaders($headers)
                ->post($url, [
                    'chatId' => $this->digits($phone) . '@c.us',
                    'text' => $message,
                ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (WAHA) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'waha', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        if ($response->successful()) {
            $text = trim((string) ($data['message'] ?? '')) ?: 'WAHA: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('waha', $text, null, $raw);
        }

        $text = trim((string) ($data['message'] ?? $data['error'] ?? '')) ?: 'WAHA: HTTP ' . $response->status();

        Log::warning('WhatsApp (WAHA) send failed.', [
            'phone' => $phone,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('waha', $text, $raw);
    }
}