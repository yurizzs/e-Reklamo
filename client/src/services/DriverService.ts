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

  updateDriver: (
    id: number,
    data: {
      first_name: string;
      middle_name?: string;
      last_name: string;
      suffix_1name?: string;
      address: string;
    },
  ) =>
    handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, data),
      "Failed to update driver details",
    ),
};

export default DriverService;
