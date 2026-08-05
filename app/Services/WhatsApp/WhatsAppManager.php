<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use InvalidArgumentException;

class WhatsAppManager
{
    public function __construct(
        private readonly RuntimeSettings $settings,
        private readonly WhatsAppDriverRegistry $registry,
    ) {}

    public function driver(?string $name = null): WhatsAppDriver
    {
        return $this->registry->resolve($name ?? $this->settings->whatsappDriver());
    }

    public function send(string $phone, string $message, ?string $driver = null): WhatsAppSendResult
    {
        try {
            return $this->driver($driver)->send($phone, $message);
        } catch (InvalidArgumentException $e) {
            return WhatsAppSendResult::fail(
                $driver ?? $this->settings->whatsappDriver(),
                'Driver WhatsApp tidak tersedia: ' . $e->getMessage()
            );
        }
    }
}