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

  getById: (id: number) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch complaint details",
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
    evidence: File[];
  }) => {
    const formData = new FormData();
    formData.append("complainant_first_name", data.complainant_first_name);
    formData.append("complainant_last_name", data.complainant_last_name);
    formData.append("driver_id", data.driver_id);
    formData.append("category_id", data.category_id);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("incident_date_time", data.incident_date_time);
    formData.append("incident_location", data.incident_location);
    formData.append("status", data.status);
    data.evidence.forEach((file) => {
      formData.append("evidence[]", file);
    });

    return handleRequest(
      AxiosInstance.post(BASE_PREFIX, formData),
      "Failed to create complaint",
    );
  },

  updateStatus: (id: number, data: { status: string; description: string }) =>
    handleRequest(
      AxiosInstance.patch(`${BASE_PREFIX}/${id}/status`, data),
      "Failed to update complaint status",
    ),

  getAnalytics: (params?: { year?: string; month?: string }) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/analytics`, { params }),
      "Failed to fetch complaint analytics",
    ),
};

export default ComplaintService;
