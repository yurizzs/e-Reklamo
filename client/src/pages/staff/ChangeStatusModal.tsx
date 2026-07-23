import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import { Select, TextArea } from "../../components/ui/forms";
import ComplaintService from "../../services/ComplaintService";
import { notify } from "../../util/notify";

type ComplaintStatus = "new" | "pending" | "resolved";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  complaintId: number | null;
  currentStatus: ComplaintStatus | string;
  complaintTitle: string;
};

interface FormErrors {
  [key: string]: string;
}

const STATUS_OPTIONS: { value: ComplaintStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "text-sky-400" },
  { value: "pending", label: "Pending", color: "text-amber-400" },
  { value: "resolved", label: "Resolved", color: "text-emerald-400" },
];

const statusStyle = (status: string) => {
  if (status === "resolved") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  if (status === "new") return "border-sky-500/20 bg-sky-500/10 text-sky-400";
  return "border-amber-500/20 bg-amber-500/10 text-amber-400";
};

const ChangeStatusModal = ({
  isOpen,
  onClose,
  onSuccess,
  complaintId,
  currentStatus,
  complaintTitle,
}: Props) => {
  const [status, setStatus] = useState<string>("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus || "new");
      setDescription("");
      setErrors({});
    }
  }, [isOpen, currentStatus]);

  const handleClose = () => {
    if (isLoading) return;
    setStatus("");
    setDescription("");
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    if (!complaintId) return;

    // Client-side validation
    const clientErrors: FormErrors = {};
    if (!status) clientErrors.status = "Please select a status.";
    if (!description.trim()) {
      clientErrors.description = "A description is required before changing the status.";
    } else if (description.trim().length < 10) {
      clientErrors.description = "Description must be at least 10 characters.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await ComplaintService.updateStatus(complaintId, { status, description });
      notify.success("Complaint status updated successfully.");
      handleClose();
      onSuccess();
    } catch (error: any) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors && typeof validationErrors === "object") {
        const formattedErrors: FormErrors = {};
        for (const [field, messages] of Object.entries(validationErrors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            formattedErrors[field] = messages[0] as string;
          }
        }
        setErrors(formattedErrors);
        notify.error("Please review the details.");
      } else {
        notify.error("Failed to update complaint status.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = STATUS_OPTIONS.find((o) => o.value === status);
  const hasStatusChanged = status !== currentStatus;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Status"
      size="md"
      primaryAction={{
        label: "Update Status",
        onClick: handleSubmit,
        variant: "primary",
        iconName: "FaArrowsRotate",
        isLoading,
        loadingText: "Updating...",
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
        variant: "secondary",
      }}
    >
      <div className="space-y-5">
        {/* Complaint reference */}
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
            Complaint
          </p>
          <p className="text-sm font-semibold text-slate-200 line-clamp-2">{complaintTitle}</p>
        </div>

        {/* Current → New status visual */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Current
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(currentStatus)}`}
            >
              {currentStatus}
            </span>
          </div>

          {/* Arrow */}
          <svg
            className={`w-5 h-5 flex-shrink-0 transition-colors ${hasStatusChanged ? "text-emerald-400" : "text-slate-600"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>

          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              New
            </span>
            {selectedOption && hasStatusChanged ? (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(status)}`}
              >
                {selectedOption.label}
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                No change
              </span>
            )}
          </div>
        </div>

        {/* Status select */}
        <Select
          label="New Status"
          iconName="FaFilter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            if (errors.status) setErrors((prev) => { const { status: _, ...rest } = prev; return rest; });
          }}
          options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          error={errors.status}
          fullWidth
          required
        />

        {/* Description */}
        <TextArea
          label="Reason / Description"
          placeholder="Describe the reason for this status change (min. 10 characters)…"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => { const { description: _, ...rest } = prev; return rest; });
          }}
          error={errors.description}
          rows={4}
          maxLength={1000}
          showCounter
          fullWidth
          required
        />
      </div>
    </Modal>
  );
};

export default ChangeStatusModal;
