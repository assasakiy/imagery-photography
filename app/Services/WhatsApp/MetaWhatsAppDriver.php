<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaWhatsAppDriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $token = (string) ($config['access_token'] ?? env('WHATSAPP_TOKEN'));
        $phoneNumberId = (string) ($config['phone_number_id'] ?? env('WHATSAPP_PHONE_NUMBER_ID'));
        $apiVersion = (string) ($config['api_version'] ?? (env('WHATSAPP_API_VERSION') ?: 'v21.0'));

        if ($token === '' || $phoneNumberId === '') {
            return WhatsAppSendResult::fail('meta', 'Meta Cloud API: token / phone number ID belum dikonfigurasi.');
        }

        $url = "https://graph.facebook.com/{$apiVersion}/{$phoneNumberId}/messages";

        try {
            $response = Http::withToken($token)
                ->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])
                ->post(
                $url,
                [
                    'messaging_product' => 'whatsapp',
                    'to' => $this->digits($phone),
                    'type' => 'text',
                    'text' => ['body' => $message],
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (Meta Cloud API) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'meta', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        if ($response->successful()) {
            $id = isset($data['messages'][0]['id']) ? (string) $data['messages'][0]['id'] : null;
            $text = trim((string) ($data['messages'][0]['id'] ?? '')) ?: 'Meta: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('meta', $text, $id, $raw);
        }

        $text = trim((string) ($data['error']['message'] ?? '')) ?: 'Meta: HTTP ' . $response->status();

        Log::warning('WhatsApp (Meta Cloud API) send failed.', [
            'phone' => $phone,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('meta', $text, $raw);
    }
}