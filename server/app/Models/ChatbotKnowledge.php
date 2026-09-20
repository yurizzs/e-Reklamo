<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotKnowledge extends Model
{
    protected $table = 'chatbot_knowledge';

    protected $fillable = [
        'title',
        'category',
        'keywords',
        'content',
        'fine_amount',
        'ordinance_ref',
        'is_active',
        'keyword',
        'response',
    ];

    protected $casts = [
        'fine_amount' => 'float',
        'is_active' => 'boolean',
    ];
}
