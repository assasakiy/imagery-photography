<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Redelivery extends Model
{
    protected $fillable = ['project_id', 'user_id', 'note', 'status', 'fee', 'expires_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'fee' => 'decimal:2',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}