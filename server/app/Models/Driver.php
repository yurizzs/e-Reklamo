<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Driver extends Model
{
    protected $fillable = [
        'slug',
        'avatar',
        'first_name',
        'middle_name',
        'last_name',
        'suffix_1name',
        'plate_number',
        'vehicle_id',
        'address',
    ];

    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'driver_id');
    }

    protected static function booted()
    {
        static::creating(function ($driver) {
            $fullName = trim("{$driver->first_name} {$driver->last_name}");
            $driver->slug = self::generateUniqueSlug($fullName);
        });

        static::updating(function ($driver) {
            if ($driver->isDirty('first_name') || $driver->isDirty('last_name')) {
                $fullName = trim("{$driver->first_name} {$driver->last_name}");
                $driver->slug = self::generateUniqueSlug($fullName, $driver->id);
            }
        });
    }

    protected static function generateUniqueSlug($name, $ignoreId = null)
    {
        $slug = Str::slug($name);
        $original = $slug;
        $count = 1;

        while (self::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $original . '-' . $count++;
        }

        return $slug;
    }
}
