<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
                'name' => $manualComplainantName ?: $this->formatName($this->user),
            ],
            'user' => [
                'id' => $this->user?->id,
                'first_name' => $this->user?->first_name,
                'last_name' => $this->user?->last_name,
                'name' => $this->formatName($this->user),
            ],
            'driver' => [
                'id' => $this->driver?->id,
                'first_name' => $this->driver?->first_name,
                'last_name' => $this->driver?->last_name,
                'name' => $this->formatName($this->driver),
            ],
            'category' => [
                'id' => $this->category?->id,
                'category_name' => $this->category?->category_name,
            ],
            'title' => $this->title,
            'status' => $this->status,
            'incident_date_time' => $this->incident_date_time,
        ];
    }
}
