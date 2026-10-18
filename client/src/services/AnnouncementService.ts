import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { NewAnnouncementData } from "../pages/staff/CreateAnnouncementModal";

const BASE_PREFIX = "announcements";

const AnnouncementService = {
  getAll: (params?: { search?: string; type?: string; urgency?: string }) =>
    handleRequest(
      AxiosInstance.get(BASE_PREFIX, { params }),
      "Failed to fetch announcements",
    ),

  getById: (id: number | string) =>
    handleRequest(
      AxiosInstance.get(`${BASE_PREFIX}/${id}`),
      "Failed to fetch announcement details",
    ),

  create: (data: NewAnnouncementData) =>
    handleRequest(
      AxiosInstance.post(BASE_PREFIX, data),
      "Failed to publish announcement",
    ),

  delete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
      "Failed to delete announcement",
    ),
};

export default AnnouncementService;
