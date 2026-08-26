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
        'message.new' => 'Pesan form kontak publik',
        'review.new' => 'Review baru masuk',
        'project.created' => 'Proyek baru dibuat',
        'project.updated' => 'Proyek diperbarui',
        'project.status_changed' => 'Status proyek berubah',
        'payment.submitted' => 'Pembayaran dikirim klien',
        'payment.confirmed' => 'Pembayaran dikonfirmasi',
        'payment.rejected' => 'Pembayaran ditolak',
        'team.invited' => 'Anggota tim diundang',
        'auth.otp' => 'OTP login',
        'auth.login' => 'Login mencurigakan',
        'auth.invite' => 'Aktivasi akun klien',
        'auth.set_password' => 'Buat kata sandi',
        'auth.magic_link' => 'Tautan masuk / aktivasi',
        'order.gallery_ready' => 'Galeri siap diunduh',
        'billing.invoice' => 'Invoice diterbitkan',
        'redelivery.requested' => 'Permintaan unduh ulang',
        'booking.accepted' => 'Booking disetujui & dijadwalkan',
        'project.advanced' => 'Pesanan melaju ke tahap baru',
        'redelivery.reviewed' => 'Unduh ulang disetujui/ditolak',
        'client.message.new' => 'Pesan baru dari klien',
        'client.message.replied' => 'Admin membalas pesan klien',
        'message.admin_replied' => 'Admin lain membalas pesan',
    ];

    /**
     * Event yang WAJIB dikirim ke pemilik akun (keamanan akun).
     * Tidak bisa dimatikan oleh admin maupun user.
     */
    public const MANDATORY_EVENTS = ['auth.otp', 'auth.login', 'auth.magic_link', 'auth.invite', 'auth.set_password'];

    /**
     * Event yang berlaku untuk tiap kanal.
     */
    public const CHANNEL_EVENTS = [
        'inapp' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited', 'auth.login',
            'redelivery.requested',
            'booking.accepted', 'project.advanced',
            'redelivery.reviewed',
            'client.message.new',
            'client.message.replied',
            'message.admin_replied',
        ],
        'email' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited', 'auth.otp', 'auth.login',
            'auth.invite', 'auth.set_password', 'auth.magic_link', 'order.gallery_ready', 'billing.invoice',
            'redelivery.requested',
            'booking.accepted', 'project.advanced',
            'redelivery.reviewed',
            'client.message.new',
            'client.message.replied',
        ],
        'whatsapp' => [
            'booking.new', 'message.new', 'review.new',
            'project.status_changed', 'payment.submitted', 'payment.confirmed',
            'auth.otp', 'auth.login',
            'auth.invite', 'auth.set_password', 'auth.magic_link', 'order.gallery_ready', 'billing.invoice',
            'redelivery.requested',
            'booking.accepted', 'project.advanced',
            'redelivery.reviewed',
            'client.message.new',
            'client.message.replied',
        ],
        'webhook' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited',
            'redelivery.requested',
            'booking.accepted', 'project.advanced',
            'redelivery.reviewed',
            'client.message.new',
        ],
        'push' => [
            'booking.new', 'message.new', 'review.new',
            'project.created', 'project.updated', 'project.status_changed',
            'payment.submitted', 'payment.confirmed',
            'payment.rejected', 'team.invited',
            'redelivery.requested',
            'booking.accepted', 'project.advanced',
            'redelivery.reviewed',
            'client.message.new',
            'client.message.replied',
            'message.admin_replied',
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

        // Normalisasi nomor telepon: hapus karakter non-angka (kecuali +), ubah awalan 0 menjadi 62, hilangkan +62 menjadi 62.
        // Fonnte dan sebagian besar WA Gateway Indonesia lebih stabil menerima angka 62 atau 08. 
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
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
     * Kirim Web Push notification ke semua device user.
     */
    public function webPush(User $user, string $title, string $message, ?string $url = null, ?string $event = null): void
    {
        if ($event && !$this->channelAllowed($event, 'push', $user)) {
            return;
        }

        if (!$user->notif_inapp) {
            return;
        }

        try {
            $subscriptions = $user->pushSubscriptions()->active()->get();

            if ($subscriptions->isEmpty()) {
                return;
            }

            $payload = json_encode([
                'title' => $title,
                'body'  => $message,
                'tag'   => $event ?? 'imagery-push',
                'data'  => ['url' => $url ?? '/dashboard'],
            ]);

            $auth = [
                'vapid' => [
                    'subject'  => env('VAPID_SUBJECT', 'mailto:admin@imagery.assasakiymedia.id'),
                    'publicKey' => env('VAPID_PUBLIC_KEY'),
                    'privateKey' => env('VAPID_PRIVATE_KEY'),
                ],
            ];

            $webPush = new \Minishlink\WebPush\WebPush($auth, [], 10);

            foreach ($subscriptions as $sub) {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding,
                ]);

                $report = $webPush->sendOneNotification($subscription, $payload);

                if (!$report->isSuccess()) {
                    if ($report->isSubscriptionExpired()) {
                        $sub->update(['is_active' => false]);
                    }
                    Log::warning('Web push failed', [
                        'user_id' => $user->id,
                        'endpoint' => $sub->endpoint,
                        'reason' => $report->getReason(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Web push error', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Notifikasi pembayaran dikonfirmasi/diterima.
     */
    public function notifyPaymentSubmitted(\App\Models\Payment $payment): void
    {
        $project = $payment->project;
        if (!$project) return;

        $clientName = $project->user ? $project->user->name : 'Klien';
        $title = 'Pembayaran Baru';
        $msg = "{$clientName} telah melakukan pembayaran sebesar Rp " . number_format($payment->amount, 0, ',', '.') . " untuk pesanan {$project->name}. Menunggu konfirmasi Anda.";
        
        $admins = \App\Models\User::role(['admin', 'owner'])->get();
        foreach ($admins as $admin) {
            $this->inApp($admin, $title, $msg, '/dashboard/payments', 'payment.submitted');
        }
    }

    public function notifyPaymentConfirmed(\App\Models\Payment $payment): void
    {
        $project = $payment->project;
        if (!$project || !$project->user) return;

        $msg = "Pembayaran Anda sebesar *Rp " . number_format($payment->amount, 0, ',', '.') . "* untuk pesanan *{$project->name}* telah kami terima. Terima kasih!";
        $html = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                "Pembayaran sebesar <strong>Rp " . number_format($payment->amount, 0, ',', '.') . "</strong> untuk pesanan <strong>{$project->name}</strong> telah kami terima.<br><br>" .
                "Terima kasih atas kepercayaannya!";

        if (!empty($project->user->phone)) {
            $this->whatsapp($project->user->phone, $msg, null, $project->user, 'payment.confirmed');
        }
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Pembayaran Diterima', $html), $project->user->email, 'payment.confirmed');
        $this->inApp($project->user, 'Pembayaran Diterima', $msg, $this->orderUrl($project), 'payment.confirmed');
    }

    public function notifyBookingAccepted(\App\Models\Booking $booking, \App\Models\Project $project): void
    {
        if (!$booking->user) return;
        
        $msg = "Kabar baik! Booking Anda *({$booking->booking_no})* telah kami setujui dan dijadwalkan sebagai pesanan *{$project->name}*. Silakan cek detailnya.";
        $html = "Halo <strong>{$booking->user->name}</strong>,<br><br>" .
                "Booking Anda dengan nomor <strong>{$booking->booking_no}</strong> telah disetujui dan resmi dijadwalkan (Pesanan: {$project->name}).<br><br>" .
                "Tim kami akan segera memprosesnya. Silakan cek detail pesanan Anda pada sistem.";
                
        if (!empty($booking->user->phone)) {
            $this->whatsapp($booking->user->phone, $msg, null, $booking->user, 'booking.accepted');
        }
        $this->email(new \App\Mail\AlertMail($booking->user->name, 'Booking Disetujui & Dijadwalkan', $html), $booking->user->email, 'booking.accepted');
        $this->inApp($booking->user, 'Booking Dijadwalkan', $msg, $this->orderUrl($project), 'booking.accepted');
    }

    public function notifyPaymentRejected(\App\Models\Payment $payment): void
    {
        $project = $payment->project;
        if (!$project || !$project->user) return;

        $msg = "Mohon maaf, pembayaran Anda sebesar *Rp " . number_format($payment->amount, 0, ',', '.') . "* untuk pesanan *{$project->name}* ditolak.";
        $html = "Halo <strong>{$project->user->name}</strong>,<br><br>" .
                "Mohon maaf, pembayaran sebesar <strong>Rp " . number_format($payment->amount, 0, ',', '.') . "</strong> untuk pesanan <strong>{$project->name}</strong> telah ditolak oleh admin.<br><br>" .
                "Silakan periksa kembali tagihan Anda dan unggah ulang bukti pembayaran yang benar.";

        if (!empty($project->user->phone)) {
            $this->whatsapp($project->user->phone, $msg, null, $project->user, 'payment.rejected');
        }
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Pembayaran Ditolak', $html), $project->user->email, 'payment.rejected');
        $this->inApp($project->user, 'Pembayaran Ditolak', $msg, '/dashboard/client-invoices', 'payment.rejected');
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
                "<a href='" . url($this->orderUrl($project)) . "' style='background: #97794b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Lihat Pratinjau</a>";

        if (!empty($project->user->phone)) {
            $this->whatsapp($project->user->phone, $msg, null, $project->user, 'order.gallery_ready');
        }
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Hasil Pesanan Siap', $html), $project->user->email, 'order.gallery_ready');
        $this->inApp($project->user, 'Hasil Pesanan Siap', $msg, $this->orderUrl($project), 'order.gallery_ready');
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

        if (!empty($project->user->phone)) {
            $this->whatsapp($project->user->phone, $msg, null, $project->user, 'billing.invoice');
        }
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Invoice Baru', $html), $project->user->email, 'billing.invoice');
        $this->inApp($project->user, 'Invoice Baru', $msg, '/dashboard/client-invoices', 'billing.invoice');
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
                     "<a href='" . url($this->orderUrl($project)) . "' style='background: #97794b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Lihat Detail</a>";

        if (!empty($project->user->phone)) {
            $this->whatsapp($project->user->phone, $waMsg, null, $project->user, 'project.status_changed');
        }
        $this->email(new \App\Mail\AlertMail($project->user->name, 'Status Pesanan Diperbarui', $emailHtml), $project->user->email, 'project.status_changed');
        $this->inApp($project->user, 'Status Pesanan Diperbarui', $message, $this->orderUrl($project), 'project.status_changed');
    }

    /**
     * Kirim notifikasi in-app (database) ke satu atau banyak user.
     */
    public function inApp(iterable|User $users, string $title, string $message, ?string $url = null, ?string $event = null): void
    {
        if ($event && !$this->eventEnabled($event, 'inapp')) {
            return;
        }

        if ($users instanceof User) {
            $users = collect([$users]);
        }

        foreach ($users as $user) {
            if (!$user->notif_inapp) {
                continue;
            }

            $user->notify(new InAppNotification($title, $message, $url, $event));

            // Web push ke device user
            $this->webPush($user, $title, $message, $url, $event);
        }
    }

    /**
     * Send a notification to every admin/owner user.
     */
    public function toAdmins(string $title, string $message, ?string $url = null, ?string $event = null): void
    {
        $this->inApp(User::role(['admin', 'owner'])->get(), $title, $message, $url, $event);
    }

    /**
     * URL halaman pesanan di dashboard klien (pakai nomor pesanan bila ada).
     */
    public function orderUrl(\App\Models\Project $project): string
    {
        return '/dashboard/preview/' . ($project->order_no ?: $project->id);
    }

    /**
     * Kanal pengiriman OTP untuk seorang user.
     * Jika identifier (input dari user) eksplisit diberikan, paksa channel tersebut
     * asalkan channel-nya aktif di konfigurasi admin. Jika tidak, fallback ke preferensi user.
     */
    public function otpChannel(User $user, ?string $identifier = null): ?string
    {
        $email = $this->settings->channelAvailable('email');
        $wa = $this->settings->channelAvailable('whatsapp');

        if ($identifier) {
            $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);
            if ($isEmail) {
                return $email ? 'email' : null;
            }
            if (preg_match('/^[0-9+]+$/', $identifier)) {
                return $wa ? 'whatsapp' : null;
            }
        }

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
     * Dapat menyertakan link akses (optional) dan konteks pesan ('login', 'subscribe', 'recovery').
     */
    public function sendOtp(User $user, string $phone, string $code, ?string $identifier = null, ?string $linkUrl = null, string $context = 'login'): bool
    {
        $channel = $this->otpChannel($user, $identifier);
        
        if (!$channel) {
            return false;
        }

        $subject = match ($context) {
            'subscribe' => 'Kode Aktivasi Akun',
            'recovery'  => 'Kode Reset Kata Sandi',
            default     => 'Kode OTP Login',
        };

        $actionTxt = match ($context) {
            'subscribe' => "mengaktifkan akun Anda",
            'recovery'  => "mereset kata sandi Anda",
            default     => "masuk ke akun Anda",
        };

        $siteName = $this->settings->siteName();
        $message = "Kode OTP {$siteName} Anda: *{$code}*. Gunakan kode ini untuk {$actionTxt}. Berlaku 5 menit. Jangan bagikan kode ini.";
        $html = "Halo <strong>{$user->name}</strong>,<br><br>" .
                "Kode OTP Anda adalah: <strong>{$code}</strong>.<br><br>" .
                "Gunakan kode ini untuk {$actionTxt}. Kode berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.";

        if ($linkUrl) {
            $linkAction = match ($context) {
                'subscribe' => "Atau klik link berikut untuk langsung aktivasi",
                'recovery'  => "Atau klik link berikut untuk mereset kata sandi",
                default     => "Atau klik link berikut untuk masuk otomatis",
            };

            $message .= "\n\n{$linkAction}:\n{$linkUrl}";
            $html .= "<br><br><strong>{$linkAction}:</strong><br><a href=\"{$linkUrl}\">{$linkUrl}</a>";
        }

        if ($channel === 'email') {
            if (empty($user->email)) return false;
            $this->email(new \App\Mail\AlertMail($user->name, $subject, $html, $code), $user->email, 'auth.otp');
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
            $this->email(new \App\Mail\AlertMail($user->name, 'Login Mencurigakan — ' . $this->settings->siteName(), $html), $user->email, 'auth.login');
        }

        if ($this->settings->whatsappConfigured() && $user->phone) {
            $this->whatsapp($user->phone, $msg, null, $user, 'auth.login');
        }
    }

    /**
     * Kirim notifikasi generik berdasarkan jenis (NotificationType).
     * Routing channel ditentukan oleh template/kategori, bukan preferensi client.
     * Jika ada channel_override, hanya kirim via channel tersebut (asalkan aktif).
     */
    public function send(NotificationType $type, User $user, array $data = []): void
    {
        $channelOrder = $type->channelOrder();
        $emailCopy = $type->emailAsCopy();
        $message = $data['message'] ?? $type->waShortMessage($data);
        $html = $data['html'] ?? $message; // Gunakan html yang disediakan atau fallback ke plain message
        $event = $this->typeEvent($type);

        // Jika dipaksa spesifik channel via parameter $data
        if (!empty($data['channel_override'])) {
            $forceChannel = $data['channel_override'];
            if ($forceChannel === 'whatsapp' && !empty($user->phone)) {
                $this->whatsapp($user->phone, $message, null, $user, $event);
            } elseif ($forceChannel === 'email' && !empty($user->email)) {
                $this->email(new \App\Mail\AlertMail($user->name, $type->subject(), $html), $user->email, $event);
            }
            return; // Selesai, jangan jalankan logika fallback default.
        }

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

        // Web push
        $this->webPush($user, $type->subject(), $message, $data['url'] ?? '/dashboard', $event);
    }

    private function typeEvent(NotificationType $type): string
    {
        return match ($type) {
            NotificationType::ACCOUNT_INVITE => 'auth.invite',
            NotificationType::SET_PASSWORD => 'auth.set_password',
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
