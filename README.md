# e-Reklamo: System User Interface (UI) Design & Experience Architecture

An in-depth guide to the design philosophy, visual design system, layout architecture, component specifications, and user experience (UX) workflows of the **e-Reklamo** Traffic Management Unit (TMU) digital platform.

---

## 🎨 1. UI/UX Design Philosophy & Core Principles

The **e-Reklamo** interface is engineered for municipal traffic governance, emergency dispatch, and citizen reporting. It bridges high-stress, rapid-response dispatch operations with an approachable, transparent citizen experience.

```
       ┌───────────────────────────────────────────────────────────────┐
       │                 Core Design Pillars of e-Reklamo              │
       └───────────────────────────────────────────────────────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
  1. Operational Glanceability    2. Ergonomic Dual-Theme     3. Visual Hierarchy
  Instant triage of tickets,     Glare-free eye comfort for  Clear type scale and
  status badges & live chats.     24/7 operator shift work.   predictable spatial rhythm.
```

### Key Design Tenets:
1. **Operational Glanceability:** Dispatchers and field supervisors handle dozens of incident claims during peak rush hours. Information density is prioritized with high-contrast status pills, monospaced case IDs, and color-coded urgency chips that can be evaluated in under two seconds.
2. **Ergonomic 24/7 Eye Comfort:** Traffic management consoles operate across three consecutive 8-hour shifts. The interface avoids stark `#000000` pitch black and blinding `#ffffff` stark white in favor of soft, ocular-friendly slate and navy palettes.
3. **Consistency Across Form Factors:** Both the **Administrative Web Portal** (desktop workstations) and **Citizen Mobile App** (smartphones) share common iconography, semantic status colors, and terminology.
4. **Predictable Component Layouts:** Interactive controls, search inputs, filter pills, and primary CTAs are placed in standardized locations across all views to minimize cognitive friction.

---

## 🌈 2. Color System & Design Tokens

The visual system is built on modern **OKLCH color space** tokens configured via Tailwind CSS v4, providing smooth perceptual uniformity and contrast.

### A. Dual Theme System

| Surface Role | Dark Navy Theme (Default) | Eye-Comfort Light Theme | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#080f1d` / `oklch(0.195 ...)` | `#dce4ec` (Soft Slate-200) | Primary backdrop; eliminates glare in light mode. |
| **Container / Card Base** | `#091122` / `oklch(0.225 ...)` | `#e4ecf4` (Subtle Slate Surface) | Card panels, sidebars, data table containers. |
| **Elevated Surfaces** | `#0e172b` / `oklch(0.260 ...)` | `#e9eef4` (Clean Card Base) | Chat bubbles, modal dialogs, flyout menus. |
| **Dividers & Borders** | `border-blue-900/30` / `#1e293b` | `border-slate-300` / `border-slate-400/80` | Crisp structural separation between panels. |
| **Primary Text** | `#ffffff` / Slate-50 | `#0f172a` (Deep Slate-900) | Highest contrast readable typography. |
| **Muted / Secondary Text**| Slate-400 / Slate-500 | `#475569` (Slate-600) | Timestamps, metadata, micro-labels. |

### B. Semantic Status Palette

Every state in the incident and dispatch lifecycle is mapped to an unambiguous color code:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 🟡 PENDING / UNSETTLED   │ Amber-500 / Amber-400   │ Action Required   │
  │ 🔵 UNDER REVIEW          │ Blue-600 / Blue-400     │ In Progress       │
  │ 🟢 SETTLED / RESOLVED    │ Emerald-600 / Emerald-400│ Successfully Done│
  │ ⚫ DISMISSED / ARCHIVED   │ Slate-500 / Slate-400   │ Case Closed      │
  │ 🔴 URGENT / DEMERIT      │ Rose-600 / Crimson-500  │ High Priority     │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 3. Layout Architecture & App Shell

