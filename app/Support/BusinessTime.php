<?php

namespace App\Support;

use App\Services\RuntimeSettings;
use Carbon\Carbon;

/**
 * Waktu bisnis Imagery: semua timestamp sistem disimpan UTC, namun input
 * jadwal acara (event_date + start_time) ditafsirkan dalam timezone bisnis
 * (settings.timezone) lalu dikonversi ke UTC saat disimpan. Kebalikannya,
 * menampilkan kembali ke timezone bisnis saat dibaca.
 */
class BusinessTime
{
    public function __construct(private RuntimeSettings $settings) {}

    /**
     * Parse {Y-m-d} + {H:i} sebagai waktu lokal bisnis → Carbon UTC.
     * Mengembalikan null bila salah satu kosong atau format tidak valid.
     */
    public function toUtc(?string $date, ?string $time): ?Carbon
    {
        if (empty($date) || empty($time)) {
            return null;
        }

        $carbon = Carbon::createFromFormat('Y-m-d H:i', "$date $time", $this->tz(), true);

        return $carbon ? $carbon->utc() : null;
    }

    /**
     * Parse string datetime apapun (mis. "2026-08-14 10:00" atau ISO UTC)
     * sebagai waktu dalam timezone bisnis → Carbon UTC.
     */
    public function parseToUtc(?string $value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value, $this->tz())->utc();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Konversi Carbon UTC → Carbon dalam timezone bisnis (untuk ditampilkan).
     */
    public function fromUtc(Carbon $utc): Carbon
    {
        return $utc->copy()->tz($this->tz());
    }

    public function tz(): string
    {
        return $this->settings->timezone();
    }

    public function now(): Carbon
    {
        return Carbon::now($this->tz());
    }
}
