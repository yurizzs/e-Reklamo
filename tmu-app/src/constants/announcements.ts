export interface AnnouncementSignatory {
  name: string;
  title: string;
}

export interface AnnouncementItem {
  id: string;
  type: 'memorandum' | 'announcement' | 'directive';
  badgeLabel: string;
  refNumber: string;
  title: string;
  summary: string;
  issuingOffice: string;
  date: string;
  urgency: 'routine' | 'priority' | 'urgent';
  legalBasis?: string;
  keyDirectives: string[];
  signatories: AnnouncementSignatory[];
  effectiveDate?: string;
}

export const OFFICIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'memo-2026-10-094',
    type: 'memorandum',
    badgeLabel: 'OFFICIAL MEMORANDUM',
    refNumber: 'TMU-MC-2026-10-094',
    title: 'Strict Enforcement of Approved Tricycle Fare Matrix & Mandatory Fare Card Display',
    summary:
      'Directing all motorized tricycle operators, drivers, and transport associations to strictly adhere to the ₱15.00 base fare and grant the mandatory 20% discount to Students, Senior Citizens, and PWDs.',
    issuingOffice: 'Office of the City Mayor & Traffic Management Unit (TMU)',
    date: 'October 14, 2026',
    effectiveDate: 'Immediately (Effective Q4 2026)',
    urgency: 'urgent',
    legalBasis: 'Roxas City Ordinance No. 024-2024 & Municipal Transportation Code',
    keyDirectives: [
      'All franchised tricycle units must visibly install the laminated 2026 Fare Matrix inside the passenger cabin facing the commuter.',
      'Base passenger fare is strictly capped at ₱15.00 for the first two (2) kilometers.',
      'Mandatory twenty percent (20%) discount (₱10.00 base fare) must be honored for Students, Senior Citizens, and Persons with Disabilities (PWD) upon presentation of valid ID.',
      'Overcharging fines will be strictly enforced: ₱500.00 for 1st offense, ₱1,000.00 for 2nd offense, and franchise suspension on 3rd offense.',
      'Refusal to convey passengers to their designated route is considered a violation of public franchise terms.',
    ],
    signatories: [
      { name: 'Engr. Arnel M. Del Rosario', title: 'TMU Operations Directorate Specialist' },
      { name: 'P/Supt. Rodrigo M. Valdez', title: 'Traffic Enforcement Commander' },
      { name: 'Office of the City Mayor', title: 'Executive Chief of Roxas City' },
    ],
  },
  {
    id: 'pa-2026-102',
    type: 'announcement',
    badgeLabel: 'PUBLIC ADVISORY',
    refNumber: 'PA-TMU-2026-102',
    title: 'Temporary Road Rehabilitation & Traffic Rerouting along Roxas Blvd Sector 2',
    summary:
      'Road rehabilitation and drainage culvert upgrade begins along Roxas Blvd starting Nov 12. Motorists and commuters are advised to use the Sector 4 bypass corridor.',
    issuingOffice: 'TMU Public Information Desk & DPWH Engineering Taskforce',
    date: 'October 11, 2026',
    effectiveDate: 'November 12 - December 05, 2026',
    urgency: 'priority',
    legalBasis: 'City Executive Order No. 44-2026 on Infrastructure Safety Measures',
    keyDirectives: [
      'Heavy freight and passenger utility vehicles are redirected toward Sector 4 bypass corridor between 06:30 AM and 08:30 PM.',
      'Dedicated TMU field traffic enforcers and traffic lights will be stationed at Checkpoint Alpha and Checkpoint Beta to assist commuters.',
      'Tricycle terminal pick-up points on Sector 2 East are temporarily moved 100 meters northward near Central Plaza.',
      'Pedestrian walkways will remain open with marked safety barricades.',
    ],
    signatories: [
      { name: 'Capt. Nelson G. Borja', title: 'Field Operations & Dispatch Lead' },
      { name: 'TMU Command Center', title: 'Civic Grievances & Enforcement Bureau' },
    ],
  },
  {
    id: 'jrd-2026-04',
    type: 'directive',
    badgeLabel: 'REGULATORY DIRECTIVE',
    refNumber: 'JRD-TRB-TMU-2026-04',
    title: 'Joint TMU-TRB Q4 Tricycle Franchise Validation & Driver Courtesy Audit',
    summary:
      'Mandatory roadside verification of franchise registration stickers, driver uniform compliance (closed shoes and ID), and passenger refusal monitoring.',
    issuingOffice: 'Tricycle Regulatory Board (TRB) & TMU Enforcement Division',
    date: 'October 02, 2026',
    effectiveDate: 'October 15 - November 30, 2026',
    urgency: 'priority',
    legalBasis: 'Municipal Traffic Safety & Commuter Protection Act',
    keyDirectives: [
      'Refusal to convey passengers without justifiable technical grounds is subject to immediate ₱1,000.00 citation fine.',
      'Franchise renewal grace period closes at the end of the current operations cycle; unrenewed units risk impoundment.',
      'Driver accreditation cards and city operator stickers must be affixed on the top right windshield corner.',
      'Commuters are strongly urged to report plate numbers and body numbers via the e-Reklamo mobile app for rapid response.',
    ],
    signatories: [
      { name: 'Atty. Cristina R. Alcantara', title: 'TRB Board Chairperson' },
      { name: 'TMU Legal & Adjudication Unit', title: 'Public Transportation Oversight' },
    ],
  },
  {
    id: 'pa-2026-118',
    type: 'announcement',
    badgeLabel: 'WEATHER TRAFFIC ALERT',
    refNumber: 'PA-TMU-2026-118',
    title: 'Precautionary Traffic Safety & Route Accessibility Notice for Low-Lying Corridors',
    summary:
      'Alerting all public utility tricycles, private motorists, and pedestrians of anticipated localized flash floods near coastal routes and riverfront accessways.',
    issuingOffice: 'City Disaster Risk Reduction Management Office (CDRRMO) & TMU',
    date: 'September 29, 2026',
    effectiveDate: 'Seasonal Monsoon Advisory',
    urgency: 'urgent',
    legalBasis: 'City Disaster Preparedness & Public Safety Protocol Code 2025',
    keyDirectives: [
      'Tricycle operators are cautioned against traversing waters higher than 6 inches along Riverbank Road Sector 1.',
      'Emergency roadside assistance hotline (036) 621-0000 is open 24/7 for stalled commuters.',
      'Towing fees are waived for public conveyances disabled due to sudden street flooding during advisory hours.',
    ],
    signatories: [
      { name: 'Col. Fernando S. Reyes', title: 'CDRRMO Executive Director' },
      { name: 'TMU Emergency Response Team', title: 'Rapid Dispatch Unit' },
    ],
  },
  {
    id: 'memo-2026-088',
    type: 'memorandum',
    badgeLabel: 'OFFICIAL MEMORANDUM',
    refNumber: 'TMU-MC-2026-088',
    title: 'Driver Attire Standards: Prohibition of Slippers & Sleeveless Shirts on Duty',
    summary:
      'Re-iterating Section 12 of Ordinance No. 024-2024 requiring all public utility tricycle drivers to wear collared shirts, closed shoes, and valid TMU identification while operating.',
    issuingOffice: 'TMU Standards & Regulatory Compliance Division',
    date: 'September 15, 2026',
    effectiveDate: 'Mandatory Compliance',
    urgency: 'routine',
    legalBasis: 'Roxas City Ordinance No. 024-2024, Section 12 (Driver Code of Conduct)',
    keyDirectives: [
      'Wearing of rubber flip-flops (slippers/tsinelas), sandals without heel straps, or bare feet while driving is strictly prohibited.',
      'Drivers must wear at least a t-shirt with sleeves (no sando/sleeveless tank tops).',
      'TMU driver identification card must be displayed or ready for presentation upon request of traffic enforcers.',
      'First violation carries a written warning; second violation carries a ₱300.00 fine and mandatory half-day road safety seminar.',
    ],
    signatories: [
      { name: 'Engr. Arnel M. Del Rosario', title: 'TMU Operations Directorate Specialist' },
      { name: 'Office of Transport Regulation', title: 'City Compliance Division' },
    ],
  },
];
