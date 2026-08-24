<?php

namespace App\Mail;

use App\Services\RuntimeSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $subjectText,
        public string $body,
        public ?string $code = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectText);
    }

    public function content(): Content
    {
        $settings = app(RuntimeSettings::class);

        return new Content(
            html: 'mail.alert',
            with: [
                'siteName'   => $settings->siteName(),
                'siteLogo'   => $settings->siteLogo(),
                'siteTagline' => $settings->siteTagline(),
                'brandColor'  => $settings->brandColor(),
            ],
        );
    }
}
