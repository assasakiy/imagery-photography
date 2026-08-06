<?php

namespace App\Models;

use App\Support\SoftDeletesWithWho;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use SoftDeletesWithWho;

    protected $fillable = [
        'user_id', 'name', 'type', 'package_id', 'event_date', 'description',
        'price', 'pricing_snapshot', 'status', 'start_date', 'end_date',
        'retention_days', 'archived_at', 'deleted_at',
        'deleted_by_id', 'deleted_by_name', 'delete_reason',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Alias legacy utk kompatibilitas JSON/frontend: nama klien pemilik project. */
    public function clientName(): string
    {
        return $this->user?->name ?? '';
    }

    public function client()
    {
        return $this->user;
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
