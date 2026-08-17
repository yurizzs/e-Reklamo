<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ComplaintResource extends JsonResource
{
    private function formatName($person): string
    {
        if (!$person) {
            return '';
        }

        return trim(implode(', ', array_filter([
            $person->last_name,
            $person->first_name,
        ])));
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $manualComplainantName = trim(implode(', ', array_filter([
            $this->complainant_last_name,
            $this->complainant_first_name,
        ])));

        return [
            'id' => $this->id,
            'complainant' => [
                'first_name' => $this->complainant_first_name,
                'last_name' => $this->complainant_last_name,
                'address' => $this->complainant_address,
                'contact_number' => $this->complainant_contact,
                'name' => $manualComplainantName ?: $this->formatName($this->user),
            ],
            'user' => [
                'id' => $this->user?->id,
                'first_name' => $this->user?->first_name,
                'last_name' => $this->user?->last_name,
                'name' => $this->formatName($this->user),
                'phone' => $this->user?->phone,
                'address' => $this->user?->address,
            ],
            'driver' => [
                'id' => $this->driver?->id,
                'first_name' => $this->driver?->first_name,
                'last_name' => $this->driver?->last_name,
                'name' => $this->formatName($this->driver),
                'plate_number' => $this->driver?->plate_number,
            ],
            'category' => [
                'id' => $this->category?->id,
                'category_name' => $this->category?->category_name,
            ],
            'title' => $this->title,
            'description' => $this->description,
            'incident_location' => $this->incident_location,
            'status' => $this->status,
            'incident_date_time' => $this->incident_date_time,
            'created_at' => $this->created_at?->toIso8601String(),
            'evidence' => $this->whenLoaded('evidence', function () {
                return $this->evidence->map(function ($item) {
                    $url = asset('storage/' . ltrim($item->file_path, '/'));
                    return [
                        'id' => $item->id,
                        'file_path' => $item->file_path,
                        'file_url' => $url,
                        'file_type' => $item->file_type,
                    ];
                });
            }, []),
            'status_histories' => $this->whenLoaded('statusHistories', function () {
                return $this->statusHistories->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'old_status' => $item->old_status,
                        'new_status' => $item->new_status,
                        'remarks' => $item->remarks,
                        'changed_by' => $item->changed_by,
                        'created_at' => $item->created_at?->toIso8601String(),
                    ];
                });
            }, []),
        ];
    }
}

