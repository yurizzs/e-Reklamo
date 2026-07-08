<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ViolationCategory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_name',
        'description',
        'penalty_amount',
    ];
}
