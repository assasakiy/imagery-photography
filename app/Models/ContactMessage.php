<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = ['user_id', 'project_id', 'reply_to_id', 'name', 'email', 'phone', 'message', 'attachment_url', 'sender_type', 'type', 'event_date', 'package', 'read_at', 'status'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function replyTo()
    {
        return $this->belongsTo(ContactMessage::class, 'reply_to_id');
    }
}