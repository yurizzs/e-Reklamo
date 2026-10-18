<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'announcements';

    protected $fillable = [
        'type',
        'badge_label',
        'ref_number',
        'title',
        'summary',
        'issuing_office',
        'date',
        'effective_date',
        'urgency',
        'legal_basis',
        'key_directives',
        'signatories',
        'publish_to_mobile',
        'send_push_alert',
        'created_by',
    ];

    protected $casts = [
        'key_directives' => 'array',
        'signatories' => 'array',
        'publish_to_mobile' => 'boolean',
        'send_push_alert' => 'boolean',
    ];

    /**
     * Format response with both camelCase and snake_case for client/mobile convenience.
     */
    public function toResponseArray(): array
    {
        return [
            'id' => (string) $this->id,
            'type' => $this->type,
            'badgeLabel' => $this->badge_label ?? strtoupper($this->type),
            'badge_label' => $this->badge_label ?? strtoupper($this->type),
            'refNumber' => $this->ref_number,
            'ref_number' => $this->ref_number,
            'title' => $this->title,
            'summary' => $this->summary,
            'issuingOffice' => $this->issuing_office,
            'issuing_office' => $this->issuing_office,
            'date' => $this->date,
            'effectiveDate' => $this->effective_date,
            'effective_date' => $this->effective_date,
            'urgency' => $this->urgency,
            'legalBasis' => $this->legal_basis,
            'legal_basis' => $this->legal_basis,
            'keyDirectives' => $this->key_directives ?? [],
            'key_directives' => $this->key_directives ?? [],
            'signatories' => $this->signatories ?? [],
            'publishToMobile' => (bool) $this->publish_to_mobile,
            'sendPushAlert' => (bool) $this->send_push_alert,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
