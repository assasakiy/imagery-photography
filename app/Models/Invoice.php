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