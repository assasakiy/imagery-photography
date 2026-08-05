<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectText }}</title>
</head>
<body style="margin:0;padding:0;background:#18181b;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:#27272a;border-radius:16px;padding:32px;color:#fafafa;">
            <p style="margin:0 0 16px;font-size:15px;">Halo <strong>{{ $name }}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#d4d4d8;white-space:pre-line;">{{ $message }}</p>
            @if($code)
                <div style="background:#18181b;border-radius:12px;padding:16px 20px;margin:16px 0;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:8px;color:#38bdf8;">{{ $code }}</p>
                </div>
            @endif
            <p style="margin:24px 0 0;font-size:12px;color:#71717a;">Sopian Lalu Imagery</p>
        </div>
    </div>
</body>
</html>
