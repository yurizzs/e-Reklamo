import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "complaints";

const ComplaintService = {
  getOptions: () =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/options`),
      "Failed to fetch complaint form options",
    ),

  getAll: (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch complaints",
    ),

  create: (data: {
    complainant_first_name: string;
    complainant_last_name: string;
    driver_id: string;
    category_id: string;
    title: string;
    description: string;
    incident_date_time: string;
    incident_location: string;
    status: string;
  }) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to create complaint",
    ),
};

export default ComplaintService;
