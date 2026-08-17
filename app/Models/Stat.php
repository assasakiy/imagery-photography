<?php

namespace App\Models;

use App\Services\StatResolver;
use Illuminate\Database\Eloquent\Model;

class Stat extends Model
{
    protected $fillable = ['label', 'value', 'suffix', 'order', 'source', 'metric'];

    protected $appends = ['resolved_value'];

    public function getResolvedValueAttribute(): ?string
    {
        if ($this->source === 'manual') {
            return $this->value;
        }

        $base = $this->source === 'auto_offset' ? $this->value : null;

        return app(StatResolver::class)->resolve($this->metric, $base);
    }
}