<?php

namespace App\Services\WhatsApp\Concerns;

trait NormalizesPhone
{
    /**
     * Strip everything except digits, keeping the leading country code.
     * e.g. "+62 812-3456-7890" => "6281234567890".
     */
    protected function digits(string $phone): string
    {
        return preg_replace('/\D+/', '', $phone);
    }
}
