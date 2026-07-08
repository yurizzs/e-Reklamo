<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory(10)->create();

        // Ensure a stable admin account exists for local access
        \App\Models\User::updateOrCreate(
            ['username' => 'admin'],
            [
                'slug' => \Illuminate\Support\Str::slug('Administrator'),
                'first_name' => 'Administrator',
                'last_name' => 'Admin',
                'email' => 'admin@example.com',
                'username' => 'admin',
                'phone' => null,
                'role' => \App\Enums\UserRole::ADMIN,
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );
    }
}
