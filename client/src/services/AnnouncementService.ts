import AxiosInstance from "../api/AxiosIntance";
import { handleRequest } from "../api/apiHandler";
import type { NewAnnouncementData } from "../pages/staff/CreateAnnouncementModal";

const BASE_PREFIX = "announcements";

const buildFormData = (data: Partial<NewAnnouncementData>): FormData => {
  const fd = new FormData();
  if (data.type) fd.append("type", data.type);
  if (data.refNumber) fd.append("ref_number", data.refNumber);
  if (data.title) fd.append("title", data.title);
  if (data.summary) fd.append("summary", data.summary);
  if (data.issuingOffice) fd.append("issuing_office", data.issuingOffice);
  if (data.date) fd.append("date", data.date);
  if (data.effectiveDate) fd.append("effective_date", data.effectiveDate);
  if (data.urgency) fd.append("urgency", data.urgency);
  if (data.legalBasis) fd.append("legal_basis", data.legalBasis);
  if (data.keyDirectives) fd.append("key_directives", JSON.stringify(data.keyDirectives));
  if (data.signatories) fd.append("signatories", JSON.stringify(data.signatories));
  if (typeof data.publishToMobile === "boolean") fd.append("publish_to_mobile", data.publishToMobile ? "1" : "0");
  if (typeof data.sendPushAlert === "boolean") fd.append("send_push_alert", data.sendPushAlert ? "1" : "0");
  if (data.image instanceof File) {
    fd.append("image", data.image);
  } else if (data.removeImage) {
    fd.append("remove_image", "1");
  }
  return fd;
};

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

  create: (data: NewAnnouncementData | FormData) => {
    const isFormData = data instanceof FormData;
    const hasImage = !isFormData && data.image instanceof File;
    const payload = isFormData ? data : hasImage ? buildFormData(data) : data;
    return handleRequest(
      AxiosInstance.post(
        BASE_PREFIX,
        payload,
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      ),
      "Failed to publish announcement",
    );
  },

  update: (id: number | string, data: Partial<NewAnnouncementData> | FormData) => {
    const isFormData = data instanceof FormData;
    const hasImage = !isFormData && (data.image instanceof File || data.removeImage);
    const payload = isFormData ? data : hasImage ? buildFormData(data) : data;

    if (payload instanceof FormData) {
      return handleRequest(
        AxiosInstance.post(`${BASE_PREFIX}/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        "Failed to update announcement",
      );
    }

    return handleRequest(
      AxiosInstance.put(`${BASE_PREFIX}/${id}`, payload),
      "Failed to update announcement",
    );
  },

  delete: (id: number | string) =>
    handleRequest(
      AxiosInstance.delete(`${BASE_PREFIX}/${id}`),
      "Failed to delete announcement",
    ),
};

export default AnnouncementService;
