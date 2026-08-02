<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Traits\ApiResponse;

class UserController extends Controller
{
    use ApiResponse;

    public function stats()
    {
        return $this->success(
            "User statistics retrieved successfully",
            [
                'total' => Employee::count(),
                'admins' => Employee::where('role', 'admin')->count(),
                'operators' => Employee::whereIn('role', ['operator'])->count(),
                'users' => User::where('role', 'citizen')->count(),
            ],
            200
        );
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Employee::query();

        // Handle soft deletes - exclude deleted employees by default
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
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'first_name');
        $sortOrder = $request->input('sort_order', 'asc');

        $allowedSortFields = ['first_name', 'last_name', 'role', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'first_name';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->paginate($perPage);

        return $this->success(
            "Users retrieved successfully",
            [
                'users' => UserResource::collection($paginated->items()),
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
    public function store(UserRequest $request)
    {
        $validated = $request->validated();

        if (isset($validated['suffix_1name']) && !isset($validated['suffix_name'])) {
            $validated['suffix_name'] = $validated['suffix_1name'];
        }
        if (!isset($validated['position'])) {
            $validated['position'] = ucfirst($validated['role'] ?? 'Operator');
        }

        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $filename = time() . '_' . uniqid() . '.' . $avatarFile->getClientOriginalExtension();
            $path = $avatarFile->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        }

        $employee = Employee::create($validated);

        return $this->success(
            "User created successfully",
            ['user' => new UserResource($employee)],
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug)
    {
        $employee = Employee::withTrashed()->where('slug', $slug)->firstOrFail();

        return $this->success(
            "User retrieved successfully",
            ['user' => new UserResource($employee)],
            200
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, string $id)
    {
        $employee = Employee::withTrashed()->where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $validated = $request->validated();

        if (isset($validated['suffix_1name']) && !isset($validated['suffix_name'])) {
            $validated['suffix_name'] = $validated['suffix_1name'];
        }

        if ($request->hasFile('avatar')) {
            if ($employee->avatar && Storage::disk('public')->exists($employee->avatar)) {
                Storage::disk('public')->delete($employee->avatar);
            }

            $avatarFile = $request->file('avatar');
            $filename = time() . '_' . uniqid() . '.' . $avatarFile->getClientOriginalExtension();
            $path = $avatarFile->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        } else {
            unset($validated['avatar']);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
            unset($validated['password_confirmation']);
        }

        unset($validated['password_confirmation']);

        $employee->update($validated);

        return $this->success(
            "User updated successfully",
            ['user' => new UserResource($employee)],
            200
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $employee = Employee::withTrashed()->where('id', $id)->orWhere('slug', $id)->firstOrFail();

        if ((int) $request->user()->id === (int) $employee->id && get_class($request->user()) === Employee::class) {
            return $this->error("You cannot delete your own account.", 400);
        }

        if ($employee->trashed()) {
            return $this->error("User is already deleted", 400);
        }

        $employee->delete();

        return $this->success(
            "User deleted successfully",
            null,
            200
        );
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore(string $id)
    {
        $employee = Employee::withTrashed()->where('id', $id)->orWhere('slug', $id)->firstOrFail();

        if (!$employee->trashed()) {
            return $this->error("User is not deleted", 400);
        }

        $employee->restore();

        return $this->success(
            "User restored successfully",
            ['user' => new UserResource($employee)],
            200
        );
    }
}
