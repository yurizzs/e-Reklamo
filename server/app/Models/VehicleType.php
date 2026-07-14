<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleType extends Model
{
    protected $fillable = [
        'vehicle_name',
        'description',
        'status',
    ];

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class, 'vehicle_id');
    }
}
