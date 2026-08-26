<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectText }}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                {{-- Outer wrapper --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

                    {{-- Logo + Site Name --}}
                    <tr>
                        <td align="center" style="padding-bottom:28px;">
                            @if(!empty($siteLogo))
                                <img src="{{ $siteLogo }}" alt="{{ $siteName }}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:12px;object-fit:cover;" />
                            @else
                                <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:{{ $brandColor }};text-align:center;line-height:48px;font-size:20px;font-weight:700;color:#fff;">{{ strtoupper(substr($siteName,0,1)) }}</div>
                            @endif
                            <p style="margin:12px 0 0;font-size:14px;font-weight:600;color:#fafafa;letter-spacing:-0.01em;">{{ $siteName }}</p>
                            @if($siteTagline)
                                <p style="margin:4px 0 0;font-size:12px;color:#71717a;">{{ $siteTagline }}</p>
                            @endif
                        </td>
                    </tr>

                    {{-- Main Card --}}
                    <tr>
                        <td style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
                            {{-- Accent bar --}}
                            <div style="padding:32px;">
                                {{-- Greeting --}}
                                <p style="margin:0 0 6px;font-size:13px;color:#a1a1aa;letter-spacing:0.02em;">Halo,</p>
                                <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#fafafa;">{{ $name }}</p>

                                {{-- Divider --}}
                                <div style="height:1px;background:#27272a;margin:0 0 20px;"></div>

                                {{-- Body --}}
                                <div style="font-size:14px;line-height:1.7;color:#d4d4d8;white-space:pre-line;">{!! $body !!}</div>

                                {{-- OTP Code --}}
                                @if($code)
                                    <div style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                                        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Kode Verifikasi</p>
                                        <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:10px;color:{{ $brandColor }};">{{ $code }}</p>
                                        <p style="margin:10px 0 0;font-size:11px;color:#52525b;">Berlaku 5 menit</p>
                                    </div>
                                @endif
                            </div>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="padding:24px 0 0;">
                            @if($siteTagline)
                                <p style="margin:0 0 6px;font-size:11px;color:#52525b;font-style:italic;">"{{ $siteTagline }}"</p>
                            @endif
                            <p style="margin:0 0 4px;font-size:11px;color:#3f3f46;">
                                &copy; {{ date('Y') }} {{ $siteName }}. All rights reserved.
                            </p>
                            <p style="margin:0;">
                                <a href="{{ url('/') }}" style="font-size:11px;color:{{ $brandColor }};text-decoration:none;">{{ url('/') }}</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
