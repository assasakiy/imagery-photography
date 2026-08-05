<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use App\Services\WhatsApp\Concerns\NormalizesPhone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioDriver implements WhatsAppDriver
{
    use NormalizesPhone;

    public function __construct(private readonly RuntimeSettings $settings) {}

    public function send(string $phone, string $message): WhatsAppSendResult
    {
        $cfg = $this->settings->whatsappConfig();
        $config = $cfg['config'] ?? [];

        $sid = (string) ($config['account_sid'] ?? '');
        $token = (string) ($config['auth_token'] ?? '');
        $from = (string) ($config['from'] ?? '');

        if ($sid === '' || $from === '') {
            return WhatsAppSendResult::fail('twilio', 'Twilio: Account SID / From belum dikonfigurasi.');
        }

        $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

        try {
            $response = Http::timeout(20)
                ->asForm()
                ->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])
                ->withBasicAuth($sid, $token)
                ->post($url, [
                    'From' => $from,
                    'To' => 'whatsapp:+' . $this->digits($phone),
                    'Body' => $message,
                ]);
        } catch (\Throwable $e) {
            Log::warning('WhatsApp (Twilio) connection error.', ['phone' => $phone, 'url' => $url, 'error' => $e->getMessage()]);

            return WhatsAppSendResult::fromException($e, 'twilio', $url);
        }

        $data = $response->json();
        $raw = is_array($data) ? $data : ['body' => $response->body()];

        if ($response->successful()) {
            $id = isset($data['sid']) ? (string) $data['sid'] : null;
            $text = trim((string) ($data['status'] ?? '')) ?: 'Twilio: pesan berhasil dikirim';

            return WhatsAppSendResult::ok('twilio', $text, $id, $raw);
        }

        $text = trim((string) ($data['message'] ?? '')) ?: 'Twilio: HTTP ' . $response->status();

        Log::warning('WhatsApp (Twilio) send failed.', [
            'phone' => $phone,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return WhatsAppSendResult::fail('twilio', $text, $raw);
    }
}