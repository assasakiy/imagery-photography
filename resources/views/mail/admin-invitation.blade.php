<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Admin</title>
</head>
<body style="margin:0;padding:0;background:#18181b;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:#27272a;border-radius:16px;padding:32px;color:#fafafa;">
            <p style="margin:0 0 16px;font-size:15px;">Halo <strong>{{ $name }}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#d4d4d8;">
                Anda telah diundang menjadi <strong>Admin</strong> di Sopian Lalu Imagery.
                Gunakan kredensial berikut untuk masuk ke dashboard:
            </p>
            <div style="background:#18181b;border-radius:12px;padding:16px 20px;margin:16px 0;font-size:14px;">
                <p style="margin:0 0 8px;"><strong>Email:</strong> <span style="color:#38bdf8;">{{ $email }}</span></p>
                <p style="margin:0;"><strong>Kata sandi:</strong> <span style="color:#fbbf24;">{{ $password }}</span></p>
            </div>
            <a href="{{ $loginUrl }}" style="display:inline-block;background:#38bdf8;color:#18181b;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;">
                Buka Dashboard
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#71717a;">Segera ganti kata sandi setelah masuk.</p>
        </div>
    </div>
</body>
</html>
