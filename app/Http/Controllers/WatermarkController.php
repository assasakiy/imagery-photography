<?php

namespace App\Http\Controllers;

use App\Services\WatermarkService;

class WatermarkController extends Controller
{
    public function show(string $hash, WatermarkService $watermark)
    {
        return $watermark->serve($hash);
    }
}
