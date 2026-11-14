import React, { useState } from "react";
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <Icon iconName="FaPencil" className="text-blue-600 dark:text-blue-400" size={16} />
          <span>Edit Announcement</span>
          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-500/20">
            {refNumber || `#${announcement.id}`}
          </span>
        </div>
      }
      size="xl"
      primaryAction={{
        label: "Save Changes",
        onClick: handleSubmit,
        isLoading: isSubmitting,
        loadingText: "Saving Changes...",
        variant: "primary",
        iconName: "FaFloppyDisk",
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        variant: "secondary",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
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
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
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
            fullWidth
            required
          />

          <InputField
            label="Issuing Office / Authority"
            iconName="FaBuildingShield"
            value={issuingOffice}
            onChange={(e) => setIssuingOffice(e.target.value)}
            placeholder="e.g. Traffic Management Unit (TMU)"
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
            fullWidth
          />

          <InputField
            label="Effective Date / Duration"
            iconName="FaClock"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            placeholder="e.g. Immediately / Until Dec 31, 2026"
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
          fullWidth
          required
        />

        {/* Executive Summary */}
        <TextArea
          label="Executive Summary & Rationale"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="State the core directive, purpose, or reason for this memorandum..."
          rows={3}
          maxLength={1000}
          showCounter
          fullWidth
          required
        />

        {/* Legal / Statutory Basis */}
        <InputField
          label="Legal & Statutory Basis"
          iconName="FaGavel"
          value={legalBasis}
          onChange={(e) => setLegalBasis(e.target.value)}
          placeholder="e.g. Roxas City Ordinance No. 024-2024 & Municipal Transportation Code"
          fullWidth
        />

        {/* Dynamic Directives */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                Operative Provisions & Directives ({directives.length})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
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
              className="flex-1 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <Button
              type="button"
              onClick={handleAddDirective}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs px-4"
              iconName="FaPlus"
            >
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {directives.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No numbered directives specified yet.
              </p>
            ) : (
              directives.map((dir, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{dir}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDirective(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remove Directive"
                  >
                    <Icon iconName="FaTrashCan" size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Signatories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <InputField
              label="Primary Signatory Name"
              iconName="FaUserTie"
              value={primarySigName}
              onChange={(e) => setPrimarySigName(e.target.value)}
              placeholder="e.g. Engr. Arnel M. Del Rosario"
              fullWidth
            />
            <InputField
              label="Primary Signatory Title"
              value={primarySigTitle}
              onChange={(e) => setPrimarySigTitle(e.target.value)}
              placeholder="e.g. TMU Operations Specialist"
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <InputField
              label="Secondary Signatory Name"
              iconName="FaUserCheck"
              value={secondarySigName}
              onChange={(e) => setSecondarySigName(e.target.value)}
              placeholder="e.g. P/Supt. Rodrigo M. Valdez"
              fullWidth
            />
            <InputField
              label="Secondary Signatory Title"
              value={secondarySigTitle}
              onChange={(e) => setSecondarySigTitle(e.target.value)}
              placeholder="e.g. Chief of Police / Traffic Director"
              fullWidth
            />
          </div>
        </div>

        {/* Broadcast Channels */}
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={publishToMobile}
              onChange={(e) => setPublishToMobile(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Publish to Citizen & Operator Feeds
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Sync this announcement to the mobile commuter guide and driver bulletin.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendPushAlert}
              onChange={(e) => setSendPushAlert(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                High-Priority Alert
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Flag as urgent priority alert on driver terminals.
              </span>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default EditAnnouncementModal;

