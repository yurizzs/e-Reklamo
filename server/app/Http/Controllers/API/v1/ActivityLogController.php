<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = ActivityLog::query()->with(['user:id,name,username,role']);

        if ($request->has('search') && !empty($request->search)) {
            $search = (string) $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('activity', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        $sortBy = $request->input('sort_by', 'timestamp');
        $sortOrder = strtolower((string) $request->input('sort_order', 'desc'));

        $allowedSortFields = ['timestamp', 'id', 'activity', 'user_id'];
        if (!in_array($sortBy, $allowedSortFields, true)) {
            $sortBy = 'timestamp';
        }

        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }

        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('limit', 25);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->paginate($perPage);

        return $this->success(
            'Activity logs retrieved successfully',
            [
                'logs' => ActivityLogResource::collection($paginated->getCollection()),
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
}

