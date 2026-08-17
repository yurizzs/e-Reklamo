<?php

namespace Database\Seeders;

use App\Models\Complaint;
use App\Models\Driver;
use App\Models\Employee;
use App\Models\User;
use App\Models\VehicleType;
use App\Models\ViolationCategory;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ComplaintSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure Vehicle Types exist
        $tricycle = VehicleType::firstOrCreate(
            ['vehicle_name' => 'Tricycle'],
            ['description' => '3-wheeled passenger motorized vehicle', 'status' => 'active']
        );
        $jeepney = VehicleType::firstOrCreate(
            ['vehicle_name' => 'Jeepney'],
            ['description' => 'Philippine public utility jeepney (PUJ)', 'status' => 'active']
        );
        $bus = VehicleType::firstOrCreate(
            ['vehicle_name' => 'Public Bus'],
            ['description' => 'Public utility city bus', 'status' => 'active']
        );

        // 2. Ensure Violation Categories exist
        $catOvercharging = ViolationCategory::firstOrCreate(
            ['category_name' => 'Overcharging'],
            [
                'description' => 'Demanding fare exceeding the authorized fare matrix.',
                'penalty_amount' => '500.00',
            ]
        );

        $catRouteDeviation = ViolationCategory::firstOrCreate(
            ['category_name' => 'Route Deviation'],
            [
                'description' => 'Operating outside the authorized line or franchise route.',
                'penalty_amount' => '1000.00',
            ]
        );

        $catReckless = ViolationCategory::firstOrCreate(
            ['category_name' => 'Reckless Driving'],
            [
                'description' => 'Operating a vehicle dangerously endangering passengers and pedestrians.',
                'penalty_amount' => '1500.00',
            ]
        );

        $catRefusal = ViolationCategory::firstOrCreate(
            ['category_name' => 'Refusal to Convey Passengers'],
            [
                'description' => 'Refusing to board passengers without valid justification.',
                'penalty_amount' => '750.00',
            ]
        );

        $catArrogance = ViolationCategory::firstOrCreate(
            ['category_name' => 'Arrogant & Discourteous Driver'],
            [
                'description' => 'Disrespectful behavior, verbal abuse, or harassment toward passengers.',
                'penalty_amount' => '500.00',
            ]
        );

        // 3. Ensure Drivers exist
        $driver1 = Driver::firstOrCreate(
            ['plate_number' => 'ABC-123'],
            [
                'slug' => Str::slug('Juan Dela Cruz'),
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
                'vehicle_id' => $tricycle->id,
                'address' => 'Barangay Central, Manila',
            ]
        );

        $driver2 = Driver::firstOrCreate(
            ['plate_number' => 'XYZ-987'],
            [
                'slug' => Str::slug('Maria Clara'),
                'first_name' => 'Maria',
                'middle_name' => 'Santos',
                'last_name' => 'Clara',
                'vehicle_id' => $jeepney->id,
                'address' => 'Diliman, Quezon City',
            ]
        );

        $driver3 = Driver::firstOrCreate(
            ['plate_number' => 'TRK-456'],
            [
                'slug' => Str::slug('Pedro Penduko'),
                'first_name' => 'Pedro',
                'middle_name' => 'Reyes',
                'last_name' => 'Penduko',
                'vehicle_id' => $tricycle->id,
                'address' => 'Sampaloc, Manila',
            ]
        );

        $driver4 = Driver::firstOrCreate(
            ['plate_number' => 'JEP-777'],
            [
                'slug' => Str::slug('Cardo Dalisay'),
                'first_name' => 'Cardo',
                'middle_name' => 'Vargas',
                'last_name' => 'Dalisay',
                'vehicle_id' => $jeepney->id,
                'address' => 'Cubao, Quezon City',
            ]
        );

        $driver5 = Driver::firstOrCreate(
            ['plate_number' => 'BUS-2026'],
            [
                'slug' => Str::slug('Arnel Pineda'),
                'first_name' => 'Arnel',
                'middle_name' => 'Gomez',
                'last_name' => 'Pineda',
                'vehicle_id' => $bus->id,
                'address' => 'EDSA, Pasay City',
            ]
        );

        // Fetch users & staff for assignment
        $registeredUser = User::first();
        $staffUser = Employee::where('username', 'staff')->first() ?? Employee::first();

        // 4. Sample Complaints Dataset
        $complaintsData = [
            [
                'title' => 'Excessive Tricycle Fare Charge',
                'complainant_first_name' => 'Jose',
                'complainant_last_name' => 'Rizal',
                'complainant_address' => 'Bagumbayan St, Manila',
                'complainant_contact' => '09171234567',
                'driver_id' => $driver1->id,
                'category_id' => $catOvercharging->id,
                'description' => 'Driver demanded PHP 100 for a short 1km ride instead of the official PHP 25 matrix rate.',
                'incident_date_time' => '2026-08-15 08:30:00',
                'incident_location' => 'Espana Blvd cor. Moret St, Sampaloc, Manila',
                'status' => 'unsettled',
                'user_id' => $registeredUser?->id,
            ],
            [
                'title' => 'Tricycle Overcharging Late Night',
                'complainant_first_name' => 'Andres',
                'complainant_last_name' => 'Bonifacio',
                'complainant_address' => 'Tondo, Manila',
                'complainant_contact' => '09189876543',
                'driver_id' => $driver1->id,
                'category_id' => $catOvercharging->id,
                'description' => 'Second incident involving ABC-123. Driver refused to proceed unless given double fare.',
                'incident_date_time' => '2026-08-16 22:15:00',
                'incident_location' => 'Morayta St, Sampaloc, Manila',
                'status' => 'unsettled',
                'user_id' => null,
            ],
            [
                'title' => 'Jeepney Shortcutting Route',
                'complainant_first_name' => 'Melchora',
                'complainant_last_name' => 'Aquino',
                'complainant_address' => 'Tandang Sora, Quezon City',
                'complainant_contact' => '09223334444',
                'driver_id' => $driver2->id,
                'category_id' => $catRouteDeviation->id,
                'description' => 'Jeepney turned around midway and forced all passengers to get off before reaching the terminus.',
                'incident_date_time' => '2026-08-10 17:45:00',
                'incident_location' => 'Philcoa, Commonwealth Ave, Quezon City',
                'status' => 'settled',
                'user_id' => null,
            ],
            [
                'title' => 'Reckless Overtaking & Counter-Flowing',
                'complainant_first_name' => 'Apolinario',
                'complainant_last_name' => 'Mabini',
                'complainant_address' => 'Nagahan, Manila',
                'complainant_contact' => '09335556666',
                'driver_id' => $driver3->id,
                'category_id' => $catReckless->id,
                'description' => 'Tricycle counter-flowed into oncoming traffic near the school zone during rush hour.',
                'incident_date_time' => '2026-08-04 11:20:00',
                'incident_location' => 'Mendiola St, San Miguel, Manila',
                'status' => 'unsettled',
                'user_id' => $registeredUser?->id,
            ],
            [
                'title' => 'Refused Senior Citizen Passenger',
                'complainant_first_name' => 'Emilio',
                'complainant_last_name' => 'Aguinaldo',
                'complainant_address' => 'Kawit, Cavite',
                'complainant_contact' => '09447778888',
                'driver_id' => $driver4->id,
                'category_id' => $catRefusal->id,
                'description' => 'Driver drove away when senior citizen passenger requested standard 20% discount.',
                'incident_date_time' => '2026-07-28 14:10:00',
                'incident_location' => 'Aurora Blvd cor. EDSA, Cubao',
                'status' => 'settled',
                'user_id' => null,
            ],
            [
                'title' => 'Arrogant Verbal Abuse to Student',
                'complainant_first_name' => 'Gabriela',
                'complainant_last_name' => 'Silang',
                'complainant_address' => 'Intramuros, Manila',
                'complainant_contact' => '09558889999',
                'driver_id' => $driver1->id,
                'category_id' => $catArrogance->id,
                'description' => 'Driver shouted profanities when student handed exact change according to fare matrix.',
                'incident_date_time' => '2026-07-20 16:30:00',
                'incident_location' => 'V. Mapa St, Sta. Mesa, Manila',
                'status' => 'settled',
                'user_id' => $registeredUser?->id,
            ],
            [
                'title' => 'Reckless Bus Drag Racing',
                'complainant_first_name' => 'Juan',
                'complainant_last_name' => 'Luna',
                'complainant_address' => 'Binondo, Manila',
                'complainant_contact' => '09669990000',
                'driver_id' => $driver5->id,
                'category_id' => $catReckless->id,
                'description' => 'Bus driver was drag racing with another bus along EDSA, putting passenger safety at grave risk.',
                'incident_date_time' => '2026-06-15 07:45:00',
                'incident_location' => 'EDSA Guadalupe Southbound, Makati',
                'status' => 'settled',
                'user_id' => null,
            ],
            [
                'title' => 'Jeepney Overcharge Rain Storm',
                'complainant_first_name' => 'Marcelo',
                'complainant_last_name' => 'Del Pilar',
                'complainant_address' => 'Bulacan St, Manila',
                'complainant_contact' => '09771112222',
                'driver_id' => $driver2->id,
                'category_id' => $catOvercharging->id,
                'description' => 'Took advantage of heavy rainfall to charge flat PHP 50 per head regardless of destination.',
                'incident_date_time' => '2026-05-18 18:00:00',
                'incident_location' => 'Quezon Ave cor. EDSA, Quezon City',
                'status' => 'unsettled',
                'user_id' => null,
            ],
            [
                'title' => 'Route Cutting & Abandoning Passengers',
                'complainant_first_name' => 'Antonio',
                'complainant_last_name' => 'Luna',
                'complainant_address' => 'U.N. Avenue, Manila',
                'complainant_contact' => '09882223333',
                'driver_id' => $driver4->id,
                'category_id' => $catRouteDeviation->id,
                'description' => 'Driver cut route short due to traffic and dropped passengers off 3 km away from target endpoint.',
                'incident_date_time' => '2026-04-12 19:20:00',
                'incident_location' => 'Anonas St, Project 3, Quezon City',
                'status' => 'settled',
                'user_id' => null,
            ],
        ];

        foreach ($complaintsData as $data) {
            $complaint = Complaint::updateOrCreate(
                ['title' => $data['title']],
                array_merge($data, [
                    'employee_id' => $staffUser?->id,
                ])
            );

            // Ensure dedicated conversation exists for chat feature
            $conversation = Conversation::firstOrCreate(
                ['complaint_id' => $complaint->id],
                ['user_id' => $complaint->user_id]
            );

            // Add initial system inquiry message
            Message::firstOrCreate(
                ['conversation_id' => $conversation->id],
                [
                    'sender_type' => 'user',
                    'sender_id' => $complaint->user_id,
                    'sender_name' => "{$complaint->complainant_first_name} {$complaint->complainant_last_name}",
                    'sender_role' => 'citizen',
                    'message_text' => "Complaint filed: {$complaint->title}. Description: {$complaint->description}",
                ]
            );
        }
    }
}
