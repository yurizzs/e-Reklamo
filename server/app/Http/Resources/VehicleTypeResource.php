<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_name' => $this->vehicle_name,
            'description' => $this->description,
            'status' => $this->status ?? 'active',
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
            'deleted_at' => $this->deleted_at ? $this->deleted_at->toISOString() : null,
        ];
    }
}
