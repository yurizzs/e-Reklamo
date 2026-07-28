<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roles = [UserRole::OPERATOR, UserRole::ADMIN];

        $firstName = fake()->firstName();
        $middleName = fake()->firstName();
        $lastName = fake()->lastName();
        $suffixName = fake()->suffix();
        $fullName = "$firstName $middleName $lastName";

        return [
            'slug' => Str::slug($fullName),
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'suffix_name' => $suffixName,
            'position' => fake()->randomElement(['TMU Administrator','TMU Operator',]),
            'email' => fake()->unique()->safeEmail(),
            'username' => fake()->unique()->userName(),
            'email_verified_at' => now(),
            'phone' => '+639' . fake()->numerify('#########'),
            'role' => fake()->randomElement($roles),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
