<?php

namespace App\Services\WhatsApp;

/**
 * Normalized result for a WhatsApp send attempt.
 *
 * Every driver maps its provider-specific response (GoWA, Fonnte, Evolution,
 * WAHA, Twilio, Meta, custom REST) into this single internal shape, so the
 * rest of the app (and frontend) never depends on a provider's format.
 */
class WhatsAppSendResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $provider,
        public readonly string $message,
        public readonly ?string $providerMessageId = null,
        public readonly mixed $raw = null,
    ) {}

    public static function ok(string $provider, string $message, ?string $id = null, mixed $raw = null): self
    {
        return new self(true, $provider, $message, $id, $raw);
    }

    public static function fail(string $provider, string $message, mixed $raw = null): self
    {
        return new self(false, $provider, $message, null, $raw);
    }

    /**
     * Build a failure result from a transport/connection exception
     * (e.g. Guzzle ConnectException) into a friendly, actionable message.
     */
    public static function fromException(\Throwable $e, string $provider, string $url): self
    {
        $host = (string) parse_url($url, PHP_URL_HOST);

        $detail = $e->getMessage();

        if (str_starts_with($detail, 'cURL error ')) {
            $detail = trim(substr($detail, strpos($detail, ':') + 1) ?: $detail);
        }

        return new self(
            false,
            $provider,
            empty($host) ? "Gagal menghubungi provider: {$detail}" : "Tidak dapat terhubung ke {$host}: {$detail}",
            null,
            ['exception' => $e->getMessage()],
        );
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'provider' => $this->provider,
            'message' => $this->message,
            'provider_message_id' => $this->providerMessageId,
            'raw' => $this->raw,
        ];
    }
}