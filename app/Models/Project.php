<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'client_id', 'user_id', 'name', 'type', 'package_id', 'event_date', 'description',
        'price', 'pricing_snapshot', 'status', 'start_date', 'end_date',
        'retention_days', 'archived_at', 'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'pricing_snapshot' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'archived_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function retentionDays(): ?int
    {
        return $this->retention_days ?? (int) app(\App\Services\RuntimeSettings::class)->get('file_retention_days', 0) ?: null;
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function updates()
    {
        return $this->hasMany(ProjectUpdate::class)->latest();
    }

    public function accessTokens()
    {
        return $this->hasMany(ClientAccessToken::class);
    }

    public function totalPaid()
    {
        return $this->payments()->where('status', 'confirmed')->sum('amount');
    }

    public function remainingBalance()
    {
        return ($this->price ?? 0) - $this->totalPaid();
    }
}
