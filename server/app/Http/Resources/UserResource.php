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
        $roleValue = is_object($this->role) && isset($this->role->value) 
            ? $this->role->value 
            : (string) $this->role;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'avatar' => $this->avatar,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix_1name' => $this->suffix_1name ?? $this->suffix_name ?? null,
            'suffix_name' => $this->suffix_name ?? $this->suffix_1name ?? null,
            'position' => $this->position ?? null,
            'name' => trim("{$this->first_name} {$this->last_name}"),
            'email' => $this->email,
            'username' => $this->username,
            'phone' => $this->phone,
            'role' => $roleValue,
            'theme' => $this->theme ?? 'system',
            'created_at' => $this->created_at ? $this->created_at->toDateTimeString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toDateTimeString() : null,
            'deleted_at' => $this->deleted_at ? $this->deleted_at->toDateTimeString() : null,
        ];
    }
}
