<?php

namespace App\Services;

use App\Mail\AlertMail;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Notifications\InAppNotification;

class NotificationService
{
    /**
     * Katalog event notifikasi. Key dipakai sebagai gate per-kanal.
     */
    public const EVENTS = [
        'booking.new' => 'Booking baru',
        'message.new' => 'Pesan kontak / booking baru',
        'review.new' => 'Review baru masuk',
        'project.created' => 'Proyek baru dibuat',
        'project.updated' => 'Proyek diperbarui',
        'project.status_changed' => 'Status proyek berubah',
        'project.credentials_regenerated' => 'Kredensial klien direset',
        'payment.submitted' => 'Pembayaran dikirim klien',
        'payment.confirmed' => 'Pembayaran dikonfirmasi',
        'payment.rejected' => 'Pembayaran ditolak',
        'team.invited' => 'Anggota tim diundang',
        'auth.otp' => 'OTP login',
        'auth.login' => 'Login mencurigakan',
        'auth.invite' => 'Aktivasi akun klien',
        'auth.magic_link' => 'Tautan masuk / aktivasi',
        'order.gallery_ready' => 'Galeri siap diunduh',
        'billing.invoice' => 'Invoice diterbitkan',
    ];

    /**
     * Event yang WAJIB dikirim ke pemilik akun (keamanan akun).
     * Tidak bisa dimatikan oleh admin maupun user.
     */
    public const MANDATORY_EVENTS = ['auth.otp', 'auth.login'];

