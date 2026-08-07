<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'rejected', 'expired', 'converted'];

    protected $fillable = [
        'booking_no',
        'user_id',
        'package_id',
        'name',
        'email',
        'phone',
        'package_label',
        'event_date',
        'location',
        'notes',
        'price',
        'status',
        'project_id',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'price' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConverted(): bool
    {
        return $this->status === 'converted';
    }

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            if (empty($booking->booking_no)) {
                $booking->booking_no = static::nextNumber();
            }
        });
    }

    public static function nextNumber(): string
    {
        $dateStr = now()->format('ymd');
        $prefix = "BK-DAY-{$dateStr}-";
        $last = static::where('booking_no', 'like', $prefix . '%')->orderByDesc('id')->value('booking_no');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}