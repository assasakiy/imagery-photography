<?php

namespace App\Services;

enum NotificationType: string
{
    case ACCOUNT_INVITE = 'account.invite';
    case SET_PASSWORD = 'set.password';
    case PASSWORD_RESET = 'password.reset';
    case MAGIC_LINK = 'auth.magic_link';
    case BOOKING_CREATED = 'booking.created';
    case BOOKING_APPROVED = 'booking.approved';
    case PROJECT_PROGRESS = 'project.progress';
    case GALLERY_READY = 'gallery.ready';
    case INVOICE_CREATED = 'invoice.created';
    case PAYMENT_RECEIVED = 'payment.received';
    case DOWNLOAD_LINK = 'download.link';
    case BLOG_PUBLISHED = 'blog.published';
    case NEWSLETTER = 'newsletter';

    /**
     * Kategori notifikasi menentukan urutan kanal pengiriman.
     */
    public function channelOrder(): array
    {
        return match ($this) {
            self::BLOG_PUBLISHED, self::NEWSLETTER => ['email'],
            default => ['whatsapp', 'email'],
        };
    }

    /**
     * Apakah email dikirim sebagai salinan/arsip tambahan setelah WA.
     * Hanya berlaku untuk jenis yang bersifat operasional penting.
     */
    public function emailAsCopy(): bool
    {
        return in_array($this, [
            self::BOOKING_CREATED,
            self::BOOKING_APPROVED,
            self::PROJECT_PROGRESS,
            self::GALLERY_READY,
            self::INVOICE_CREATED,
            self::PAYMENT_RECEIVED,
            self::DOWNLOAD_LINK,
        ], true);
    }

    public function waShortMessage(array $data = []): string
    {
        $name = $data['name'] ?? '';
        $link = $data['url'] ?? '';

        return match ($this) {
            self::ACCOUNT_INVITE => "Halo $name, akun Anda di Sopian Lalu Imagery telah dibuat.\nKlik link berikut untuk membuat kata sandi:\n$link",
            self::SET_PASSWORD => "Halo $name, buat kata sandi untuk akun Anda agar bisa login dengan email & kata sandi:\n$link",
            self::PASSWORD_RESET => "Halo $name, gunakan link berikut untuk mereset kata sandi Anda (berlaku 30 menit):\n$link",
            self::MAGIC_LINK => "Halo $name, tautan masuk Anda:\n$link",
            self::BOOKING_CREATED => "Halo $name, booking Anda kami terima. Kami akan segera menghubungi Anda via WhatsApp.",
            self::BOOKING_APPROVED => "Halo $name, booking Anda telah dikonfirmasi. Terima kasih!",
            self::PROJECT_PROGRESS => "Halo $name, ada perkembangan terbaru untuk pesanan Anda. Lihat di dashboard.",
            self::GALLERY_READY => "Halo $name, galeri Anda sudah siap diunduh! Klik: $link",
            self::INVOICE_CREATED => "Halo $name, invoice Anda telah diterbitkan. Lihat detailnya di dashboard.",
            self::PAYMENT_RECEIVED => "Halo $name, pembayaran Anda telah kami terima. Terima kasih!",
            self::DOWNLOAD_LINK => "Halo $name, berikut link unduhan Anda: $link",
            default => "Halo $name, kabar dari Sopian Lalu Imagery.",
        };
    }

    public function subject(): string
    {
        return match ($this) {
            self::ACCOUNT_INVITE => 'Aktivasi Akun',
            self::SET_PASSWORD => 'Buat Kata Sandi',
            self::PASSWORD_RESET => 'Reset Kata Sandi',
            self::MAGIC_LINK => 'Tautan Masuk',
            self::BOOKING_CREATED => 'Booking Diterima',
            self::BOOKING_APPROVED => 'Booking Dikonfirmasi',
            self::PROJECT_PROGRESS => 'Perkembangan Project',
            self::GALLERY_READY => 'Galeri Siap Diunduh',
            self::INVOICE_CREATED => 'Invoice Baru',
            self::PAYMENT_RECEIVED => 'Pembayaran Diterima',
            self::DOWNLOAD_LINK => 'Tautan Unduhan',
            self::BLOG_PUBLISHED => 'Artikel Baru',
            self::NEWSLETTER => 'Newsletter',
        };
    }
}