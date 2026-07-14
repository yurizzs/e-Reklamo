<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatorSchedule extends Model
{
    protected $fillable = [
        'employee_id',
        'schedule_date',
        'shift_start',
        'shift_end',
        'shift_type',
        'status',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
