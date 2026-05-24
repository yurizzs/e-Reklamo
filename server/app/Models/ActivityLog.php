<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'activity',
        'timestamp',
    ];

    protected function casts(): array
    {
        return [
            'timestamp' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

