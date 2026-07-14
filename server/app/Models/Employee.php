<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'slug',
        'first_name',
        'middle_name',
        'last_name',
        'suffix_name',
        'position',
        'role',
        'avatar',
        'phone',
        'email',
        'username',
        'password',
        'theme',
    ];

    protected $hidden = [
        'password',
    ];

    public function operatorSchedules(): HasMany
    {
        return $this->hasMany(OperatorSchedule::class, 'employee_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'employee_id');
    }

    protected static function booted()
    {
        static::creating(function ($employee) {
            $fullName = trim("{$employee->first_name} {$employee->last_name}");
            $employee->slug = self::generateUniqueSlug($fullName);
        });

        static::updating(function ($employee) {
            if ($employee->isDirty('first_name') || $employee->isDirty('last_name')) {
                $fullName = trim("{$employee->first_name} {$employee->last_name}");
                $employee->slug = self::generateUniqueSlug($fullName, $employee->id);
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
