import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "operator-schedules";

interface SchedulePayload {
  employee_id: number;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  status?: string;
}

const OperatorScheduleService = {
  getAll: (params?: { start_date?: string; end_date?: string }) =>
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
};

export default OperatorScheduleService;
