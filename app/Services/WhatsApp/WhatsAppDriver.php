<?php

namespace App\Services\WhatsApp;

interface WhatsAppDriver
{
    /**
     * Send a WhatsApp text message.
     *
     * Should never throw for provider/transport errors — map them into a
     * WhatsAppSendResult with success=false and a human-readable message.
     */
    public function send(string $phone, string $message): WhatsAppSendResult;
}