The web application utilizes a persistent, full-viewport responsive shell structure defined in `MainLayout.tsx`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo, Branding, [Mobile Menu], [Theme Toggle 🌙/☀️], User Avatar 👤 │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ SIDEBAR       │ MAIN CONTENT AREA                                           │
│ • Dashboard   │                                                             │
│ • Complaints  │  [ Full-Bleed View for Operator Chat & Studios ]            │
│ • Records     │  OR                                                         │
│ • Analytics   │  [ Contained Max-W-7xl View for Data Grids & Metrics ]      │
│ • Schedules   │                                                             │
│ • Directives  │                                                             │
│ • Admin Tools │                                                             │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

1. **Fixed Top Navbar (`Navbar.tsx`):**
   - High-contrast bottom border (`border-slate-300` in light mode, `border-white/5` in dark mode) ensuring clean separation from the content viewport.
   - Quick action controls: responsive hamburger menu toggle, dynamic Sun/Moon theme switcher, and an avatar profile dropdown.
2. **Fixed Sidebar Drawer (`Sidebar.tsx`):**
   - Distinct navy-blue branding pillar (`bg-[#1e3a8a]`) displaying the official TMU badge.
   - Logical menu groups (*Menu*, *Operations*, *Administration*) with active route highlighting and role-based filtering.
3. **Adaptive Viewport Modes:**
   - **Contained Viewport (`fullBleed={false}`):** Centers structured content in a constrained `max-w-7xl` container with balanced margins for data tables, metrics, and settings.
   - **Full-Bleed Viewport (`fullBleed={true}`):** Expands to `calc(100vh - 4rem)` without page-level scrollbars, maximizing screen real estate for the **Operator Dispatch Chat** and **Announcement Studio**.

---

## 🖥️ 4. Key Screen UI/UX Designs

### A. Operator Dispatch Chat Console (`OperatorChat.tsx`)
The dispatch console is a high-density, real-time response workspace built to handle live incoming citizen reports.

```
┌───────────────────────────────┬─────────────────────────────────────────────┐
│ 💬 DISPATCH INBOX             │ 👤 ACTIVE CITIZEN SESSION: Hannah Jean      │
│ [Search citizen or ticket...] │ Active on Mobile • Ticket #13 • [VIEW CASE] │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 🟢 Hannah Jean Pacardo        │ 🛡️ Encrypted official channel connected.    │
│    Ticket #13: Overtaking     │                                             │
│    "i would like to ask..."   │ Citizen: "i would like to ask about..."     │
│ ⚪ Iris Tiffany               │                                             │
│    Direct Inquiry             │ Dispatcher: "how can i help you?"  ✓ Read   │
│ 🟣 Station Commander          │                                             │
│    Shift Coordination         │                                             │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ [ + New Chat ]  [Filter: All] │ ⚡ QUICK REPLY: [Under Review] [Send Patrol]│
│                               │ 📎 🎤 [ Type a message...        ] [ SEND ↵]│
└───────────────────────────────┴─────────────────────────────────────────────┘
```

- **Split-View Canvas:** 
  - **Left Sidebar (384px):** Filterable conversation roster with avatar initials, online indicators, ticket chips, and last message previews.
  - **Right Messenger Thread:** Chronological chat bubbles with distinct visual treatment for inbound citizen messages (white/dark-card bubbles) versus outbound TMU staff replies (royal blue right-aligned bubbles with double-check delivery receipts).
- **Context-Aware Citizen Header:** Displays verified resident identity, active mobile connection status, Citizen ID (`#CZ-XXXX`), and a direct **"View Complaint"** button that only appears if the resident has filed an incident report.
- **Micro-Interaction Bar:** Canned response chips (*"Your complaint is currently under review by TMU inspectors."*) that inject text directly into the input field with one click, accompanied by attachment and voice input action buttons.

---

### B. Announcement Studio & Live Mobile Simulator (`AnnouncementsPage.tsx`)
A dual-pane publishing environment combining a regulatory drafting workbench with an interactive device simulator.

