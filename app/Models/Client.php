<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'phone', 'company', 'notes'];

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
