<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tidak Ada Koneksi — {{ $siteName }}</title>
    <link rel="icon" type="image/svg+xml" href="{{ $siteFavicon }}">
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;font-family:'Instrument Sans',Arial,sans-serif;color:#fafafa;">
    <div style="max-width:380px;padding:24px;text-align:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b08d57" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 20px;display:block;"><path d="M2 12h6"/><path d="M22 12h-6"/><path d="M12 2v2"/><path d="M12 8v2"/><path d="M12 14v2"/><path d="M12 20v2"/><path d="m19 9-3 3 3 3"/><path d="m5 15 3-3-3-3"/></svg>
        <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;">Tidak Ada Koneksi</h1>
        <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 24px;">
            Anda sedang offline. Dashboard akan tersedia kembali setelah koneksi internet pulih.
        </p>
        <button onclick="location.reload()" style="background:#b08d57;color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;">
            Coba Lagi
        </button>
    </div>
</body>
</html>
