<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ComplaintResource;
use App\Models\Complaint;
use App\Models\Driver;
use App\Models\ViolationCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
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

        // 3. Violation Chart and Table Data
        $categories = ViolationCategory::all();
        $chartData = [];
        $tableData = [];

        foreach ($categories as $cat) {
            $count = $query->clone()
                ->where('category_id', $cat->id)
                ->count();

            $fee = (double) $cat->penalty_amount;
            $totalAmount = $fee * $count;

            $chartData[] = [
                'category_name' => $cat->category_name,
                'complaints_count' => $count,
            ];

            $tableData[] = [
                'category_id' => $cat->id,
                'category_name' => $cat->category_name,
                'fee' => $fee,
                'violators_count' => $count,
                'total_amount' => $totalAmount,
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
                'user:id,first_name,last_name',
                'driver:id,first_name,last_name',
                'category:id,category_name',
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
            'new' => Complaint::where('status', 'new')->count(),
            'pending' => Complaint::where('status', 'pending')->count(),
            'resolved' => Complaint::where('status', 'resolved')->count(),
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'complainant_first_name' => ['required', 'string', 'max:255'],
            'complainant_last_name' => ['required', 'string', 'max:255'],
            'driver_id' => ['required', 'integer', 'exists:drivers,id'],
            'category_id' => ['required', 'integer', 'exists:violation_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
            'incident_date_time' => ['required', 'date'],
            'incident_location' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in(['new', 'pending', 'resolved'])],
        ]);

        $validated['status'] = $validated['status'] ?? 'new';

        $complaint = Complaint::create($validated)->load([
            'user:id,first_name,last_name',
            'driver:id,first_name,last_name',
            'category:id,category_name',
        ]);

        return $this->success(
            'Complaint created successfully',
            ComplaintResource::make($complaint),
            201
        );
    }
}
