<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDispatcher
{
    public function __construct(private readonly RuntimeSettings $settings) {}

    /**
     * Dispatch an event payload to all configured webhook URLs (sync-safe).
     * Returns number of URLs the payload was posted to.
     */
    public function dispatch(string $event, array $payload): int
    {
        $urls = $this->settings->webhookUrls();

        if (empty($urls)) {
            return 0;
        }

        $sent = 0;

        foreach ($urls as $url) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'SopianLaluImagery-Webhook/1.0'])
                    ->post($url, [
                        'event' => $event,
                        'data' => $payload,
                        'sent_at' => now()->toIso8601String(),
                    ]);

                if ($response->successful()) {
                    $sent++;
                } else {
                    Log::warning('Webhook dispatch failed.', ['url' => $url, 'status' => $response->status()]);
                }
            } catch (\Throwable $e) {
                Log::warning('Webhook dispatch error.', ['url' => $url, 'error' => $e->getMessage()]);
            }
        }

        return $sent;
    }
}
