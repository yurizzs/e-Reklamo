import React, { useState, useRef } from "react";
import { Icon, Button, Modal } from "../../components/ui";
import { InputField, TextArea, Select } from "../../components/ui/forms";
import { notify } from "../../util/notify";
import AnnouncementService from "../../services/AnnouncementService";
import type { AnnouncementRecord } from "./AnnouncementsPage";
import type { NewAnnouncementData } from "./CreateAnnouncementModal";

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementRecord | null;
  onUpdated: (updated: AnnouncementRecord) => void;
}

export const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcement,
  onUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcementType, setAnnouncementType] = useState<"memorandum" | "announcement" | "directive">(
    announcement?.type || "memorandum"
  );
  const [urgency, setUrgency] = useState<"routine" | "priority" | "urgent">(
    announcement?.urgency || "routine"
  );
  const [refNumber, setRefNumber] = useState(
    announcement?.refNumber || announcement?.ref_number || ""
  );
  const [title, setTitle] = useState(announcement?.title || "");
  const [summary, setSummary] = useState(announcement?.summary || "");
  const [legalBasis, setLegalBasis] = useState(
    announcement?.legalBasis || announcement?.legal_basis || ""
  );
  const [issuingOffice, setIssuingOffice] = useState(
    announcement?.issuingOffice || announcement?.issuing_office || "Traffic Management Unit (TMU)"
  );
  const [date, setDate] = useState(announcement?.date || "");
  const [effectiveDate, setEffectiveDate] = useState(
    announcement?.effectiveDate || announcement?.effective_date || ""
  );

  // Image state
  const existingImageUrl =
    announcement?.imageUrl ||
    announcement?.image_url ||
    (announcement?.image
      ? announcement.image.startsWith("http")
        ? announcement.image
        : `${import.meta.env.VITE_STORAGE_URL || "http://localhost:8000/storage"}/${announcement.image}`
      : null);

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(existingImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState<boolean>(false);

  const sigs = announcement?.signatories || [];
  const [primarySigName, setPrimarySigName] = useState(sigs[0]?.name || "Engr. Arnel M. Del Rosario");
  const [primarySigTitle, setPrimarySigTitle] = useState(sigs[0]?.title || "TMU Operations Directorate Specialist");
  const [secondarySigName, setSecondarySigName] = useState(sigs[1]?.name || "P/Supt. Rodrigo M. Valdez");
  const [secondarySigTitle, setSecondarySigTitle] = useState(sigs[1]?.title || "Traffic Enforcement Commander");

  const initialDirectives = announcement?.keyDirectives || announcement?.key_directives || [];
  const [directives, setDirectives] = useState<string[]>(
    Array.isArray(initialDirectives) ? [...initialDirectives] : []
  );
  const [newDirectiveInput, setNewDirectiveInput] = useState("");
  const [publishToMobile, setPublishToMobile] = useState(
    announcement?.publishToMobile ?? announcement?.publish_to_mobile ?? true
  );
  const [sendPushAlert, setSendPushAlert] = useState(
    announcement?.sendPushAlert ?? announcement?.send_push_alert ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !announcement) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify.error("Image file size should not exceed 10MB.");
      return;
    }
    setImageFile(file);
    setRemoveExistingImage(false);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddDirective = () => {
    if (!newDirectiveInput.trim()) return;
    setDirectives([...directives, newDirectiveInput.trim()]);
    setNewDirectiveInput("");
  };

  const handleRemoveDirective = (index: number) => {
    setDirectives(directives.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim() || !summary.trim()) {
      notify.error("Please fill in both the Title and Executive Summary.");
      return;
    }

    const payload: Partial<NewAnnouncementData> = {
      type: announcementType,
      refNumber: refNumber.trim(),
      title: title.trim(),
      summary: summary.trim(),
      image: imageFile,
      removeImage: removeExistingImage,
      issuingOffice: issuingOffice.trim(),
      date: date.trim() || announcement.date,
      effectiveDate: effectiveDate.trim() || undefined,
      urgency,
      legalBasis: legalBasis.trim(),
      keyDirectives: directives,
      signatories: [
        { name: primarySigName.trim(), title: primarySigTitle.trim() },
        { name: secondarySigName.trim(), title: secondarySigTitle.trim() },
      ],
      publishToMobile,
      sendPushAlert,
    };

    setIsSubmitting(true);
    try {
      const res = await AnnouncementService.update(announcement.id, payload);
      notify.success("Announcement updated successfully!");
      if (res && res.data) {
        onUpdated(res.data);
      } else {
        onUpdated({
          ...announcement,
          ...payload,
          ref_number: payload.refNumber,
          issuing_office: payload.issuingOffice,
          effective_date: payload.effectiveDate,
          legal_basis: payload.legalBasis,
          key_directives: payload.keyDirectives,
          publish_to_mobile: payload.publishToMobile,
          send_push_alert: payload.sendPushAlert,
          image: removeExistingImage ? null : imagePreview || announcement.image,
          imageUrl: removeExistingImage ? null : imagePreview || announcement.imageUrl,
          image_url: removeExistingImage ? null : imagePreview || announcement.image_url,
        } as AnnouncementRecord);
      }
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update announcement:", err);
      const message = err instanceof Error ? err.message : "Failed to update announcement.";
      notify.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePhotoDisplay = imagePreview || currentImageUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <Icon iconName="FaPencil" className="text-blue-600 dark:text-blue-400" size={18} />
          <span className="text-base sm:text-lg font-black">Edit Announcement</span>
          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/20">
            {refNumber || `#${announcement.id}`}
          </span>
        </div>
      }
      size="custom"
      customSize="960px"
      primaryAction={{
        label: "Save Changes",
        onClick: handleSubmit,
        isLoading: isSubmitting,
        loadingText: "Saving Changes...",
        variant: "primary",
        iconName: "FaFloppyDisk",
        className: "px-6 py-2.5 font-bold text-xs sm:text-sm",
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        variant: "secondary",
        className: "px-5 py-2.5 font-bold text-xs sm:text-sm",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Classification & Urgency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Document Classification"
            iconName="FaFolderOpen"
            value={announcementType}
            onChange={(e) => setAnnouncementType(e.target.value as "memorandum" | "announcement" | "directive")}
            options={[
              { value: "memorandum", label: "Official Memorandum (Administrative Directives)" },
              { value: "directive", label: "Regulatory Directive (Enforcement & Compliance)" },
              { value: "announcement", label: "Public Advisory (General Notices & Rerouting)" },
            ]}
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold"
            fullWidth
          />

          <Select
            label="Urgency & Priority Level"
            iconName="FaTriangleExclamation"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as "routine" | "priority" | "urgent")}
            options={[
              { value: "routine", label: "Routine (Informational / Standard Circular)" },
              { value: "priority", label: "Priority (Time-sensitive Operational Notice)" },
              { value: "urgent", label: "Urgent (Immediate Enforcement / Public Safety)" },
            ]}
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold"
            fullWidth
          />
        </div>

        {/* Reference & Issuing Office */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Reference Tracking Number"
            iconName="FaBarcode"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
            placeholder="e.g. TMU-MC-2026-10-094"
            className="text-sm font-mono font-bold"
            fullWidth
            required
          />

          <InputField
            label="Issuing Office / Authority"
            iconName="FaBuildingShield"
            value={issuingOffice}
            onChange={(e) => setIssuingOffice(e.target.value)}
            placeholder="e.g. Traffic Management Unit (TMU)"
            className="text-sm font-semibold"
            fullWidth
            required
          />
        </div>

        {/* Date & Effective Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Date of Issuance"
            iconName="FaCalendarDays"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. November 15, 2026"
            className="text-sm"
            fullWidth
          />

          <InputField
            label="Effective Date / Duration"
            iconName="FaClock"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            placeholder="e.g. Immediately / Until Dec 31, 2026"
            className="text-sm"
            fullWidth
          />
        </div>

        {/* Title */}
        <InputField
          label="Announcement / Directive Title"
          iconName="FaHeading"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mandatory Display of Laminated 2026 Tricycle Fare Matrix"
          className="text-sm font-bold py-2.5"
          fullWidth
          required
        />

        {/* Executive Summary */}
        <TextArea
          label="Executive Summary & Rationale"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="State the core directive, purpose, or reason for this memorandum..."
          rows={4}
          maxLength={1000}
          showCounter
          className="text-sm leading-relaxed"
          fullWidth
          required
        />

        {/* Optional Announcement Photo / Flyer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Attached Photo / Flyer Banner (Optional)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              Optional
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />

          {activePhotoDisplay ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10">
              <div className="relative w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 shrink-0">
                <img
                  src={activePhotoDisplay}
                  alt="Announcement banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <Icon iconName="FaImage" size={16} className="text-teal-500" />
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {imageFile?.name || "Current Announcement Image"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {imageFile
                    ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB • ${imageFile.type}`
                    : "Displayed in citizen mobile app and public notices."}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold"
                  >
                    Replace Image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Remove Image
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-black/15 hover:bg-blue-50/20 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Icon iconName="FaImage" size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Click to attach or upload a photo or flyer banner
              </span>
              <span className="text-[11px] text-slate-400">
                PNG, JPG, WebP up to 10MB
              </span>
            </div>
          )}
        </div>

        {/* Legal / Statutory Basis */}
        <InputField
          label="Legal & Statutory Basis"
          iconName="FaGavel"
          value={legalBasis}
          onChange={(e) => setLegalBasis(e.target.value)}
          placeholder="e.g. Roxas City Ordinance No. 024-2024 & Municipal Transportation Code"
          className="text-sm font-semibold"
          fullWidth
        />

        {/* Dynamic Directives */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                Operative Provisions & Directives ({directives.length})
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Individual numbered items enforced on Operator and Citizen apps.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDirectiveInput}
              onChange={(e) => setNewDirectiveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDirective();
                }
              }}
              placeholder="Type directive provision and click Add..."
              className="flex-1 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <Button
              type="button"
              onClick={handleAddDirective}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs font-bold px-4 rounded-xl"
            >
              + Add Directive
            </Button>
          </div>

          <div className="space-y-2">
            {directives.map((dir, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1 text-slate-700 dark:text-slate-300 font-medium">
                  {dir}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveDirective(idx)}
                  className="text-slate-400 hover:text-red-500 font-bold px-1"
                  title="Remove directive"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Signatories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Primary Signatory
            </span>
            <InputField
              value={primarySigName}
              onChange={(e) => setPrimarySigName(e.target.value)}
              placeholder="Full Name"
              className="text-sm font-semibold"
              fullWidth
            />
            <InputField
              value={primarySigTitle}
              onChange={(e) => setPrimarySigTitle(e.target.value)}
              placeholder="Official Title"
              className="text-xs"
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Attesting Official
            </span>
            <InputField
              value={secondarySigName}
              onChange={(e) => setSecondarySigName(e.target.value)}
              placeholder="Full Name"
              className="text-sm font-semibold"
              fullWidth
            />
            <InputField
              value={secondarySigTitle}
              onChange={(e) => setSecondarySigTitle(e.target.value)}
              placeholder="Official Title"
              className="text-xs"
              fullWidth
            />
          </div>
        </div>

        {/* Distribution Channels */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-1">
            Broadcast Distribution Channels
          </span>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={publishToMobile}
              onChange={(e) => setPublishToMobile(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Publish live to citizen mobile app announcement feed
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sendPushAlert}
              onChange={(e) => setSendPushAlert(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Broadcast notification ping to connected devices
            </span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default EditAnnouncementModal;
