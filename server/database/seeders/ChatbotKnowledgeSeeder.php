<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ChatbotKnowledge;

class ChatbotKnowledgeSeeder extends Seeder
{
    /**
     * Run the database seeds for Roxas City Ordinance No. 024-2024.
     */
    public function run(): void
    {
        $knowledgeItems = [
            [
                'title' => 'Maximum Allowable Tricycle Fare Rates',
                'category' => 'fare_rates',
                'keywords' => 'fare, pamasahe, rate, magkano, magkano pamasahe, tricycle fare, 15 pesos, per kilometer, roxas city',
                'content' => 'Section 1. Maximum Fare: The maximum allowable fare for motorized tricycles operating within the territorial jurisdiction of the City of Roxas is fixed at PESOS FIFTEEN (₱15.00) ONLY for the first TWO (2) kilometers per passenger, with an additional PESOS FIVE (₱5.00) ONLY for every additional kilometer travelled.',
                'fine_amount' => null,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. 1',
            ],
            [
                'title' => 'Discounted Fare Rates (Senior Citizens, Students, PWDs & Children)',
                'category' => 'fare_discounts',
                'keywords' => 'discount, senior citizen, student, pwd, estudyante, bata, children, libre, discount rates, pwd discount, senior discount',
                'content' => 'Section 2. Discount: Upon presentation of a valid ID, Senior Citizens, Students, and Persons with Disabilities (PWD) shall be charged PESOS TEN (₱10.00) ONLY for the first TWO (2) kilometers per passenger, plus ₱5.00 for every additional kilometer. Children 3 feet and below seated on the lap of an accompanying adult are free of charge (no additional fare).',
                'fine_amount' => null,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. 2',
            ],
            [
                'title' => 'Price Tariff Sticker Display Requirement',
                'category' => 'display_rules',
                'keywords' => 'tariff, sticker, price list, taripa, display tariff, inside cabin, tfru',
                'content' => 'Section 3. Tariff Display: The Tricycle Franchising and Regulatory Unit (TFRU) provides standard price tariff stickers with authorized rates. The price tariff sticker MUST be posted at a conspicuous place inside the passenger cabin of the motorized tricycle.',
                'fine_amount' => null,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. 3',
            ],
            [
                'title' => 'Tricycle Coverage & Authorized Operation',
                'category' => 'operation_rules',
                'keywords' => 'authorized, franchise, tfru, color coding, permit, colorcode, legit tricycle, colorum',
                'content' => 'Section 4. Coverage: Applies to all authorized motorized tricycles for hire within Roxas City. Unauthorized tricycles without a valid franchise from TFRU are strictly prohibited from transporting passengers or charging fares.',
                'fine_amount' => null,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. 4',
            ],
            [
                'title' => 'Penalties for Overcharging Fines',
                'category' => 'penalties',
                'keywords' => 'overcharge, sobrang paniningil, overcharging, multa sa overcharge, sobrang singil, fare penalty, mahapdi sa bulsa',
                'content' => 'Section 5. Penalty for Overcharging: Overcharging in violation of this ordinance is penalized as follows: 1st Offense: Fine of ₱1,500.00; 2nd Offense: Fine of ₱3,000.00; 3rd Offense: Fine of ₱5,000.00; 4th & Succeeding Offenses: Suspension of Franchise for 3 months for every violation.',
                'fine_amount' => 1500.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. 5',
            ],
            [
                'title' => 'Penalty for Refusal to Convey Passenger',
                'category' => 'penalties',
                'keywords' => 'refusal, pagtanggi, ayaw magsakay, refusal of passenger, tinanggihan, refused passenger, ayaw pumunta',
                'content' => 'Section F. Refusal to Convey Passenger: Driver of a tricycle unjustifiably refusing to convey a passenger to their stated destination (provided it is within a 2-kilometer radius from the city center) is subject to a ₱800.00 fine.',
                'fine_amount' => 800.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. F',
            ],
            [
                'title' => 'Penalty for Passenger Discrimination',
                'category' => 'penalties',
                'keywords' => 'discrimination, namimili ng sakay, preference, preferring passengers, namimili, pipili ng pasahero',
                'content' => 'Section G. Passenger Discrimination: Driver unduly preferring the carriage of a passenger over another who hailed first by reason of superior number, sex, age, or other discriminatory factors is subject to a ₱800.00 fine.',
                'fine_amount' => 800.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. G',
            ],
            [
                'title' => 'Penalty for Overloading Passengers or Cargo',
                'category' => 'penalties',
                'keywords' => 'overload, overloading, sobra sakay, sobrang karga, capacity, beyond capacity',
                'content' => 'Section D. Overloading: Loading of passenger or cargo beyond the authorized capacity of the tricycle carries a ₱100.00 fine for the driver or operator.',
                'fine_amount' => 100.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. D',
            ],
            [
                'title' => 'Driver Dress Code Violations',
                'category' => 'penalties',
                'keywords' => 'dress code, shorts, tsinelas, sandals, sando, sleeveless, walang sapatos, covered face',
                'content' => 'Section H. Driver Dress Code: Driver operating while wearing short pants, sandals, sleeveless shirt (sando), without shoes, or with face covered is subject to a ₱100.00 fine.',
                'fine_amount' => 100.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. H',
            ],
            [
                'title' => 'Driver Misconduct, Discourtesy, & Shortchanging',
                'category' => 'penalties',
                'keywords' => 'misconduct, discourtesy, bastos, mura, shortchanging, kulang sukli, rude, abusive language',
                'content' => 'Section J. Misconduct & Discourtesy: Driver committing misconduct or discourtesy against a passenger by shortchanging, snubbing, or using rude and abusive language is subject to a ₱200.00 fine.',
                'fine_amount' => 200.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. J',
            ],
            [
                'title' => 'Use of Tricycle in Illicit Activities',
                'category' => 'penalties',
                'keywords' => 'illicit, illegal activity, kebal, krimen, crime, bawal na gamot',
                'content' => 'Section C. Illicit Activities: Loading or knowingly allowing the use of the tricycle in the pursuit of illicit activities carries a ₱500.00 fine.',
                'fine_amount' => 500.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. C',
            ],
            [
                'title' => 'Unaccredited Sidecar / Unregistered Motorcycle Penalty',
                'category' => 'penalties',
                'keywords' => 'sidecar, unaccredited, unregistered motorcycle, walang rehistro, rehistro',
                'content' => 'Section E. Registration Violation: Attaching an accredited sidecar to a motorcycle not registered as a tricycle for hire, or attaching a registered motorcycle to an unaccredited sidecar carries a ₱200.00 fine.',
                'fine_amount' => 200.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. E',
            ],
            [
                'title' => 'Missing Assigned TRU Body Number',
                'category' => 'penalties',
                'keywords' => 'tru number, missing body number, walang number, body number, tru',
                'content' => 'Section K. Missing TRU Number: Driving a tricycle without the number assigned to it by the Tricycle Regulatory Unit carries a ₱100.00 fine for the driver and ₱200.00 fine for the operator.',
                'fine_amount' => 100.00,
                'ordinance_ref' => 'Ordinance No. 024-2024, Sec. K',
            ],
            [
                'title' => 'Abandoned Vehicles & Towing Regulations',
                'category' => 'towing',
                'keywords' => 'abandoned, towed, towing, impound, 48 hours, rotma, traffic hazard, na-tow, impounded',
                'content' => 'Chapter VII, Section 1. Abandoned Vehicles: Abandoning a vehicle upon public ways is prohibited. Vehicles left abandoned for 48 hours or more, or creating an immediate traffic hazard (wrecked, burned, partially dismantled, or illegally parked), are authorized for immediate removal by towing services under ROTMA.',
                'fine_amount' => null,
                'ordinance_ref' => 'Ordinance No. 024-2024, Chap. VII Sec. 1',
            ],
        ];

        foreach ($knowledgeItems as $item) {
            ChatbotKnowledge::updateOrCreate(
                ['title' => $item['title']],
                $item
            );
        }
    }
}
