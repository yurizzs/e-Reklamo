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

        // Ensure an operator account exists
        $operatorUser = \App\Models\User::updateOrCreate(
            ['username' => 'operator'],
            [
                'slug' => \Illuminate\Support\Str::slug('Operator User'),
                'first_name' => 'Operator',
                'last_name' => 'User',
                'email' => 'operator@example.com',
                'username' => 'operator',
                'phone' => null,
                'role' => \App\Enums\UserRole::OPERATOR,
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        // Vehicle Types
        $tricycle = \App\Models\VehicleType::firstOrCreate(
            ['vehicle_name' => 'Tricycle'],
            ['description' => '3-wheeled vehicle', 'status' => 'active']
        );
        $jeepney = \App\Models\VehicleType::firstOrCreate(
            ['vehicle_name' => 'Jeepney'],
            ['description' => 'Philippine passenger jeepney', 'status' => 'active']
        );

        // Drivers
        $driver1 = \App\Models\Driver::firstOrCreate(
            ['plate_number' => 'ABC-123'],
            [
                'slug' => \Illuminate\Support\Str::slug('Juan Dela Cruz'),
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
                'vehicle_id' => $tricycle->id,
                'address' => 'Manila, Philippines',
            ]
        );
        $driver2 = \App\Models\Driver::firstOrCreate(
            ['plate_number' => 'XYZ-987'],
            [
                'slug' => \Illuminate\Support\Str::slug('Maria Clara'),
                'first_name' => 'Maria',
                'middle_name' => 'Santos',
                'last_name' => 'Clara',
                'vehicle_id' => $jeepney->id,
                'address' => 'Quezon City, Philippines',
            ]
        );

        // Violation Categories
        $cat1 = \App\Models\ViolationCategory::firstOrCreate(
            ['category_name' => 'Overcharging'],
            [
                'description' => 'Collecting fare higher than the approved fare matrix',
                'penalty_amount' => '500.00',
            ]
        );
        $cat2 = \App\Models\ViolationCategory::firstOrCreate(
            ['category_name' => 'Route Deviation'],
            [
                'description' => 'Operating outside the authorized franchise route',
                'penalty_amount' => '1000.00',
            ]
        );
        $cat3 = \App\Models\ViolationCategory::firstOrCreate(
            ['category_name' => 'Reckless Driving'],
            [
                'description' => 'Operating vehicle dangerously or without regard to safety',
                'penalty_amount' => '1500.00',
            ]
        );

        // Create some complaints for 2026
        \App\Models\Complaint::firstOrCreate(
            ['title' => 'Overcharged on tricycle'],
            [
                'user_id' => $operatorUser->id,
                'complainant_first_name' => 'Pedro',
                'complainant_last_name' => 'Penduko',
                'driver_id' => $driver1->id,
                'category_id' => $cat1->id,
                'description' => 'The driver charged 50 PHP instead of 20 PHP standard fare.',
                'incident_date_time' => '2026-07-10 14:30:00',
                'incident_location' => 'Espana Blvd, Manila',
                'status' => 'resolved',
            ]
        );

        \App\Models\Complaint::firstOrCreate(
            ['title' => 'Jeepney out of route'],
            [
                'user_id' => null,
                'complainant_first_name' => 'Juana',
                'complainant_last_name' => 'Change',
                'driver_id' => $driver2->id,
                'category_id' => $cat2->id,
                'description' => 'The jeepney deviated to avoid traffic, leaving passengers far from target.',
                'incident_date_time' => '2026-07-12 09:15:00',
                'incident_location' => 'Quezon Ave, QC',
                'status' => 'pending',
            ]
        );

        \App\Models\Complaint::firstOrCreate(
            ['title' => 'Dangerous swerving'],
            [
                'user_id' => $operatorUser->id,
                'complainant_first_name' => 'Pedro',
                'complainant_last_name' => 'Penduko',
                'driver_id' => $driver1->id,
                'category_id' => $cat3->id,
                'description' => 'Driver was driving extremely fast and swerving.',
                'incident_date_time' => '2026-06-05 18:00:00',
                'incident_location' => 'Lerma St, Manila',
                'status' => 'resolved',
            ]
        );

        // Create some complaints for 2025
        \App\Models\Complaint::firstOrCreate(
            ['title' => 'Last year overcharging'],
            [
                'user_id' => null,
                'complainant_first_name' => 'Jose',
                'complainant_last_name' => 'Rizal',
                'driver_id' => $driver2->id,
                'category_id' => $cat1->id,
                'description' => 'Overcharged during Christmas rush.',
                'incident_date_time' => '2025-12-25 10:00:00',
                'incident_location' => 'Intramuros, Manila',
                'status' => 'resolved',
            ]
        );
    }
}
