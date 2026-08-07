<?php

namespace App\Models;

use App\Support\SoftDeletesWithWho;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use SoftDeletesWithWho;

    public const STATUSES = ['scheduled', 'shooting', 'editing', 'awaiting_payment', 'completed', 'archived'];

    public const STATUS_LABELS = [
        'scheduled' => 'Dijadwalkan',
        'shooting' => 'Pemotretan',
        'editing' => 'Editing',
        'awaiting_payment' => 'Menunggu Pembayaran',
        'completed' => 'Selesai',
        'archived' => 'Diarsipkan',
    ];

    /** Urutan alur (stepper). Draft urutan utk logika maju-mundur. */
    public const STEP_ORDER = ['scheduled', 'shooting', 'editing', 'awaiting_payment', 'completed', 'archived'];

    protected $fillable = [
        'user_id', 'name', 'package_id', 'event_date', 'event_start', 'event_end', 'description',
        'price', 'pricing_snapshot', 'status', 'shooting_at', 'editing_at', 'awaiting_payment_at', 'completed_at',
        'client_notes', 'gallery_preview_released', 'gallery_released',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'pricing_snapshot' => 'array',
            'event_date' => 'date',
            'event_start' => 'datetime',
            'event_end' => 'datetime',
            'shooting_at' => 'datetime',
            'editing_at' => 'datetime',
            'awaiting_payment_at' => 'datetime',
            'completed_at' => 'datetime',
            'archived_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /** Jeda (menit) dari waktu mulai/selesai acara utk transisi otomatis. */
    public static function graceMinutes(): int
    {
        return (int) app(\App\Services\RuntimeSettings::class)->get('event_grace_minutes', '10');
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function booking()
    {
        return $this->hasOne(Booking::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
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

    public function isPaid(): bool
    {
        return $this->remainingBalance() <= 0;
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function stepIndex(): int
    {
        $i = array_search($this->status, self::STEP_ORDER, true);

        return $i === false ? 0 : (int) $i;
    }

    public function nextStep(): ?string
    {
        $i = $this->stepIndex();
        if ($i < count(self::STEP_ORDER) - 1) {
            return self::STEP_ORDER[$i + 1];
        }

        return null;
    }

    public function advanceStep(?string $target = null): bool
    {
        $target ??= $this->nextStep();
        if (!$target) {
            return false;
        }

        $next = self::STEP_ORDER[array_search($target, self::STEP_ORDER, true)] ?? null;
        if (!$next) {
            return false;
        }

        $old = $this->status;
        $this->status = $next;

        switch ($next) {
            case 'shooting':
                if (!$this->shooting_at) {
                    $this->shooting_at = now();
                }
                break;
            case 'editing':
                if (!$this->editing_at) {
                    $this->editing_at = now();
                }
                break;
            case 'awaiting_payment':
                if (!$this->awaiting_payment_at) {
                    $this->awaiting_payment_at = now();
                }
                break;
            case 'completed':
                if (!$this->completed_at) {
                    $this->completed_at = now();
                }
                break;
        }

        $this->save();

        if ($old !== $next) {
            $this->addSystemUpdate('Alur proyek melaju ke tahap: ' . (self::STATUS_LABELS[$next] ?? $next) . '.');
        }

        return true;
    }

    /** Tambah event Timeline SISTEM (auto). */
    public function addSystemUpdate(string $message): void
    {
        ProjectUpdate::create([
            'project_id' => $this->id,
            'message' => $message,
            'type' => 'milestone',
            'kind' => 'system',
        ]);
    }
}
