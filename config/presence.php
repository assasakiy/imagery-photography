<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Online Threshold (seconds)
    |--------------------------------------------------------------------------
    |
    | Jarak waktu maksimum (dalam detik) dari `last_seen_at` agar user
    | dianggap "sedang online". Default: 180 detik (3 menit).
    |
    */

    'online_threshold_seconds' => (int) env('PRESENCE_ONLINE_THRESHOLD_SECONDS', 180),

];
