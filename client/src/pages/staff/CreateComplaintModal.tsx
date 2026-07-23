import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import { InputField, Select, TextArea } from "../../components/ui/forms";
import ComplaintService from "../../services/ComplaintService";
import { notify } from "../../util/notify";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Option = {
  id: number;
  name?: string;
  category_name?: string;
  plate_number?: string;
};

interface ComplaintFormData {
  complainant_first_name: string;
  complainant_last_name: string;
  driver_id: string;
  category_id: string;
  title: string;
  description: string;
  incident_date_time: string;
  incident_location: string;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialForm: ComplaintFormData = {
  complainant_first_name: "",
  complainant_last_name: "",
  driver_id: "",
  category_id: "",
  title: "",
  description: "",
  incident_date_time: "",
  incident_location: "",
  status: "new",
};

const CreateComplaintModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState<ComplaintFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [drivers, setDrivers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceError, setEvidenceError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const MAX_FILES = 3;

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsOptionsLoading(true);

      try {
        const response = (await ComplaintService.getOptions()) as any;
        const payload = response?.data ?? response;

        setDrivers(payload?.drivers ?? []);
        setCategories(payload?.categories ?? []);
      } catch {
        setDrivers([]);
        setCategories([]);
      } finally {
        setIsOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  const handleChange = (name: keyof ComplaintFormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setForm(initialForm);
    setErrors({});
    setEvidenceFiles([]);
    setEvidenceError("");
    onClose();
  };

  // ─── File Handling ─────────────────────────────────────────────────────────
  const ACCEPTED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm",
  ];

  const isAccepted = (file: File) => ACCEPTED_TYPES.includes(file.type);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(isAccepted);
    const invalid = Array.from(incoming).length - valid.length;

    setEvidenceFiles((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) {
        setEvidenceError(`You can only attach a maximum of ${MAX_FILES} files.`);
        return prev;
      }
      const capped = valid.slice(0, remaining);
      const skippedByLimit = valid.length - capped.length;

      if (invalid > 0 || skippedByLimit > 0) {
        setEvidenceError(
          invalid > 0
            ? "Some files were skipped — only images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, WebM) are allowed."
            : `Maximum ${MAX_FILES} files allowed. Extra files were ignored.`,
        );
      } else {
        setEvidenceError("");
      }

      return [...prev, ...capped];
    });
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getPreview = (file: File) => {
    if (file.type.startsWith("image/")) return URL.createObjectURL(file);
    return null;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Client-side evidence validation
    if (evidenceFiles.length === 0) {
      setEvidenceError("Please attach at least 1 image or video as evidence.");
      return;
    }

    setIsLoading(true);
    setErrors({});
    setEvidenceError("");

    try {
      await ComplaintService.create({ ...form, evidence: evidenceFiles });
      notify.success("Complaint added successfully.");
      setForm(initialForm);
      setEvidenceFiles([]);
      onClose();
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

        // Surface evidence array error
        if (
          formattedErrors["evidence"] ||
          formattedErrors["evidence.0"] ||
          formattedErrors["evidence.1"] ||
          formattedErrors["evidence.2"]
        ) {
          setEvidenceError(
            formattedErrors["evidence"] ||
              formattedErrors["evidence.0"] ||
              "Please ensure all evidence files are valid images or videos.",
          );
          delete formattedErrors["evidence"];
        }

        setErrors(formattedErrors);
        notify.error("Please review the complaint details.");
      } else {
        notify.error("Failed to add complaint.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Complaint"
      size="lg"
      primaryAction={{
        label: "Add Complaint",
        onClick: handleSubmit,
        variant: "primary",
        iconName: "FaFloppyDisk",
        isLoading,
        loadingText: "Saving...",
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
        variant: "secondary",
      }}
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Complainant First Name"
            iconName="FaUser"
            placeholder="Enter first name"
            value={form.complainant_first_name}
            onChange={(event) =>
              handleChange("complainant_first_name", event.target.value)
            }
            error={errors.complainant_first_name}
            fullWidth
            required
          />

          <InputField
            label="Complainant Last Name"
            iconName="FaUser"
            placeholder="Enter last name"
            value={form.complainant_last_name}
            onChange={(event) =>
              handleChange("complainant_last_name", event.target.value)
            }
            error={errors.complainant_last_name}
            fullWidth
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Driver"
            iconName="FaIdCard"
            value={form.driver_id}
            onChange={(event) => handleChange("driver_id", event.target.value)}
            options={[
              {
                value: "",
                label: isOptionsLoading
                  ? "Loading drivers..."
                  : "Select driver",
              },
              ...drivers.map((driver) => ({
                value: driver.id.toString(),
                label: `${driver.name || `Driver #${driver.id}`}${driver.plate_number ? ` - ${driver.plate_number}` : ""}`,
              })),
            ]}
            error={errors.driver_id}
            disabled={isOptionsLoading}
            fullWidth
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Category"
            iconName="FaListUl"
            value={form.category_id}
            onChange={(event) =>
              handleChange("category_id", event.target.value)
            }
            options={[
              {
                value: "",
                label: isOptionsLoading
                  ? "Loading categories..."
                  : "Select category",
              },
              ...categories.map((category) => ({
                value: category.id.toString(),
                label: category.category_name || `Category #${category.id}`,
              })),
            ]}
            error={errors.category_id}
            disabled={isOptionsLoading}
            fullWidth
            required
          />

          <Select
            label="Status"
            iconName="FaFilter"
            value={form.status}
            onChange={(event) => handleChange("status", event.target.value)}
            options={[
              { value: "new", label: "New" },
              { value: "pending", label: "Pending" },
              { value: "resolved", label: "Resolved" },
            ]}
            error={errors.status}
            fullWidth
          />
        </div>

        <InputField
          label="Title"
          iconName="FaPen"
          placeholder="Enter complaint title"
          value={form.title}
          onChange={(event) => handleChange("title", event.target.value)}
          error={errors.title}
          fullWidth
          required
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Incident Time"
            type="datetime-local"
            iconName="FaCalendarDays"
            value={form.incident_date_time}
            onChange={(event) =>
              handleChange("incident_date_time", event.target.value)
            }
            error={errors.incident_date_time}
            fullWidth
            required
          />

          <InputField
            label="Incident Location"
            iconName="FaLocationDot"
            placeholder="Enter incident location"
            value={form.incident_location}
            onChange={(event) =>
              handleChange("incident_location", event.target.value)
            }
            error={errors.incident_location}
            fullWidth
            required
          />
        </div>

        <TextArea
          label="Description"
          placeholder="Enter complaint details"
          value={form.description}
          onChange={(event) => handleChange("description", event.target.value)}
          error={errors.description}
          rows={4}
          maxLength={1000}
          showCounter
          fullWidth
          required
        />

        {/* ── Evidence Upload ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1">
            Evidence <span className="text-danger">*</span>
            <span className="ml-2 font-normal normal-case tracking-normal text-xs text-text-muted">
              Max. {MAX_FILES} files &bull; Images &amp; Videos (max 50 MB each)
            </span>
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("evidence-input")?.click()}
            className={[
              "relative cursor-pointer border rounded-xl bg-bg-light min-h-32 p-4",
              "flex items-center justify-center transition-all duration-200",
              "hover:border-primary/40",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border-muted",
              evidenceError ? "border-danger bg-danger/5" : "",
            ].join(" ")}
          >
            <input
              id="evidence-input"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mpeg,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            {evidenceFiles.length === 0 ? (
              <div className="flex flex-col items-center gap-1 text-center pointer-events-none">
                <svg
                  className="w-8 h-8 text-text-muted mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-text">
                  Click or drag files to upload
                </span>
                <span className="text-xs text-text-muted">
                  Images (JPEG, PNG, GIF, WebP) &bull; Videos (MP4, MOV, WebM)
                  &bull; Max. {MAX_FILES} files
                </span>
              </div>
            ) : (
              <div className="w-full grid grid-cols-3 gap-2 pointer-events-none">
                {evidenceFiles.map((file, idx) => {
                  const preview = getPreview(file);
                  return (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden aspect-square bg-bg-dark pointer-events-auto"
                    >
                      {preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <svg
                            className="w-6 h-6 text-primary/70"
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
                          <span className="text-xs text-text-muted text-center line-clamp-2">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-danger text-white rounded-full p-0.5 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {/* Add-more tile — only shown when under the limit */}
                {evidenceFiles.length < MAX_FILES && (
                  <div
                    className="rounded-lg border border-dashed border-border-muted aspect-square bg-bg-dark flex flex-col items-center justify-center gap-1 text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("evidence-input")?.click();
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    <span className="text-xs">Add more</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Counter + error */}
          <div className="flex items-center justify-between ml-1">
            <span
              className={[
                "text-xs font-medium",
                evidenceFiles.length === MAX_FILES
                  ? "text-emerald-400"
                  : "text-text-muted",
              ].join(" ")}
            >
              {evidenceFiles.length} / {MAX_FILES} files selected
              {evidenceFiles.length === MAX_FILES && " ✓ (max reached)"}
            </span>
          </div>

          {evidenceError && (
            <span className="text-sm font-medium text-danger ml-1">
              {evidenceError}
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default CreateComplaintModal;
