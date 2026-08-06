<?php

namespace App\Models;

use App\Support\SoftDeletesWithWho;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use SoftDeletesWithWho;

    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'company', 'notes',
        'deleted_by_id', 'deleted_by_name', 'delete_reason',
    ];

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function accessTokens()
    {
        return $this->hasMany(ClientAccessToken::class);
    }
}