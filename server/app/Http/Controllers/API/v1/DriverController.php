<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Complaint;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    use ApiResponse;

    /**
     * Get list of drivers with violation statistics and summary cards.
     */
    public function records(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $query = Driver::query()
            ->with(['vehicleType:id,vehicle_name'])
            ->withCount([
                'complaints as total_violations',
                'complaints as settled_count' => function ($q) {
                    $q->where('status', 'settled');
                },
                'complaints as unsettled_count' => function ($q) {
                    $q->where('status', 'unsettled');
                },
            ]);

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('plate_number', 'like', "%{$search}%")
                    ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', "%{$search}%");
            });
        }

        // Order drivers by total violations descending so drivers with violations appear first
        $paginated = $query->orderBy('total_violations', 'desc')
            ->orderBy('last_name', 'asc')
            ->paginate($perPage);

        // Map collection to add driver details and latest complaint date
        $driverItems = $paginated->getCollection()->map(function ($driver) {
            $latestComplaint = Complaint::where('driver_id', $driver->id)
                ->orderBy('incident_date_time', 'desc')
                ->first(['incident_date_time']);

            $totalPenalty = Complaint::where('driver_id', $driver->id)
                ->where('status', 'settled')
                ->join('violation_categories', 'complaints.category_id', '=', 'violation_categories.id')
                ->sum(DB::raw('CAST(violation_categories.penalty_amount AS DECIMAL(10,2))'));

            return [
                'id' => $driver->id,
                'slug' => $driver->slug,
                'avatar' => $driver->avatar,
                'first_name' => $driver->first_name,
                'middle_name' => $driver->middle_name,
                'last_name' => $driver->last_name,
                'full_name' => trim(implode(' ', array_filter([$driver->first_name, $driver->middle_name, $driver->last_name]))),
                'plate_number' => $driver->plate_number,
                'vehicle_type' => $driver->vehicleType?->vehicle_name ?? 'N/A',
                'address' => $driver->address,
                'total_violations' => $driver->total_violations,
                'status_breakdown' => [
                    'unsettled' => $driver->unsettled_count,
                    'settled' => $driver->settled_count,
                ],
                'total_penalties' => (double) $totalPenalty,
                'last_reported_at' => $latestComplaint?->incident_date_time ?? null,
            ];
        });

        // Summary KPI statistics
        $totalDrivers = Driver::count();
        $totalViolations = Complaint::whereNotNull('driver_id')->count();
        $repeatOffenders = Driver::has('complaints', '>=', 2)->count();

        $totalPenaltiesCollected = (double) Complaint::where('status', 'resolved')
            ->whereNotNull('driver_id')
            ->join('violation_categories', 'complaints.category_id', '=', 'violation_categories.id')
            ->sum(DB::raw('CAST(violation_categories.penalty_amount AS DECIMAL(10,2))'));

        return $this->success(
            'Driver records retrieved successfully',
            [
                'drivers' => $driverItems,
                'stats' => [
                    'total_drivers' => $totalDrivers,
                    'total_violations' => $totalViolations,
                    'repeat_offenders' => $repeatOffenders,
                    'total_penalties_collected' => $totalPenaltiesCollected,
                ],
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

    /**
     * Get detailed violation history for a specific driver.
     */
    public function history($id)
    {
        $driver = Driver::with(['vehicleType:id,vehicle_name'])->findOrFail($id);

        $complaints = Complaint::query()
            ->with([
                'category:id,category_name,penalty_amount',
                'user:id,first_name,last_name',
                'evidence',
                'statusHistories',
            ])
            ->where('driver_id', $driver->id)
            ->orderBy('incident_date_time', 'desc')
            ->get();

        $totalPenalty = $complaints->where('status', 'resolved')->sum(function ($c) {
            return (double) ($c->category?->penalty_amount ?? 0);
        });

        return $this->success(
            'Driver violation history retrieved successfully',
            [
                'driver' => [
                    'id' => $driver->id,
                    'slug' => $driver->slug,
                    'avatar' => $driver->avatar,
                    'full_name' => trim(implode(' ', array_filter([$driver->first_name, $driver->middle_name, $driver->last_name]))),
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'plate_number' => $driver->plate_number,
                    'vehicle_type' => $driver->vehicleType?->vehicle_name ?? 'N/A',
                    'address' => $driver->address,
                    'total_violations' => $complaints->count(),
                    'total_penalties' => (double) $totalPenalty,
                ],
                'violations' => $complaints->map(function ($complaint) {
                    $complainantName = trim("{$complaint->complainant_first_name} {$complaint->complainant_last_name}");
                    if (empty($complainantName) && $complaint->user) {
                        $complainantName = trim("{$complaint->user->first_name} {$complaint->user->last_name}");
                    }

                    return [
                        'id' => $complaint->id,
                        'title' => $complaint->title,
                        'description' => $complaint->description,
                        'status' => $complaint->status,
                        'incident_date_time' => $complaint->incident_date_time,
                        'incident_location' => $complaint->incident_location,
                        'complainant_name' => !empty($complainantName) ? $complainantName : 'Anonymous / Citizen',
                        'category' => [
                            'id' => $complaint->category?->id,
                            'name' => $complaint->category?->category_name ?? 'Uncategorized',
                            'penalty_amount' => (double) ($complaint->category?->penalty_amount ?? 0),
                        ],
                        'evidence_count' => $complaint->evidence->count(),
                        'created_at' => $complaint->created_at?->toIso8601String(),
                    ];
                }),
            ],
            200
        );
    }
}
