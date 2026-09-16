<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleTypeRequest;
use App\Http\Resources\VehicleTypeResource;
use App\Models\VehicleType;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class VehicleTypeController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of the vehicle categories.
     */
    public function index(Request $request)
    {
        $query = VehicleType::query();

        $filter = $request->input('filter', 'active');

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            'active' => $query->withoutTrashed(),
            default => $query->withoutTrashed(),
        };

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('vehicle_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'vehicle_name');
        $sortOrder = $request->input('sort_order', 'asc');

        $allowedSortFields = ['id', 'vehicle_name', 'description', 'status', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'vehicle_name';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->paginate($perPage);

        return $this->success(
            "Vehicle categories retrieved successfully",
            [
                'vehicle_types' => VehicleTypeResource::collection($paginated->items()),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ]
            ],
            200
        );
    }

    /**
     * Store a newly created vehicle category.
     */
    public function store(VehicleTypeRequest $request)
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? 'active';
        $vehicleType = VehicleType::create($data);

        return $this->success(
            "Vehicle category created successfully",
            VehicleTypeResource::make($vehicleType),
            201
        );
    }

    /**
     * Display the specified vehicle category.
     */
    public function show(VehicleType $vehicleType)
    {
        return $this->success(
            "Vehicle category retrieved successfully",
            VehicleTypeResource::make($vehicleType)
        );
    }

    /**
     * Update the specified vehicle category.
     */
    public function update(VehicleTypeRequest $request, VehicleType $vehicleType)
    {
        $vehicleType->update($request->validated());

        return $this->success(
            "Vehicle category updated successfully",
            VehicleTypeResource::make($vehicleType)
        );
    }

    /**
     * Remove the specified vehicle category.
     */
    public function destroy(VehicleType $vehicleType)
    {
        $vehicleType->delete();

        return $this->success(
            "Vehicle category deleted successfully"
        );
    }

    /**
     * Restore a soft-deleted vehicle category.
     */
    public function restore(string $id)
    {
        $vehicleType = VehicleType::withTrashed()->findOrFail($id);

        if (!$vehicleType->trashed()) {
            return $this->error("Vehicle category is not deleted", 400);
        }

        $vehicleType->restore();

        return $this->success(
            "Vehicle category restored successfully",
            VehicleTypeResource::make($vehicleType),
            200
        );
    }
}
