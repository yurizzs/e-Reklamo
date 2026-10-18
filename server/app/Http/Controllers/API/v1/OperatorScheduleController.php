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
            ->join('employees as e', 'e.id', '=', 'os.employee_id')
            ->leftJoin('employees as conf', 'conf.id', '=', 'os.confirmed_by');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('os.schedule_date', [$request->input('start_date'), $request->input('end_date')]);
        } elseif ($request->filled('start_date')) {
            $query->where('os.schedule_date', '>=', $request->input('start_date'));
        }

        if ($request->filled('employee_id')) {
            $query->where('os.employee_id', $request->input('employee_id'));
        }

        $records = $query->select(
                'os.id',
                'os.employee_id',
                'os.schedule_date',
                'os.shift_start',
                'os.shift_end',
                'os.shift_type',
                'os.status',
                'os.attendance_status',
                'os.verified_at',
                'os.verification_method',
                'os.confidence_score',
                'os.confirmed_by',
                'os.emergency_reason',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as name"),
                'e.username',
                'e.position',
                'e.role',
                DB::raw("CONCAT(conf.first_name, ' ', conf.last_name) as confirmed_by_name")
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
            'attendance_status' => ['nullable', 'string'],
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
            'attendance_status' => ['nullable', 'string'],
        ]);

        $updated = DB::table('operator_schedules')->where('id', $id)->update([
            ...$validated,
            'updated_at' => now(),
        ]);

        return $this->success($updated ? 'Schedule updated successfully' : 'Schedule not found', ['updated' => $updated], 200);
    }

    /**
     * In-Memory Biometric Facial Verification using Python OpenCV
     * Validates face scan, saves zero images to disk, records confidence score & timestamp.
     */
    public function verifyAttendance(Request $request)
    {
        $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'live_image' => ['required', 'string'],
            'schedule_date' => ['nullable', 'string'],
        ]);

        $employeeId = $request->input('employee_id');
        $scheduleDate = $request->input('schedule_date', now()->format('Y-m-d'));
        $liveImage = $request->input('live_image');

        // Execute Python verification script in-memory via stdin
        $scriptPath = base_path('scripts/verify_face.py');
        $pythonBinary = 'python';

        $descriptors = [
            0 => ['pipe', 'r'], // stdin
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ];

        $process = proc_open("{$pythonBinary} \"{$scriptPath}\"", $descriptors, $pipes, base_path());

        if (!is_resource($process)) {
            return $this->error('Failed to initialize facial recognition engine', 500);
        }

        $inputPayload = json_encode([
            'employee_id' => $employeeId,
            'live_image' => $liveImage,
        ]);

        fwrite($pipes[0], $inputPayload);
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $returnCode = proc_close($process);

        $result = json_decode($stdout, true);

        if (!$result || empty($result['success']) || empty($result['verified'])) {
            $msg = $result['message'] ?? 'Facial recognition failed to verify biometric presence.';
            return $this->error($msg, 422, ['details' => $result]);
        }

        $confidence = $result['confidence'] ?? 95.0;

        // Locate or create the operator schedule record for the given date
        $schedule = DB::table('operator_schedules')
            ->where('employee_id', $employeeId)
            ->where('schedule_date', $scheduleDate)
            ->first();

        $updateData = [
            'attendance_status' => 'verified',
            'verified_at' => now(),
            'verification_method' => 'facial_recognition',
            'confidence_score' => $confidence,
            'updated_at' => now(),
        ];

        if ($schedule) {
            DB::table('operator_schedules')->where('id', $schedule->id)->update($updateData);
            $scheduleId = $schedule->id;
        } else {
            $scheduleId = DB::table('operator_schedules')->insertGetId([
                'employee_id' => $employeeId,
                'schedule_date' => $scheduleDate,
                'shift_start' => now()->format('H:i'),
                'shift_end' => now()->addHours(8)->format('H:i'),
                'shift_type' => 'Morning',
                'status' => 'active',
                ...$updateData,
                'created_at' => now(),
            ]);
        }

        return $this->success('Attendance verified successfully via facial recognition', [
            'schedule_id' => $scheduleId,
            'attendance_status' => 'verified',
            'confidence_score' => $confidence,
            'verified_at' => now()->toIso8601String(),
            'metrics' => $result['metrics'] ?? null,
        ], 200);
    }

    /**
     * Emergency Manual Confirmation
     * Allows supervisor/staff to manually confirm attendance when facial recognition isn't usable.
     */
    public function emergencyConfirm(Request $request, string $id)
    {
        $validated = $request->validate([
            'emergency_reason' => ['required', 'string', 'min:3'],
            'confirmed_by' => ['nullable', 'exists:employees,id'],
        ]);

        $schedule = DB::table('operator_schedules')->where('id', $id)->first();
        if (!$schedule) {
            return $this->error('Schedule record not found', 404);
        }

        $confirmedBy = $validated['confirmed_by'] ?? auth('sanctum')->id();

        DB::table('operator_schedules')->where('id', $id)->update([
            'attendance_status' => 'emergency_manual',
            'verified_at' => now(),
            'verification_method' => 'manual_emergency',
            'confidence_score' => null,
            'confirmed_by' => $confirmedBy,
            'emergency_reason' => $validated['emergency_reason'],
            'updated_at' => now(),
        ]);

        return $this->success('Attendance manually confirmed for emergency duty', [
            'schedule_id' => $id,
            'attendance_status' => 'emergency_manual',
            'verification_method' => 'manual_emergency',
            'emergency_reason' => $validated['emergency_reason'],
            'verified_at' => now()->toIso8601String(),
        ], 200);
    }
}
