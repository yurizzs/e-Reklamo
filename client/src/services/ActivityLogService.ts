import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "activity-logs";

const ActivityLogService = {
  getAll: (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: "timestamp" | "id" | "activity" | "user_id";
    sort_order?: "asc" | "desc";
  }) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}`, { params }),
      "Failed to fetch activity logs"
    ),
};

export default ActivityLogService;

