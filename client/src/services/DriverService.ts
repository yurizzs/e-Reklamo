import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";

const BASE_PREFIX = "drivers";

const DriverService = {
  getRecords: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/records`, { params }),
      "Failed to fetch driver records",
    ),

  getHistory: (id: number) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}/history`),
      "Failed to fetch driver violation history",
    ),
};

export default DriverService;
