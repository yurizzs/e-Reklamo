<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Traits\ApiResponse;

class OperatorScheduleController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DB::table('operator_schedules as os')
            ->join('employees as e', 'e.id', '=', 'os.employee_id');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('os.schedule_date', [$request->input('start_date'), $request->input('end_date')]);
        } elseif ($request->filled('start_date')) {
            $query->where('os.schedule_date', '>=', $request->input('start_date'));
        }

        $records = $query->select(
                'os.id',
                'os.employee_id',
                'os.schedule_date',
                'os.shift_start',
                'os.shift_end',
                'os.shift_type',
                'os.status',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as name"),
                'e.username',
                'e.position',
                'e.role'
            )
            ->orderBy('os.schedule_date')
            ->get();

        return $this->success('Schedules retrieved successfully', $records, 200);
    }

    public function employees()
    {
        $employees = DB::table('employees')
            ->select('id', 'first_name', 'last_name', 'username', 'position', 'role')
            ->orderBy('first_name')
            ->get();

        return $this->success('Employees retrieved successfully', $employees, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'schedule_date' => ['required', 'string'],
            'shift_start' => ['required', 'string'],
            'shift_end' => ['required', 'string'],
            'shift_type' => ['required', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $existing = DB::table('operator_schedules')
            ->where('employee_id', $validated['employee_id'])
            ->where('schedule_date', $validated['schedule_date'])
            ->first();

        if ($existing) {
            DB::table('operator_schedules')->where('id', $existing->id)->update([
                ...$validated,
                'updated_at' => now(),
            ]);

            return $this->success('Schedule updated successfully', ['id' => $existing->id], 200);
        }

        $schedule = DB::table('operator_schedules')->insertGetId([
            ...$validated,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->success('Schedule created successfully', ['id' => $schedule], 201);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'exists:employees,id'],
            'schedule_date' => ['nullable', 'string'],
            'shift_start' => ['nullable', 'string'],
            'shift_end' => ['nullable', 'string'],
            'shift_type' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $updated = DB::table('operator_schedules')->where('id', $id)->update([
            ...$validated,
            'updated_at' => now(),
        ]);

        return $this->success($updated ? 'Schedule updated successfully' : 'Schedule not found', ['updated' => $updated], 200);
    }
}
