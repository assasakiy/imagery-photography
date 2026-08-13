<?php

namespace App\Models;

use App\Support\SoftDeletesWithWho;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\AlignPosition;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Project extends Model implements HasMedia
{
    use SoftDeletesWithWho;
    use InteractsWithMedia;

    public const STATUSES = ['scheduled', 'shooting', 'editing', 'awaiting_payment', 'completed', 'archived'];

    public const STATUS_LABELS = [
        'scheduled' => 'Dijadwalkan',
        'shooting' => 'Pemotretan',
        'editing' => 'Editing',
        'awaiting_payment' => 'Preview Tersedia',
        'completed' => 'Selesai',
        'archived' => 'Diarsipkan',
    ];

    /** Urutan alur (stepper). Draft urutan utk logika maju-mundur. */
    public const STEP_ORDER = ['scheduled', 'shooting', 'editing', 'awaiting_payment', 'completed', 'archived'];

    protected $fillable = [
        'user_id', 'name', 'order_no', 'package_id', 'event_date', 'event_start', 'event_end', 'description',
        'location', 'price', 'pricing_snapshot', 'status', 'shooting_at', 'editing_at', 'awaiting_payment_at', 'completed_at',
        'client_notes',
        'photo_total', 'photo_done', 'video_total', 'video_done',
        'preview_ends_at', 'preview_expired_at', 'reminded_at',
        'delivery_zip', 'delivery_zip_size', 'delivery_zip_count',
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
            'preview_ends_at' => 'datetime',
            'preview_expired_at' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }

    public static function graceMinutes(): int
    {
        return (int) app(\App\Services\RuntimeSettings::class)->get('event_grace_minutes', '10');
    }

    /** Nomor pesanan: satu kode {ABBR}-{YYMMDD}-{XXXX} (tanpa awalan jenis). */
    public static function nextOrderNumber(): string
    {
        $siteName = app(\App\Services\RuntimeSettings::class)->siteName();
        $words = preg_split("/\s+/", strtoupper(trim($siteName)));
        $abbr = count($words) >= 2
            ? implode('', array_map(fn ($w) => mb_substr($w, 0, 1), array_slice($words, 0, 3)))
            : mb_substr($words[0] ?? 'SYS', 0, 3);
        $abbr = $abbr ?: 'SYS';

        $dateStr = now()->format('ymd');
        $prefix = "{$abbr}-{$dateStr}-";
        $last = static::where('order_no', 'like', $prefix . '%')->orderByDesc('id')->value('order_no');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->order_no)) {
                $project->order_no = static::nextOrderNumber();
            }
        });
    }

    /**
     * Buat proyek dgn nomor pesanan unik (lock serial; aman utk create bersamaan).
     * Cache lock utk `order_no` — kunci file/storage berfungsi antar worker php-fpm.
     */
    public static function createWithOrderNumber(array $attributes): self
    {
        return \Illuminate\Support\Facades\Cache::lock('projects:order-no', 10)
            ->block(10, fn () => static::create($attributes));
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

    /** Collection Spatie utk file proyek. Original = disk privat 'local', conversion preview = 'public'. */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('files')
            ->useDisk('local')
            ->storeConversionsOnDisk('public');

        // Bukti mulai/selesai sesi — record permanen, jalur terpisah (project-proofs).
        $this->addMediaCollection('proofs')->useDisk('public');

        // Thumbnail card — permanen, jalur terpisah (project-thumbs), tanpa watermark.
        $this->addMediaCollection('thumbnail')->singleFile()->useDisk('public');
    }

    /**
     * Hanya foto di collection 'files' yang dapat konversi 'preview' (fit + watermark).
     * HoakVideo/dokumen lain TIDAK dikonversi.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media && ($media->collection_name !== 'files' || str_starts_with($media->mime_type ?? '', 'video/'))) {
            return;
        }

        $this->addMediaConversion('preview')
            ->fit(Fit::Max, 1920, 1920)
            ->watermark(public_path('watermark.png'), AlignPosition::Center)
            ->nonQueued()
            ->performOnCollections('files');
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

    public function redeliveries()
    {
        return $this->hasMany(Redelivery::class);
    }

    /** Ada permintaan unduh-ulang yang disetujui & link-nya belum kedaluwarsa. */
    public function hasActiveRedelivery(): bool
    {
        return $this->redeliveries()
            ->where('status', 'approved')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->exists();
    }

    /** Zip hasil deliver (jika preview sudah berakhir). */
    public function deliveryZipAbsPath(): ?string
    {
        return $this->delivery_zip ? storage_path('app/private/' . $this->delivery_zip) : null;
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
                if (!$this->preview_ends_at && $this->awaiting_payment_at) {
                    $this->preview_ends_at = $this->awaiting_payment_at->copy()->addDays(30);
                }
                break;
            case 'completed':
                if (!$this->completed_at) {
                    $this->completed_at = now();
                }
                break;
            case 'archived':
                if (!$this->archived_at) {
                    $this->archived_at = now();
                }
                break;
        }

        $this->save();

        if ($old !== $next) {
            $this->addSystemUpdate(self::transitionMessage($next));
        }

        return true;
    }

    /** Pesan timeline tunggal saat pindah tahap (dipakai advance, update, updateStatus). */
    public static function transitionMessage(string $to): string
    {
        $messages = [
            'shooting' => 'Pesanan melaju ke tahap Pemotretan — tim mulai pengambilan foto/video.',
            'editing' => 'Pesanan melaju ke tahap Editing — materi hasil pemotretan sedang diproses.',
            'awaiting_payment' => 'Pesanan melaju ke tahap Preview Tersedia — hasil pekerjaan dapat ditinjau klien.',
            'completed' => 'Pesanan melaju ke tahap Selesai — seluruh pekerjaan dan pembayaran selesai.',
            'archived' => 'Pesanan melaju ke tahap Arsip — disimpan sesuai kebijakan retensi.',
        ];

        return $messages[$to] ?? 'Pesanan melaju ke tahap ' . (self::STATUS_LABELS[$to] ?? $to) . '.';
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

    /**
     * Jalankan transisi otomatis (lazy on-access ATAU via command).
     * Kalau $only diisi, cek satu proyek saja (hemat query saat show).
     */
    public static function processDueTransitions(?self $only = null): void
    {
        $grace = static::graceMinutes();
        $now = now()->subMinutes($grace);

        $scheduled = $only && $only->status === 'scheduled'
            ? collect([$only])
            : static::where('status', 'scheduled')->whereNotNull('event_start')->where('event_start', '<=', $now)->get();
        $scheduled->each(fn (self $p) => $p->event_start && $p->event_start <= $now ? $p->advanceStep('shooting') : null);

        $shooting = $only && $only->status === 'shooting'
            ? collect([$only])
            : static::where('status', 'shooting')->whereNotNull('event_end')->where('event_end', '<=', $now)->get();
        $shooting->each(fn (self $p) => $p->event_end && $p->event_end <= $now ? $p->advanceStep('editing') : null);

        if ($only) {
            if ($only->status === 'awaiting_payment' && $only->isPaid()) {
                $only->advanceStep('completed');
            }

            return;
        }

        static::where('status', 'awaiting_payment')->get()
            ->filter(fn (self $p) => $p->isPaid())
            ->each(fn (self $p) => $p->advanceStep('completed'));
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('id', $value)->orWhere('order_no', $value)->firstOrFail();
    }
}
