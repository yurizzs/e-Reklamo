<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ViolationCategoryRequest;
use App\Http\Resources\ViolationCategoryResource;
use App\Models\ViolationCategory;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class ViolationCategoryController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ViolationCategory::query();

        // Handle soft deletes - exclude deleted categories by default
        $filter = $request->input('filter', 'active'); // active, deleted, all

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            'active' => $query->withoutTrashed(),
            default => $query->withoutTrashed(),
        };

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('category_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'category_name');
        $sortOrder = $request->input('sort_order', 'asc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['category_name', 'description', 'penalty_amount', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'category_name';
        }

        // Validate sort order
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->paginate($perPage);

        return $this->success(
            "Violation categories retrieved successfully",
            [
                'violation_categories' => ViolationCategoryResource::collection($paginated->items()),
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
     * Store a newly created resource in storage.
     */
    public function store(ViolationCategoryRequest $request)
    {
        $violationCategory = ViolationCategory::create($request->validated());

        return $this->success(
            "Violation category created successfully",
            ViolationCategoryResource::make($violationCategory),
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(ViolationCategory $violationCategory)
    {
        return $this->success(
            "Violation category retrieved successfully",
            ViolationCategoryResource::make($violationCategory)
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ViolationCategoryRequest $request, ViolationCategory $violationCategory)
    {
        $violationCategory->update($request->validated());

        return $this->success(
            "Violation category updated successfully",
            ViolationCategoryResource::make($violationCategory)
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ViolationCategory $violationCategory)
    {
        $violationCategory->delete();

        return $this->success(
            "Violation category deleted successfully"
        );
    }

    /**
     * Restore a soft-deleted violation category.
     */
    public function restore(string $id)
    {
        $violationCategory = ViolationCategory::withTrashed()->findOrFail($id);

        if (!$violationCategory->trashed()) {
            return $this->error("Violation category is not deleted", 400);
        }

        $violationCategory->restore();

        return $this->success(
            "Violation category restored successfully",
            ViolationCategoryResource::make($violationCategory),
            200
        );
    }
}
