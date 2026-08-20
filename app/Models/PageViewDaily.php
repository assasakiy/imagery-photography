<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageViewDaily extends Model
{
    public $timestamps = false;

    protected $table = 'page_view_daily';

    protected $fillable = ['date', 'path', 'views_count', 'unique_visitors'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}