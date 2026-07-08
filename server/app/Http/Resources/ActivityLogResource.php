<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'activity' => $this->activity,
            'timestamp' => $this->timestamp?->toDateTimeString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user?->id,
                    'name' => trim("{$this->user?->first_name} {$this->user?->last_name}"),
                    'username' => $this->user?->username,
                    'role' => $this->user?->role,
                ];
            }),
        ];
    }
}

