<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ProjectFile extends Model
{
    protected $fillable = ['project_id', 'media_id', 'asset_key', 'variant', 'filename', 'original_name', 'path', 'size', 'type', 'category', 'is_preview', 'gallery_status', 'expires_at', 'preview_expires_at'];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'preview_expires_at' => 'datetime',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function media()
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    /**
     * URL preview (watermark) yang AMAN dikirim ke frontend.
     * Original/video-HD TIDAK pernah dikirim sebagai URL — hanya lewat endpoint gated.
     */
    public function getUrlAttribute()
    {
        $media = $this->media;
        if ($media) {
            if ($this->variant === 'preview') {
                return $media->getUrl();
            }
            if ($media->hasGeneratedConversion('preview')) {
                return $media->getUrl('preview');
            }
        }

        // Legacy path-based (mis. bukti mulai/selesai sesi).
        if ($this->path) {
            return asset('storage/' . $this->path);
        }

        return null;
    }

    /** File original (private) milik pasangan video / media foto utk download. */
    public function originalFile(): ?self
    {
        if ($this->category === 'video' && $this->variant === 'preview' && $this->asset_key) {
            return $this->project->files()
                ->where('asset_key', $this->asset_key)
                ->where('variant', 'original')
                ->first();
        }

        return $this;
    }

    /** Ketersediaan preview utk klien (belum lewat preview_expires_at, conversion masih ada). */
    public function isPreviewAvailable(): bool
    {
        if ($this->variant === 'original' && $this->category === 'video') {
            return false; // original video tidak pernah tampil di galeri preview.
        }

        if ($this->preview_expires_at && $this->preview_expires_at->isPast()) {
            return false;
        }

        if ($this->media && $this->category === 'photo' && ! $this->media->hasGeneratedConversion('preview')) {
            return false; // conversion preview sudah diprune.
        }

        return true;
    }

    /**
     * Bersihkan preview yg sudah lewat masa (foto: conversion public; video: media preview public).
     * Original privat SELALU dipertahankan. Best-effort: file yang gagal dihapus (mis. beda user)
     * akan dicoba lagi saat berikutnya; state DB hanya dimajukan bila file benar-benar terhapus.
     */
    public static function pruneExpired(?int $projectId = null): int
    {
        $count = 0;

        // Video preview kedaluwarsa — hapus media (file public) + row.
        $pf = static::with('media')
            ->where('category', 'video')
            ->where('variant', 'preview')
            ->whereNotNull('preview_expires_at')
            ->where('preview_expires_at', '<', now());
        if ($projectId) {
            $pf = $pf->where('project_id', $projectId);
        }
        $pf->get()->each(function (self $file) use (&$count) {
            if ($file->media) {
                $file->media->delete();
            }
            $file->delete();
            $count++;
        });

        // Foto: hapus conversion 'preview' dari disk public; preview_expires_at hanya dibersihkan
        // bila file benar-benar terhapus (kalau gagal, tetap tersembunyi via isPreviewAvailable).
        $ph = static::with('media')
            ->where('category', 'photo')
            ->whereNotNull('preview_expires_at')
            ->where('preview_expires_at', '<', now());
        if ($projectId) {
            $ph = $ph->where('project_id', $projectId);
        }
        $ph->get()->each(function ($file) use (&$count) {
            $media = $file->media;
            if ($media && $media->hasGeneratedConversion('preview')) {
                $removed = Storage::disk($media->conversions_disk)->delete($media->getPathRelativeToRoot('preview'));
                if ($removed) {
                    $media->markAsConversionNotGenerated('preview');
                    $file->update(['preview_expires_at' => null]);
                    $count++;
                }
            } elseif (empty($file->preview_expires_at) || $file->preview_expires_at->isPast()) {
                // Tak ada conversion tersisa: tinggal bersihkan penanda.
                if ($file->preview_expires_at !== null) {
                    $file->update(['preview_expires_at' => null]);
                }
                $count++;
            }
        });

        return $count;
    }
}
