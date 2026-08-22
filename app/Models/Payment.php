<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Payment extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = ['project_id', 'amount', 'method', 'gateway', 'gateway_ref', 'gateway_method', 'checkout_url', 'status', 'notes', 'paid_at'];

    protected $appends = ['proof_url'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('payment_proof')->singleFile();
    }

    public function getProofUrlAttribute(): ?string
    {
        $media = $this->getFirstMedia('payment_proof');
        if ($media) return $media->getUrl();

        return $this->proof_file ? asset('storage/' . $this->proof_file) : null;
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
