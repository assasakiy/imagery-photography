<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteWhatsAppDriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $token = (string) ($config['api_token'] ?? env('WHATSAPP_TOKEN'));

        if ($token === '') {
            return WhatsAppSendResult::fail('fonnte', 'Fonnte API token belum dikonfigurasi.');
        }

        $url = 'https://api.fonnte.com/send';

        try {
            $response = Http::withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])
                ->withHeaders([
                    'Authorization' => $token,
                ])->asForm()->post($url, [
                'target' => $this->digits($phone),
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (Fonnte) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'fonnte', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        $status = isset($data['status']) ? (bool) $data['status'] : $response->successful();

        if ($status) {
            $id = isset($data['id']) ? (string) $data['id'] : null;
            $text = trim((string) ($data['message'] ?? '')) ?: 'Fonnte: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('fonnte', $text, $id, $raw);
        }

        $text = trim((string) ($data['reason'] ?? $data['message'] ?? '')) ?: 'Fonnte: HTTP ' . $response->status();

        Log::warning('WhatsApp (Fonnte) send failed.', [
            'phone' => $phone,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('fonnte', $text, $raw);
    }
}