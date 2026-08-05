<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiDriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $base = rtrim((string) ($config['base_url'] ?? ''), '/');
        $apiKey = (string) ($config['api_key'] ?? '');
        $instance = (string) ($config['instance'] ?? '');

        if ($base === '' || $instance === '') {
            return WhatsAppSendResult::fail('evolution', 'Evolution API: base URL / instance belum dikonfigurasi.');
        }

        $url = $base . '/message/sendText/' . $instance;

        try {
            $response = Http::timeout(20)
                ->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])
                ->withHeaders(['apikey' => $apiKey])
                ->post($url, [
                    'number' => $this->digits($phone),
                    'text' => $message,
                ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (Evolution API) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'evolution', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        if ($response->successful()) {
            $id = isset($data['key']['id']) ? (string) $data['key']['id'] : null;
            $text = trim((string) ($data['message'] ?? '')) ?: 'Evolution API: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('evolution', $text, $id, $raw);
        }

        $text = trim((string) ($data['message'] ?? $data['error'] ?? '')) ?: 'Evolution API: HTTP ' . $response->status();

        Log::warning('WhatsApp (Evolution API) send failed.', [
            'phone' => $phone,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('evolution', $text, $raw);
    }
}