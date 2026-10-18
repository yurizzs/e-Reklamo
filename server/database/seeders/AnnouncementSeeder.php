<?php

namespace Database\Seeders;

use App\Models\Announcement;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'type' => 'memorandum',
                'badge_label' => 'OFFICIAL MEMORANDUM',
                'ref_number' => 'TMU-MC-2026-10-094',
                'title' => 'Strict Enforcement of Approved Tricycle Fare Matrix & Mandatory Fare Card Display',
                'summary' => 'Directing all motorized tricycle operators, drivers, and transport associations to strictly adhere to the ₱15.00 base fare and grant the mandatory 20% discount to Students, Senior Citizens, and PWDs.',
                'issuing_office' => 'Office of the City Mayor & Traffic Management Unit (TMU)',
                'date' => 'October 14, 2026',
                'effective_date' => 'Immediately (Effective Q4 2026)',
                'urgency' => 'urgent',
                'legal_basis' => 'Roxas City Ordinance No. 024-2024 & Municipal Transportation Code',
                'key_directives' => [
                    'All franchised tricycle units must visibly install the laminated 2026 Fare Matrix inside the passenger cabin facing the commuter.',
                    'Base passenger fare is strictly capped at ₱15.00 for the first two (2) kilometers.',
                    'Mandatory twenty percent (20%) discount (₱10.00 base fare) must be honored for Students, Senior Citizens, and Persons with Disabilities (PWD) upon presentation of valid ID.',
                    'Overcharging fines will be strictly enforced: ₱500.00 for 1st offense, ₱1,000.00 for 2nd offense, and franchise suspension on 3rd offense.',
                    'Refusal to convey passengers to their designated route is considered a violation of public franchise terms.',
                ],
                'signatories' => [
                    ['name' => 'Engr. Arnel M. Del Rosario', 'title' => 'TMU Operations Directorate Specialist'],
                    ['name' => 'P/Supt. Rodrigo M. Valdez', 'title' => 'Traffic Enforcement Commander'],
                    ['name' => 'Office of the City Mayor', 'title' => 'Executive Chief of Roxas City'],
                ],
                'publish_to_mobile' => true,
                'send_push_alert' => true,
            ],
            [
                'type' => 'announcement',
                'badge_label' => 'PUBLIC ADVISORY',
                'ref_number' => 'PA-TMU-2026-102',
                'title' => 'Temporary Road Rehabilitation & Traffic Rerouting along Roxas Blvd Sector 2',
                'summary' => 'Road rehabilitation and drainage culvert upgrade begins along Roxas Blvd starting Nov 12. Motorists and commuters are advised to use the Sector 4 bypass corridor.',
                'issuing_office' => 'TMU Public Information Desk & DPWH Engineering Taskforce',
                'date' => 'October 11, 2026',
                'effective_date' => 'November 12 - December 05, 2026',
                'urgency' => 'priority',
                'legal_basis' => 'City Executive Order No. 44-2026 on Infrastructure Safety Measures',
                'key_directives' => [
                    'Heavy freight and passenger utility vehicles are redirected toward Sector 4 bypass corridor between 06:30 AM and 08:30 PM.',
                    'Dedicated TMU field traffic enforcers and traffic lights will be stationed at Checkpoint Alpha and Checkpoint Beta to assist commuters.',
                    'Tricycle terminal pick-up points on Sector 2 East are temporarily moved 100 meters northward near Central Plaza.',
                    'Pedestrian walkways will remain open with marked safety barricades.',
                ],
                'signatories' => [
                    ['name' => 'Capt. Nelson G. Borja', 'title' => 'Field Operations & Dispatch Lead'],
                    ['name' => 'TMU Command Center', 'title' => 'Civic Grievances & Enforcement Bureau'],
                ],
                'publish_to_mobile' => true,
                'send_push_alert' => false,
            ],
            [
                'type' => 'directive',
                'badge_label' => 'REGULATORY DIRECTIVE',
                'ref_number' => 'JRD-TRB-TMU-2026-04',
                'title' => 'Joint TMU-TRB Q4 Tricycle Franchise Validation & Driver Courtesy Audit',
                'summary' => 'Mandatory roadside verification of franchise registration stickers, driver uniform compliance (closed shoes and ID), and passenger refusal monitoring.',
                'issuing_office' => 'Tricycle Regulatory Board (TRB) & TMU Enforcement Division',
                'date' => 'October 02, 2026',
                'effective_date' => 'October 15 - November 30, 2026',
                'urgency' => 'priority',
                'legal_basis' => 'Municipal Traffic Safety & Commuter Protection Act',
                'key_directives' => [
                    'Refusal to convey passengers without justifiable technical grounds is subject to immediate ₱1,000.00 citation fine.',
                    'Franchise renewal grace period closes at the end of the current operations cycle; unrenewed units risk impoundment.',
                    'Driver accreditation cards and city operator stickers must be affixed on the top right windshield corner.',
                    'Commuters are strongly urged to report plate numbers and body numbers via the e-Reklamo mobile app for rapid response.',
                ],
                'signatories' => [
                    ['name' => 'Atty. Cristina R. Alcantara', 'title' => 'TRB Board Chairperson'],
                    ['name' => 'TMU Legal & Adjudication Unit', 'title' => 'Public Transportation Oversight'],
                ],
                'publish_to_mobile' => true,
                'send_push_alert' => false,
            ],
            [
                'type' => 'announcement',
                'badge_label' => 'WEATHER TRAFFIC ALERT',
                'ref_number' => 'PA-TMU-2026-118',
                'title' => 'Precautionary Traffic Safety & Route Accessibility Notice for Low-Lying Corridors',
                'summary' => 'Alerting all public utility tricycles, private motorists, and pedestrians of anticipated localized flash floods near coastal routes and riverfront accessways.',
                'issuing_office' => 'City Disaster Risk Reduction Management Office (CDRRMO) & TMU',
                'date' => 'September 29, 2026',
                'effective_date' => 'Seasonal Monsoon Advisory',
                'urgency' => 'urgent',
                'legal_basis' => 'City Disaster Preparedness & Public Safety Protocol Code 2025',
                'key_directives' => [
                    'Tricycle operators are cautioned against traversing waters higher than 6 inches along Riverbank Road Sector 1.',
                    'Emergency roadside assistance hotline (036) 621-0000 is open 24/7 for stalled commuters.',
                    'Towing fees are waived for public conveyances disabled due to sudden street flooding during advisory hours.',
                ],
                'signatories' => [
                    ['name' => 'Col. Fernando S. Reyes', 'title' => 'CDRRMO Executive Director'],
                    ['name' => 'TMU Emergency Response Team', 'title' => 'Rapid Dispatch Unit'],
                ],
                'publish_to_mobile' => true,
                'send_push_alert' => true,
            ],
            [
                'type' => 'memorandum',
                'badge_label' => 'OFFICIAL MEMORANDUM',
                'ref_number' => 'TMU-MC-2026-088',
                'title' => 'Driver Attire Standards: Prohibition of Slippers & Sleeveless Shirts on Duty',
                'summary' => 'Re-iterating Section 12 of Ordinance No. 024-2024 requiring all public utility tricycle drivers to wear collared shirts, closed shoes, and valid TMU identification while operating.',
                'issuing_office' => 'TMU Standards & Regulatory Compliance Division',
                'date' => 'September 15, 2026',
                'effective_date' => 'Mandatory Compliance',
                'urgency' => 'routine',
                'legal_basis' => 'Roxas City Ordinance No. 024-2024, Section 12 (Driver Code of Conduct)',
                'key_directives' => [
                    'Wearing of rubber flip-flops (slippers/tsinelas), sandals without heel straps, or bare feet while driving is strictly prohibited.',
                    'Drivers must wear at least a t-shirt with sleeves (no sando/sleeveless tank tops).',
                    'TMU driver identification card must be displayed or ready for presentation upon request of traffic enforcers.',
                    'First violation carries a written warning; second violation carries a ₱300.00 fine and mandatory half-day road safety seminar.',
                ],
                'signatories' => [
                    ['name' => 'Engr. Arnel M. Del Rosario', 'title' => 'TMU Operations Directorate Specialist'],
                    ['name' => 'Office of Transport Regulation', 'title' => 'City Compliance Division'],
                ],
                'publish_to_mobile' => true,
                'send_push_alert' => false,
            ],
        ];

        foreach ($items as $item) {
            Announcement::firstOrCreate(
                ['ref_number' => $item['ref_number']],
                $item
            );
        }
    }
}