```
┌───────────────────────────────────────────────┬─────────────────────────────┐
│ 📝 ANNOUNCEMENT DRAFTING WORKBENCH            │ 📱 LIVE MOBILE SIMULATOR    │
├───────────────────────────────────────────────┼─────────────────────────────┤
│ Type:  [● Announcement] [○ Directive] [○ Memo]│ ┌─────────────────────────┐ │
│ Title: Comprehensive Traffic Re-Routing Plan  │ │ 🟢 LIVE PREVIEW         │ │
│ Summary: Temporary one-way traffic scheme...  │ │ [ Announcement Flyer  ] │ │
│                                               │ │                         │ │
│ [ Upload Flyer Image / Ordinance Notice ]     │ │ PUBLIC NOTICE           │ │
│                                               │ │ Traffic Re-Routing Plan │ │
│ Legal Basis: City Ordinance No. 042-2024      │ │ Effective: Nov 20, 2026 │ │
│ Key Directives: • Strict No Parking Zone      │ │                         │ │
│ Signatories: TMU Chief / City Mayor           │ │ [ Read Circular → ]     │ │
│                                               │ └─────────────────────────┘ │
│ [✓] Publish to Mobile App  [ ] Push Alert     │ Simulated iPhone Preview    │
│ [ Reset Form ]           [ PUBLISH DIRECTIVE ]│ Instant WYSIWYG Feedback    │
└───────────────────────────────────────────────┴─────────────────────────────┘
```

- **12-Column Responsive Layout:** 7 columns allocated to form inputs and 5 columns dedicated to the sticky live phone simulator.
- **Live WYSIWYG Rendering:** Any character typed into the title, summary, date, or directives immediately renders inside the phone mockup, eliminating publishing errors.
- **Visual Document Badges:** Dynamic badge labels (Public Announcement in blue, Traffic Directive in purple, Executive Memorandum in amber).

---

### C. Mayor Executive Report Generator (`MayorReportModal.tsx`)
A print-optimized executive modal designed to bridge digital incident analytics with formal government documentation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏛️ EXECUTIVE INCIDENT & DISPATCH REPORT • CITY OF ROXAS                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                     REPUBLIC OF THE PHILIPPINES                             │
│                           PROVINCE OF CAPIZ                                 │
│                         CITY GOVERNMENT OF ROXAS                            │
│                     TRAFFIC MANAGEMENT UNIT (TMU)                           │
│                                                                             │
│  EXECUTIVE DISPATCH & INCIDENT REPORT SUMMARY                               │
│  Reporting Period: Current Operational Cycle                                │
│                                                                             │
│  ┌──────────────────────┬──────────────────────┬─────────────────────────┐  │
│  │ Total Logged: 13     │ Settled: 9 (69.2%)   │ Active / Pending: 4     │  │
│  └──────────────────────┴──────────────────────┴─────────────────────────┘  │
│                                                                             │
│  RECORDED COMPLAINT DOSSIER (OFFICIAL EXTRACT):                             │
│  • #CR-2026-0013: Overtaking Violation (Sector 04) - SETTLED                │
│  • #CR-2026-0012: Refusal to Convey Passenger      - UNDER REVIEW           │
│                                                                             │
│  PREPARED BY:                        NOTED BY:                              │
│  _______________________             _______________________                │
│  TMU Duty Supervisor                 RONNIE T. DADIVAS, City Mayor          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ Close ]                                                [ 🖨️ PRINT REPORT ] │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Government Letterhead Architecture:** Standardized Republic of the Philippines heading with official seals and typography.
- **Physical Print Stylesheet (`@media print`):** Custom print isolation hiding all browser chrome, sidebars, modals, and navigation buttons, targeting exact US Letter and Legal dimensions.

---

### D. Data Tables & Case Dossiers (`ComplaintsList.tsx`, `DriverRecords.tsx`)
High-density administrative tables supporting rapid searching, filtering, and inspection.

