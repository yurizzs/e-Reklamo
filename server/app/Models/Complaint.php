<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Complaint extends Model
{
    protected $fillable = [
        'user_id',
        'complainant_first_name',
        'complainant_last_name',
        'complainant_address',
        'complainant_contact',
        'driver_id',
        'category_id',
        'employee_id',
        'title',
        'description',
        'incident_date_time',
        'incident_location',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ViolationCategory::class, 'category_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class, 'complaint_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ComplaintStatusHistory::class, 'complaint_id');
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class, 'complaint_id');
    }
}
