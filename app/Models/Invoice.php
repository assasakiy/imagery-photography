<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    public const STATUSES = ['unpaid', 'partial', 'paid'];

    protected $fillable = [
        'number',
        'project_id',
        'issued_at',
        'due_at',
        'base_amount',
        'paid_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'due_at' => 'date',
            'base_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public static function nextNumber(): string
    {
        $siteName = app(\App\Services\RuntimeSettings::class)->siteName();
        $words = preg_split("/\s+/", strtoupper(trim($siteName)));
        $abbr = count($words) >= 2
            ? implode('', array_map(fn($w) => mb_substr($w, 0, 1), array_slice($words, 0, 3)))
            : mb_substr($words[0] ?? 'SYS', 0, 3);
        $abbr = $abbr ?: 'SYS';

        $dateStr = now()->format('ymd');
        $prefix = "INV-{$abbr}-{$dateStr}-";
        $last = static::where('number', 'like', $prefix . '%')->orderByDesc('id')->value('number');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    public function remaining(): float
    {
        return max(0, round($this->base_amount - $this->paid_amount, 2));
    }

    public function refreshStatus(): void
    {
        $remaining = $this->remaining();
        $this->status = $remaining <= 0 ? 'paid' : ($this->paid_amount > 0 ? 'partial' : 'unpaid');
        $this->save();
    }
}