- **Unified Search & Filter Bar:** Multi-attribute text searching combined with category pills (`All`, `Pending`, `Under Review`, `Settled`, `Dismissed`).
- **Data Table Row Cards:** Hover-reactive rows displaying ticket IDs, citizen complainant names, violation tags, plate numbers, and status badges.
- **Action Flyouts:** Fast modal triggers for **Inspect Case**, **Assign Officer**, and **Update Status** without navigating away from the table.

---

## 📱 5. Citizen Mobile App UI Design (`tmu-app`)

Built with **React Native** and **Expo Router**, the mobile interface prioritizes one-handed accessibility and speed for commuters.

```
┌─────────────────────────┐
│ e-Reklamo Roxas City    │
│ Welcome, Juan Dela Cruz │
├─────────────────────────┤
│ [ 🚨 FILE A COMPLAINT ] │ ◄ High-prominence emergency button
├─────────────────────────┤
│ RECENT TRAFFIC ALERTS   │
│ ┌─────────────────────┐ │
│ │ 📢 ONE-WAY TRAFFIC  │ │ ◄ Card-based advisory carousel
│ │ Roxas City Plaza    │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ CASE TRACKER            │
│ Ticket #CR-2026-0013    │
│ ●───●───○───○           │ ◄ Visual 4-step progress tracker
│ [ Under Investigation ] │
├─────────────────────────┤
│ [🏠] [📢] [➕] [💬] [👤]│ ◄ Ergonomic Bottom Tab Navigation
└─────────────────────────┘
```

1. **Ergonomic Bottom Navigation Bar:**
   - 5 primary touchpoints: **Home (`/`)**, **Advisories (`/announcements`)**, **New Complaint (`/complaint-form`)**, **Support Chat (`/chat`)**, and **Profile (`/profile`)**.
   - Standard 48px touch targets adhering to iOS Human Interface and Android Material Design guidelines.
2. **Step-by-Step Incident Reporting Wizard (`complaint-form.tsx`):**
   - Segmented inputs: Driver Plate Number lookup → Violation Type selection → Narrative Description → Media Evidence attachment.
   - Native device camera and video integration with thumbnail previews.
3. **Visual Timeline Progress Bar (`track.tsx`):**
   - Step-by-step indicator tracking case lifecycle from submission to resolution, reducing citizen anxiety and phone follow-ups.

---

## ♿ 6. Accessibility & Micro-Interactions

- **Focus & Selection States:** Subtle ring outlines (`focus:border-blue-500`) with smooth 200ms transition intervals.
- **Keyboard Ergonomics:** Form inputs and dispatch textareas bind native keyboard shortcuts (e.g., `Return ↵` sends messages; `Shift + Return` inserts line breaks).
- **Responsive Breakpoints:**
  - Mobile (`<640px`): Collapsible drawer menu, single-column chat and data grids.
  - Tablet (`640px – 1024px`): Two-column forms, floating action buttons.
  - Desktop (`>1024px`): Full two-column messenger console, 12-column studio workbenches.
- **Motion & Transitions:** Gentle fade-ins (`animate-fade-in`), pulse indicators for active live sessions, and bouncy jump-to-bottom notifications that do not disorient users.

---

## 🛠️ Summary Matrix of UI Interfaces

| Interface / View | Key Components Used | Layout Type | Primary Action |
| :--- | :--- | :--- | :--- |
| **Operator Dispatch Chat** | Avatar pills, Message bubbles, Quick chips | Full-Bleed 2-Column | Real-time chat & complaint inspection |
| **Announcement Studio** | Input forms, Image dropzone, Phone mockup | 12-Column Responsive | Author & broadcast municipal directives |
| **Mayor Report Modal** | LGU seal header, Stat cards, Signatures | Print-Ready Modal | Print / Save official PDF report |
| **Complaints Directory** | Search bar, Filter pills, Status table | Max-W-7xl Contained | Triage, assign, and resolve tickets |
| **Driver Records** | Driver cards, Demerit badges, Modal dossier | Max-W-7xl Contained | Track repeat violators & update info |
| **Citizen Mobile App** | Tab bar, Camera picker, Step progress bar | Mobile-Native Screen | Report violations & track live status |
