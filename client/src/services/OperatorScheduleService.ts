import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "operator-schedules";

export interface SchedulePayload {
  employee_id: number;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  status?: string;
  attendance_status?: string;
}

export interface VerifyAttendancePayload {
  employee_id: number;
  live_image: string;
  schedule_date?: string;
}

export interface EmergencyConfirmPayload {
  emergency_reason: string;
  confirmed_by?: number;
}

const OperatorScheduleService = {
  getAll: (params?: { start_date?: string; end_date?: string; employee_id?: number }) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}`, { params }),
      "Failed to fetch schedules"
    ),
  getEmployees: () =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/employees`),
      "Failed to fetch employees"
    ),
  create: (payload: SchedulePayload) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}`, payload),
      "Failed to save schedule"
    ),
  update: (id: number, payload: Partial<SchedulePayload>) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, payload),
      "Failed to update schedule"
    ),
  verifyAttendance: (payload: VerifyAttendancePayload) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/attendance/verify`, payload),
      "Failed to verify facial attendance"
    ),
  emergencyConfirm: (scheduleId: number, payload: EmergencyConfirmPayload) =>
    handleRequest(
      AxiosInstance.post(`${BASE_PREFIX}/${scheduleId}/emergency-confirm`, payload),
      "Failed to record emergency manual confirmation"
    ),
};

export default OperatorScheduleService;
