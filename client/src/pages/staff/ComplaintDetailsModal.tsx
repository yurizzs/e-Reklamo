import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import { Button, LoadingSpinner } from "../../components/ui";
import ComplaintService from "../../services/ComplaintService";
import ChangeStatusModal from "./ChangeStatusModal";

export interface EvidenceItem {
  id: number;
  file_path: string;
  file_url: string;
  file_type: "image" | "video" | string;
}

export interface StatusHistoryItem {
  id: number;
  old_status: string;
  new_status: string;
  remarks: string;
  changed_by: string;
  created_at: string;
}

export interface ComplaintDetail {
  id: number;
  complainant: {
    first_name: string | null;
    last_name: string | null;
    address?: string | null;
    contact_number?: string | null;
    name: string;
  };
  user?: {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
  };
  driver: {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
    plate_number?: string;
  };
  category: {
    id: number | null;
    category_name: string | null;
  };
  title: string;
  description: string;
  incident_location: string;
  status: string;
  incident_date_time: string;
  created_at?: string;
  evidence: EvidenceItem[];
  status_histories: StatusHistoryItem[];
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  complaintId: number | null;
  onStatusUpdated?: () => void;
};

const statusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "resolved") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }
  if (normalized === "unresolved") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-400";
  }
  if (normalized === "new") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-400";
  }
  return "border-amber-500/20 bg-amber-500/10 text-amber-400";
};

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ComplaintDetailsModal = ({
  isOpen,
  onClose,
  complaintId,
  onStatusUpdated,
}: Props) => {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<EvidenceItem | null>(null);

  const fetchDetails = async () => {
    if (!complaintId) return;
    setIsLoading(true);
    try {
      const response = (await ComplaintService.getById(complaintId)) as any;
      const data = response?.data ?? response;
      setComplaint(data);
    } catch {
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && complaintId) {
      fetchDetails();
    } else {
      setComplaint(null);
      setActiveMedia(null);
    }
  }, [isOpen, complaintId]);

  const handleStatusChangeSuccess = () => {
    fetchDetails();
    if (onStatusUpdated) onStatusUpdated();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Complaint Details"
        size="xl"
        secondaryAction={{
          label: "Close",
          onClick: onClose,
          variant: "secondary",
        }}
      >
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner text="Fetching complaint details..." />
          </div>
        ) : !complaint ? (
          <div className="py-16 text-center text-slate-400">
            Complaint details could not be loaded.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header section with Title & Status Change Action */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(
                      complaint.status,
                    )}`}
                  >
                    {complaint.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ID #{complaint.id}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{complaint.title}</h2>
              </div>

              {/* Action Button: Change Status */}
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsChangeStatusOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shrink-0"
              >
                Change Status
              </Button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Complainant */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Complainant
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {complaint.complainant?.name || "N/A"}
                </p>
                {complaint.complainant?.contact_number && (
                  <p className="text-xs text-slate-400">
                    <span className="font-medium text-slate-500">Contact:</span> {complaint.complainant.contact_number}
                  </p>
                )}
                {complaint.complainant?.address && (
                  <p className="text-xs text-slate-400">
                    <span className="font-medium text-slate-500">Address:</span> {complaint.complainant.address}
                  </p>
                )}
              </div>

              {/* Driver */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Driver
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {complaint.driver?.name || "N/A"}
                  {complaint.driver?.plate_number && (
                    <span className="ml-2 text-xs font-mono text-emerald-400">
                      ({complaint.driver.plate_number})
                    </span>
                  )}
                </p>
              </div>

              {/* Category */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Violation Category
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {complaint.category?.category_name || "Uncategorized"}
                </p>
              </div>

              {/* Incident Location */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Incident Location
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {complaint.incident_location || "N/A"}
                </p>
              </div>

              {/* Incident Time */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Incident Date & Time
                </p>
                <p className="text-sm font-mono text-slate-300">
                  {formatDateTime(complaint.incident_date_time)}
                </p>
              </div>

              {/* Submitted At */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Submitted At
                </p>
                <p className="text-sm font-mono text-slate-300">
                  {formatDateTime(complaint.created_at)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Description
              </p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {complaint.description || "No description provided."}
              </p>
            </div>

            {/* Evidence Files */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Evidence ({complaint.evidence?.length || 0} files attached)
                </p>
              </div>

              {!complaint.evidence || complaint.evidence.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No evidence uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {complaint.evidence.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveMedia(item)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 aspect-video transition-all hover:border-emerald-500/50 hover:shadow-lg"
                    >
                      {item.file_type === "image" ||
                      item.file_path.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                        <img
                          src={item.file_url}
                          alt="Evidence"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/80 p-2 text-center">
                          <svg
                            className="w-8 h-8 text-emerald-400 mb-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                          </svg>
                          <span className="text-[10px] text-slate-300 font-mono">
                            Video Evidence
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">
                          Click to View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Change History */}
            {complaint.status_histories && complaint.status_histories.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Status History ({complaint.status_histories.length})
                </p>
                <div className="space-y-3">
                  {complaint.status_histories.map((history) => (
                    <div
                      key={history.id}
                      className="flex flex-col gap-1 border-l-2 border-emerald-500/40 pl-3 py-1 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${statusStyle(
                            history.old_status,
                          )}`}
                        >
                          {history.old_status}
                        </span>
                        <span className="text-slate-500">&rarr;</span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${statusStyle(
                            history.new_status,
                          )}`}
                        >
                          {history.new_status}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-slate-500">
                          {formatDateTime(history.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-300 font-normal mt-1">{history.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Change Status Modal */}
      <ChangeStatusModal
        isOpen={isChangeStatusOpen}
        onClose={() => setIsChangeStatusOpen(false)}
        onSuccess={handleStatusChangeSuccess}
        complaintId={complaint?.id ?? null}
        currentStatus={complaint?.status ?? "new"}
        complaintTitle={complaint?.title ?? ""}
      />

      {/* Lightbox / Full Media View Modal */}
      {activeMedia && (
        <Modal
          isOpen={!!activeMedia}
          onClose={() => setActiveMedia(null)}
          title="Evidence Media"
          size="lg"
        >
          <div className="flex flex-col items-center justify-center p-2">
            {activeMedia.file_type === "image" ||
            activeMedia.file_path.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
              <img
                src={activeMedia.file_url}
                alt="Evidence Full View"
                className="max-h-[70vh] rounded-xl object-contain"
              />
            ) : (
              <video
                src={activeMedia.file_url}
                controls
                autoPlay
                className="max-h-[70vh] w-full rounded-xl"
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ComplaintDetailsModal;
