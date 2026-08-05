<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WatermarkedAsset extends Model
{
    protected $fillable = ['hash', 'source', 'mime_type', 'generated'];
}
