<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComplaintResource;
use App\Models\Complaint;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Driver;
use App\Models\Evidence;
use App\Models\ViolationCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    use ApiResponse;

    public function options()
    {
        return $this->success(
            'Complaint form options retrieved successfully',
            [
                'drivers' => Driver::query()
                    ->select('id', 'first_name', 'last_name', 'plate_number')
                    ->orderBy('last_name')
                    ->orderBy('first_name')
                    ->get()
                    ->map(fn ($driver) => [
                        'id' => $driver->id,
                        'name' => trim(implode(', ', array_filter([
                            $driver->last_name,
                            $driver->first_name,
                        ]))),
                        'plate_number' => $driver->plate_number,
                    ]),
                'categories' => ViolationCategory::query()
                    ->select('id', 'category_name')
                    ->orderBy('category_name')
                    ->get(),
            ],
            200
        );
    }

    public function analytics(Request $request)
    {
        $year = $request->input('year', 'all');
        $month = $request->input('month', 'all');

        $query = Complaint::query();

        if ($year !== 'all' && $month !== 'all') {
            $monthPad = str_pad($month, 2, '0', STR_PAD_LEFT);
            $query->where('incident_date_time', 'like', "{$year}-{$monthPad}-%");
        } elseif ($year !== 'all') {
            $query->where('incident_date_time', 'like', "{$year}-%");
        } elseif ($month !== 'all') {
            $monthPad = str_pad($month, 2, '0', STR_PAD_LEFT);
            $query->where('incident_date_time', 'like', "____-{$monthPad}-%");
        }

        // 1. Total Complaints Count
        $totalComplaints = $query->count();

        // 2. Total Fee Collected (Sum of penalty_amount of resolved complaints matching the filter)
        // Since penalty_amount is stored as a string, we cast it to decimal/double in query.
        $totalFeeCollected = (double) $query->clone()
            ->where('status', 'resolved')
            ->join('violation_categories', 'complaints.category_id', '=', 'violation_categories.id')
            ->sum(\Illuminate\Support\Facades\DB::raw('CAST(violation_categories.penalty_amount AS DECIMAL(10,2))'));

        // 3. Violation Chart and Table Data (Includes soft-deleted categories to prevent missing category metrics)
        $categories = ViolationCategory::withTrashed()
            ->orderBy('category_name')
            ->get();
        $chartData = [];
        $tableData = [];

        foreach ($categories as $cat) {
            $count = $query->clone()
                ->where('category_id', $cat->id)
                ->count();

            $fee = (double) $cat->penalty_amount;
            $totalAmount = $fee * $count;

            $chartData[] = [
                'category_name' => $cat->category_name . ($cat->trashed() ? ' (Archived)' : ''),
                'complaints_count' => $count,
            ];

            $tableData[] = [
                'category_id' => $cat->id,
                'category_name' => $cat->category_name . ($cat->trashed() ? ' (Archived)' : ''),
                'fee' => $fee,
                'violators_count' => $count,
                'total_amount' => $totalAmount,
            ];
        }

        // Include uncategorized complaints if any exist for the selected filter
        $uncategorizedCount = $query->clone()
            ->where(function ($q) use ($categories) {
                $q->whereNull('category_id')
                    ->orWhereNotIn('category_id', $categories->pluck('id'));
            })
            ->count();

        if ($uncategorizedCount > 0) {
            $chartData[] = [
                'category_name' => 'Uncategorized / Other',
                'complaints_count' => $uncategorizedCount,
            ];

            $tableData[] = [
                'category_id' => 0,
                'category_name' => 'Uncategorized / Other',
                'fee' => 0,
                'violators_count' => $uncategorizedCount,
                'total_amount' => 0,
            ];
        }

        // 4. Available Years for Filter Dropdown (100% DB Agnostic using PHP date extraction)
        $rawDates = Complaint::query()
            ->select('incident_date_time')
            ->pluck('incident_date_time');
            
        $availableYears = $rawDates->map(function($date) {
            return substr((string)$date, 0, 4);
        })->filter(function($year) {
            return is_numeric($year) && strlen($year) === 4;
        })->unique()->sortDesc()->values()->all();

        // If empty, default to current year
        if (empty($availableYears)) {
            $availableYears = [date('Y')];
        }

        return $this->success(
            'Analytics report retrieved successfully',
            [
                'total_complaints' => $totalComplaints,
                'total_fee_collected' => $totalFeeCollected,
                'violation_chart_data' => $chartData,
                'violation_table_data' => $tableData,
                'available_years' => $availableYears,
            ],
            200
        );
    }

    public function index(Request $request)
    {
        $query = Complaint::query()
            ->with([
                'user:id,first_name,last_name,phone,address',
                'driver:id,first_name,last_name,plate_number',
                'category:id,category_name',
                'evidence',
                'statusHistories',
            ]);

        if ($request->filled('search')) {
            $search = (string) $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('complainant_first_name', 'like', "%{$search}%")
                    ->orWhere('complainant_last_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($user) use ($search) {
                        $user->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driver', function ($driver) use ($search) {
                        $driver->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($category) use ($search) {
                        $category->where('category_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', (string) $request->input('status'));
        }

        $sortBy = (string) $request->input('sort_by', 'incident_date_time');
        $sortOrder = strtolower((string) $request->input('sort_order', 'desc'));

        if (!in_array($sortBy, ['incident_date_time', 'title', 'status', 'created_at'], true)) {
            $sortBy = 'incident_date_time';
        }

        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }

        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

        $stats = [
            'all' => Complaint::count(),
            'unsettled' => Complaint::where('status', 'unsettled')->count(),
            'settled' => Complaint::where('status', 'settled')->count(),
        ];

        return $this->success(
            'Complaints retrieved successfully',
            [
                'complaints' => ComplaintResource::collection($paginated->getCollection()),
                'stats' => $stats,
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ],
            200
        );
    }

    public function show($id)
    {
        $complaint = Complaint::with([
            'user:id,first_name,last_name,phone,address',
            'driver:id,first_name,last_name,plate_number',
            'category:id,category_name',
            'evidence',
            'statusHistories',
        ])->findOrFail($id);

        return $this->success(
            'Complaint details retrieved successfully',
            ComplaintResource::make($complaint),
            200
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'complainant_first_name' => ['required', 'string', 'max:255'],
            'complainant_last_name' => ['required', 'string', 'max:255'],
            'complainant_address' => ['required', 'string', 'max:500'],
            'complainant_contact' => ['required', 'string', 'max:50'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
            'driver_first_name' => ['nullable', 'string', 'max:255'],
            'driver_last_name' => ['nullable', 'string', 'max:255'],
            'plate_number' => ['nullable', 'string', 'max:50'],
            'vehicle_id' => ['nullable', 'integer', 'exists:vehicle_types,id'],
            'category_id' => ['required', 'integer', 'exists:violation_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
            'incident_date_time' => ['required', 'date'],
            'incident_location' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in(['unsettled', 'settled'])],
            'evidence' => ['nullable', 'array', 'max:3'],
            'evidence.*' => [
                'nullable',
                'file',
                'max:51200', // 50 MB per file
                'mimetypes:image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mpeg,video/quicktime,video/webm',
            ],
        ], [
            'evidence.max' => 'You may attach a maximum of 3 evidence files.',
            'evidence.*.mimetypes' => 'Each file must be an image (JPEG, PNG, GIF, WebP) or a video (MP4, MPEG, MOV, WebM).',
            'evidence.*.max' => 'Each file must not exceed 50 MB.',
        ]);

        // Auto-match or create Driver record based on plate number / driver name
        $driverId = $request->input('driver_id');
        $plateNumber = strtoupper(trim((string) $request->input('plate_number', '')));
        $driverFirstName = trim((string) $request->input('driver_first_name', ''));
        $driverLastName = trim((string) $request->input('driver_last_name', ''));

        if (!$driverId && (!empty($plateNumber) || !empty($driverFirstName) || !empty($driverLastName))) {
            $existingDriver = null;

            if (!empty($plateNumber)) {
                $existingDriver = Driver::where(DB::raw('UPPER(plate_number)'), $plateNumber)->first();
            }

            if (!$existingDriver && !empty($driverFirstName) && !empty($driverLastName)) {
                $existingDriver = Driver::where(function ($q) use ($driverFirstName, $driverLastName) {
                    $q->where(DB::raw('UPPER(first_name)'), strtoupper($driverFirstName))
                      ->where(DB::raw('UPPER(last_name)'), strtoupper($driverLastName));
                })->first();
            }

            if ($existingDriver) {
                if (!empty($driverFirstName) && (empty($existingDriver->first_name) || $existingDriver->first_name === 'Driver')) {
                    $existingDriver->first_name = $driverFirstName;
                }
                if (!empty($driverLastName) && (empty($existingDriver->last_name) || $existingDriver->last_name === $existingDriver->plate_number)) {
                    $existingDriver->last_name = $driverLastName;
                }
                if (!empty($plateNumber) && (empty($existingDriver->plate_number) || $existingDriver->plate_number === 'N/A')) {
                    $existingDriver->plate_number = $plateNumber;
                }
                $existingDriver->save();
                $driverId = $existingDriver->id;
            } else {
                $vehicleId = $request->input('vehicle_id') ?? \App\Models\VehicleType::first()?->id ?? 1;
                $newDriver = Driver::create([
                    'first_name' => !empty($driverFirstName) ? $driverFirstName : 'Driver',
                    'last_name' => !empty($driverLastName) ? $driverLastName : (!empty($plateNumber) ? $plateNumber : 'Unknown'),
                    'plate_number' => !empty($plateNumber) ? $plateNumber : 'N/A',
                    'vehicle_id' => $vehicleId,
                ]);
                $driverId = $newDriver->id;
            }
        }

        if (!$driverId) {
            $driverId = Driver::first()?->id;
        }

        $validated['status'] = $validated['status'] ?? 'unsettled';

        $complaintData = collect($validated)
            ->except(['evidence', 'driver_first_name', 'driver_last_name', 'plate_number', 'vehicle_id'])
            ->toArray();

        $complaintData['driver_id'] = $driverId;

        $authUser = $request->user();
        if ($authUser) {
            if (get_class($authUser) === \App\Models\User::class) {
                $complaintData['user_id'] = $authUser->id;
            } elseif (get_class($authUser) === \App\Models\Employee::class) {
                $complaintData['employee_id'] = $authUser->id;
            }
        }

        $complaint = Complaint::create($complaintData)->load([
            'user:id,first_name,last_name',
            'driver:id,first_name,last_name,plate_number',
            'category:id,category_name',
        ]);

        // Create dedicated conversation for this complaint
        $conversation = Conversation::create([
            'complaint_id' => $complaint->id,
            'user_id' => $complaint->user_id ?? null,
        ]);

        $complainantName = trim("{$complaint->complainant_first_name} {$complaint->complainant_last_name}");
        if (empty($complainantName)) {
            $complainantName = $complaint->user ? trim("{$complaint->user->first_name} {$complaint->user->last_name}") : 'Citizen Inquiry';
        }

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'user',
            'sender_id' => $complaint->user_id ?? null,
            'sender_name' => $complainantName,
            'sender_role' => 'citizen',
            'message_text' => "Complaint report: '{$complaint->title}' at {$complaint->incident_location}. Description: {$complaint->description}",
        ]);

        // Store evidence files
        if ($request->hasFile('evidence')) {
            foreach ($request->file('evidence') as $file) {
                $mimeType = $file->getMimeType() ?? '';
                $fileType = str_starts_with($mimeType, 'video/') ? 'video' : 'image';
                $path = $file->store("evidence/{$complaint->id}", 'public');

                Evidence::create([
                    'complaint_id' => $complaint->id,
                    'file_path' => $path,
                    'file_type' => $fileType,
                ]);
            }
        }

        return $this->success(
            'Complaint created successfully',
            ComplaintResource::make($complaint),
            201
        );
    }

    /**
     * Check violations for a driver by plate number or driver name.
     */
    public function checkViolation(Request $request)
    {
        $search = trim((string) $request->input('search', $request->input('query', '')));

        if (empty($search)) {
            $authUser = $request->user();
            if ($authUser) {
                $search = trim("{$authUser->first_name} {$authUser->last_name}");
            }
        }

        if (empty($search)) {
            return $this->error('Please provide a plate number or driver name to check violations.', 422);
        }

        $complaints = Complaint::query()
            ->with([
                'driver:id,first_name,last_name,plate_number',
                'category:id,category_name,penalty_amount',
                'statusHistories',
            ])
            ->where(function ($q) use ($search) {
                $q->whereHas('driver', function ($driverQuery) use ($search) {
                    $driverQuery->where('plate_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$search}%");
                });
            })
            ->orderBy('incident_date_time', 'desc')
            ->get();

        return $this->success(
            'Violation status retrieved successfully',
            [
                'query' => $search,
                'total_violations' => $complaints->count(),
                'violations' => ComplaintResource::collection($complaints),
            ],
            200
        );
    }

    public function updateStatus(Request $request, $id)
    {
        $complaint = Complaint::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['unsettled', 'settled'])],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'status.required' => 'Please select a new status.',
            'description.max' => 'Description may not exceed 1000 characters.',
        ]);

        $oldStatus = $complaint->status;

        $complaint->update([
            'status' => $validated['status'],
        ]);

        // Record status history
        $complaint->statusHistories()->create([
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'remarks' => $validated['description'] ?? "Status updated from {$oldStatus} to {$validated['status']}",
            'changed_by' => (string) ($request->user()?->id ?? 'system'),
        ]);

        $complaint->load([
            'user:id,first_name,last_name',
            'driver:id,first_name,last_name',
            'category:id,category_name',
        ]);

        return $this->success(
            'Complaint status updated successfully',
            ComplaintResource::make($complaint),
            200
        );
    }
}

