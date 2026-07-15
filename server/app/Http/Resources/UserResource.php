<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'avatar' => $this->avatar,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix_1name' => $this->suffix_1name,
            'name' => trim("{$this->first_name} {$this->last_name}"),
            'email' => $this->email,
            'username' => $this->username,
            'phone' => $this->phone,
            'role' => $this->role,
            'theme' => $this->theme,
            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
            'deleted_at' => $this->deleted_at ? $this->deleted_at->toDateTimeString() : null,
        ];
    }
}