    /**
     * Event yang berlaku untuk tiap kanal.
     */
    public const CHANNEL_EVENTS = [
        'inapp' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'project.credentials_regenerated', 'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited', 'auth.login',
        ],
        'email' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'project.credentials_regenerated', 'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited', 'auth.otp', 'auth.login',
            'auth.invite', 'auth.magic_link', 'order.gallery_ready', 'billing.invoice',
        ],
        'whatsapp' => [
            'booking.new', 'message.new', 'review.new',
            'project.status_changed', 'payment.submitted', 'payment.confirmed',
            'auth.otp', 'auth.login',
            'auth.invite', 'auth.magic_link', 'order.gallery_ready', 'billing.invoice',
        ],
        'webhook' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'project.credentials_regenerated', 'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited',
        ],
    ];

    public function __construct(
        private readonly RuntimeSettings $settings,
        private readonly \App\Services\WhatsApp\WhatsAppManager $whatsapp,
        private readonly WebhookDispatcher $webhooks,
    ) {}

    /**
     * Cek apakah sebuah event aktif untuk sebuah kanal (fallback kunci global lama).
     */
    public function eventEnabled(string $event, ?string $channel = null): bool    {
        if (!array_key_exists($event, self::EVENTS)) {
            return true;
        }

        if ($channel && in_array($event, self::MANDATORY_EVENTS, true)) {
            return true;
        }

        if ($channel) {
            $channelKey = 'notif_' . $channel . '_event_' . str_replace('.', '_', $event);
            $value = $this->settings->get($channelKey);

            if ($value !== null) {
                return $value !== '0';
            }
        }

        return $this->settings->get('notif_event_' . str_replace('.', '_', $event), '1') !== '0';
    }

    /**
     * Daftar event untuk sebuah kanal, siap dipakai dashboard/profile.
     */
    public function channelEvents(string $channel): array
    {
        $events = [];

        foreach (self::CHANNEL_EVENTS[$channel] ?? [] as $key) {
            $events[] = [
                'key' => $key,
                'label' => self::EVENTS[$key] ?? $key,
                'enabled' => in_array($key, self::MANDATORY_EVENTS, true)
                    ? true
                    : $this->settings->channelEnabled($channel) && $this->eventEnabled($key, $channel),
                'mandatory' => in_array($key, self::MANDATORY_EVENTS, true),
            ];
        }

        return $events;
    }

    /**
     * Apakah transport sebuah kanal terpasang.
     */
    private function channelConfigured(string $channel): bool
    {
        return match ($channel) {
            'email' => $this->settings->emailConfigured(),
            'whatsapp' => $this->settings->whatsappConfigured(),
            default => true,
        };
    }

    /**
     * Check efektif: bolehkah event dikirim via channel untuk user tertentu?
     * Event mandatory hanya butuh transport terpasang (pref user & flag admin diabaikan).
     */
    private function channelAllowed(string $event, string $channel, ?User $user): bool
    {
        if (!array_key_exists($event, self::EVENTS)) {
            return true;
        }

        if (!in_array($event, self::CHANNEL_EVENTS[$channel] ?? [], true)) {
            return false;
        }

        if (in_array($event, self::MANDATORY_EVENTS, true)) {
            return $this->channelConfigured($channel);
        }

        if (!$this->settings->channelAvailable($channel)) {
            return false;
        }

        if (!$this->eventEnabled($event, $channel)) {
            return false;
        }

        if ($user) {
            if ($channel === 'email' && $user->notif_email === false) {
                return false;
            }
            if ($channel === 'whatsapp' && $user->notif_whatsapp === false) {
                return false;
            }

            $prefs = $user->notif_events ?? [];

            if (isset($prefs[$channel]) && is_array($prefs[$channel]) && !in_array($event, $prefs[$channel], true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Send email via SMTP. Mengikuti pengaturan dashboard, fallback .env.
     */
    public function email(string|Mailable $mailable, string|User $to, ?string $event = null): void
    {
        $user = $to instanceof User ? $to : null;
        $address = $to instanceof User ? $to->email : $to;

        if ($event) {
            if (!$this->channelAllowed($event, 'email', $user)) {
                Log::info('Email skipped: not allowed for channel/user.', ['event' => $event, 'to' => $address]);

                return;
            }
        } elseif ($user && $user->notif_email === false) {
            Log::info('Email skipped: user disabled email notifications.', ['to' => $address]);

            return;
        }

        if (!$this->settings->emailConfigured()) {
            Log::info('Email skipped: no SMTP transport configured.', ['to' => $address]);

            return;
        }

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => $this->settings->mailHost(),
            'mail.mailers.smtp.port' => $this->settings->mailPort(),
            'mail.mailers.smtp.username' => $this->settings->mailUsername(),
            'mail.mailers.smtp.password' => $this->settings->mailPassword(),
            'mail.mailers.smtp.encryption' => null,
            'mail.from.address' => $this->settings->mailFromAddress() ?? $address,
            'mail.from.name' => $this->settings->mailFromName(),
        ]);

        Mail::purge('smtp');

        Mail::to($address)->send($mailable);
    }

    /**
     * Send WhatsApp message melalui driver aktif.
     */
    public function whatsapp(string $phone, string $message, ?string $driver = null, ?User $forUser = null, ?string $event = null): bool
    {
        if ($event) {
            if (!$this->channelAllowed($event, 'whatsapp', $forUser)) {
                Log::info('WhatsApp skipped: not allowed for channel/user.', ['event' => $event, 'phone' => $phone]);

                return false;
            }
        } elseif ($forUser && $forUser->notif_whatsapp === false) {
            Log::info('WhatsApp skipped: user disabled WhatsApp notifications.', ['phone' => $phone]);

            return false;
        }

        return $this->whatsapp->send($phone, $message, $driver)->success;
    }

    /**
     * Dispatch webhook payload (queued).
     */
    public function webhook(string $event, array $payload): void
    {
        if (!$this->eventEnabled($event, 'webhook')) {
            return;
        }

        if (empty($this->settings->webhookUrls())) {
            return;
        }

        DispatchWebhookJob::dispatch($event, $payload);
    }

    /**
     * Notifikasi pembayaran ditolak.
     */
    public function notifyPaymentRejected(\App\Models\Payment $payment): void
    {
        $project = $payment->project;
        if (!$project || !$project->user) return;

        $msg = "Mohon maaf, pembayaran Anda sebesar *Rp " . number_format($payment->amount, 0, ',', '.') . "* untuk pesanan *{$project->name}* ditolak.";
        $html = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                "Mohon maaf, pembayaran sebesar <strong>Rp " . number_format($payment->amount, 0, ',', '.') . "</strong> untuk pesanan <strong>{$project->name}</strong> telah ditolak oleh admin.<br><br>" .
                "Silakan periksa kembali detail pembayaran atau hubungi admin.";

        $this->whatsapp($project->user->phone, $msg, null, $project->user, 'payment.rejected');
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Pembayaran Ditolak', $html), $project->user->email, 'payment.rejected');
        $this->inApp($project->user, 'Pembayaran Ditolak', $msg, '/dashboard/pesanan/' . $project->id, 'payment.rejected');
    }

    /**
     * Notifikasi galeri siap (Preview).
     */
    public function notifyGalleryReady(\App\Models\Project $project): void
    {
        if (!$project->user) return;

        $msg = "Hasil pekerjaan untuk pesanan *{$project->name}* sudah siap! Silakan cek pratinjau di dashboard.";
        $html = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                "Hasil pekerjaan untuk pesanan <strong>{$project->name}</strong> sudah siap!.<br><br>" .
                "<a href='" . url('/dashboard/pesanan/' . $project->id) . "' style='background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Lihat Pratinjau</a>";

        $this->whatsapp($project->user->phone, $msg, null, $project->user, 'order.gallery_ready');
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Hasil Pesanan Siap', $html), $project->user->email, 'order.gallery_ready');
        $this->inApp($project->user, 'Hasil Pesanan Siap', $msg, '/dashboard/pesanan/' . $project->id, 'order.gallery_ready');
    }

    /**
     * Notifikasi invoice baru.
     */
    public function notifyInvoiceCreated(\App\Models\Invoice $invoice): void
    {
        $project = $invoice->project;
        if (!$project || !$project->user) return;

        $msg = "Invoice baru *{$invoice->number}* telah diterbitkan untuk pesanan *{$project->name}*. Segera lakukan pembayaran.";
        $html = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                "Invoice <strong>{$invoice->number}</strong> telah diterbitkan untuk pesanan <strong>{$project->name}</strong>.<br><br>" .
                "Silakan cek dashboard untuk detail pembayaran.";

        $this->whatsapp($project->user->phone, $msg, null, $project->user, 'billing.invoice');
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Invoice Baru', $html), $project->user->email, 'billing.invoice');
        $this->inApp($project->user, 'Invoice Baru', $msg, '/dashboard/pesanan/' . $project->id, 'billing.invoice');
    }

    /**
     * Notifikasi update status proyek.
     */
    public function notifyProjectStatusChanged(\App\Models\Project $project, string $newStatus): void
    {
        if (!$project->user) return;

        $statusLabel = strtoupper(str_replace('_', ' ', $newStatus));
        $message = \App\Models\Project::transitionMessage($newStatus);
        
        $waMsg = "Halo {$project->user->name}, status pesanan *{$project->name}* Anda diperbarui: *{$statusLabel}*.\n\n{$message}";
        $emailHtml = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                     "Status pesanan <strong>{$project->name}</strong> Anda diperbarui: <strong>{$statusLabel}</strong>.<br><br>" .
                     "<i>{$message}</i><br><br>" .
                     "<a href='" . url('/dashboard/pesanan/' . $project->id) . "' style='background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Lihat Detail</a>";

        $this->whatsapp($project->user->phone, $waMsg, null, $project->user, 'project.status_changed');
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Status Proyek Diperbarui', $emailHtml), $project->user->email, 'project.status_changed');
        $this->inApp($project->user, 'Status Proyek Diperbarui', $message, '/dashboard/pesanan/' . $project->id, 'project.status_changed');
    }

    /**
     * Send a notification to every admin/owner user.
     */
    public function toAdmins(string $title, string $message, ?string $url = null, ?string $event = null): void
    {
        $this->inApp(User::role(['admin', 'owner'])->get(), $title, $message, $url, $event);
    }

    /**
     * Kanal pengiriman OTP untuk seorang user (fleksibel bila email & WA keduanya ada).
     * Hanya kanal yang AKTIF (channelAvailable = configured + enabled) yang dipakai.
     */
    public function otpChannel(User $user): ?string
    {
        $email = $this->settings->channelAvailable('email');
        $wa = $this->settings->channelAvailable('whatsapp');

        if ($email && $wa) {
            return in_array($user->notif_otp_channel, ['email', 'whatsapp'], true)
                ? $user->notif_otp_channel
                : 'whatsapp';
        }

        if ($email) {
            return 'email';
        }

        if ($wa) {
            return 'whatsapp';
        }

        return null;
    }

    /**
     * Kirim OTP ke user lewat kanal pilihannya (wajib, tidak bisa dimatikan).
     */
    public function sendOtp(User $user, string $phone, string $code): bool
    {
        $channel = $this->otpChannel($user);
        $message = "Kode OTP login Sopian Lalu Imagery Anda: *{$code}*. Berlaku 5 menit. Jangan bagikan kode ini.";
        $html = "Halo <strong>{$user->name}</strong>,<br><br>" .
                "Kode OTP login Anda adalah: <strong>{$code}</strong>.<br><br>" .
                "Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.";

        if ($channel === 'email') {
            if (empty($user->email)) return false;
            $this->email(new \App\Mail\AlertMail($user->name, 'Kode OTP Login', $html, $code), $user->email, 'auth.otp');
            return true;
        }

        if ($channel === 'whatsapp') {
            return $this->whatsapp($phone, $message, null, $user, 'auth.otp');
        }

        return false;
    }

    /**
     * Notif login mencurigakan (wajib, hanya untuk pemilik akun, tidak spam).
     */
    public function notifySuspiciousLogin(User $user): void
    {
        $ip = request()->ip() ?: 'tidak diketahui';
        $ua = (string) request()->userAgent();
        $time = now()->format('d/m/Y H:i');
        
        $msg = "Terjadi login ke akun Anda pada {$time}.\nIP: {$ip}\nPerangkat: {$ua}\n\nJika ini bukan Anda, segera ganti kata sandi.";
        $html = "Halo <strong>{$user->name}</strong>,<br><br>" .
                "Terjadi aktivitas login ke akun Anda pada <strong>{$time}</strong>.<br><br>" .
                "<strong>Detail:</strong><br>IP: {$ip}<br>Perangkat: {$ua}<br><br>" .
                "Jika ini bukan Anda, segera ganti kata sandi dan hubungi admin.";

        if ($this->settings->emailConfigured() && $user->email) {
            $this->email(new \App\Mail\AlertMail($user->name, 'Login Mencurigakan — Sopian Lalu Imagery', $html), $user->email, 'auth.login');
        }

        if ($this->settings->whatsappConfigured() && $user->phone) {
            $this->whatsapp($user->phone, $msg, null, $user, 'auth.login');
        }
    }

    /**
     * Kirim notifikasi generik berdasarkan jenis (NotificationType).
     * Routing channel ditentukan oleh template/kategori, bukan preferensi client.
     */
    public function send(NotificationType $type, User $user, array $data = []): void
    {
        $channelOrder = $type->channelOrder();
        $emailCopy = $type->emailAsCopy();
        $message = $data['message'] ?? $type->waShortMessage($data);
        $html = $data['html'] ?? $message; // Gunakan html yang disediakan atau fallback ke plain message
        $event = $this->typeEvent($type);

        $waSent = false;

        foreach ($channelOrder as $channel) {
            if ($channel === 'whatsapp') {
                if (!empty($user->phone) && $this->whatsapp($user->phone, $message, null, $user, $event)) {
                    $waSent = true;
                }
                continue;
            }

            if ($channel === 'email' && !empty($user->email)) {
                $this->email(new \App\Mail\AlertMail($user->name, $type->subject(), $html), $user->email, $event);
            }
        }

        // Email salinan utk jenis operasional penting setelah WA sukses.
        if ($waSent && $emailCopy && !empty($user->email)) {
            $this->email(new \App\Mail\AlertMail($user->name, $type->subject(), $html), $user->email, $event);
        }
    }

    private function typeEvent(NotificationType $type): string
    {
        return match ($type) {
            NotificationType::ACCOUNT_INVITE => 'auth.invite',
            NotificationType::PASSWORD_RESET, NotificationType::MAGIC_LINK => 'auth.magic_link',
            NotificationType::BOOKING_CREATED, NotificationType::BOOKING_APPROVED => 'booking.new',
            NotificationType::PROJECT_PROGRESS => 'project.updated',
            NotificationType::GALLERY_READY, NotificationType::DOWNLOAD_LINK => 'order.gallery_ready',
            NotificationType::INVOICE_CREATED => 'billing.invoice',
            NotificationType::PAYMENT_RECEIVED => 'payment.confirmed',
            NotificationType::BLOG_PUBLISHED, NotificationType::NEWSLETTER => 'message.new',
        };
    }
}
