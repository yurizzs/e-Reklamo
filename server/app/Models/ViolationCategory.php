<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Relations\HasMany;

class ViolationCategory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_name',
        'description',
        'penalty_amount',
    ];

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'category_id');
    }
}
