import React, { useState, useRef } from "react";
import { Icon, Button } from "../../components/ui";
import { InputField, TextArea, Select } from "../../components/ui/forms";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import AnnouncementService from "../../services/AnnouncementService";

export interface NewAnnouncementData {
  type: "memorandum" | "announcement" | "directive";
  refNumber: string;
  title: string;
  summary: string;
  image?: File | string | null;
  removeImage?: boolean;
  issuingOffice: string;
  date: string;
  effectiveDate?: string;
  urgency: "routine" | "priority" | "urgent";
  legalBasis: string;
  keyDirectives: string[];
  signatories: { name: string; title: string }[];
  publishToMobile: boolean;
  sendPushAlert: boolean;
}

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (announcement: NewAnnouncementData) => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onPublish,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultStaffName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "TMU Operations Officer";

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Form State
  const [announcementType, setAnnouncementType] = useState<"memorandum" | "announcement" | "directive">("memorandum");
  const [urgency, setUrgency] = useState<"routine" | "priority" | "urgent">("priority");
  const [refNumber, setRefNumber] = useState("TMU-MC-2026-10-095");
  const [title, setTitle] = useState("Mandatory Tricycle Driver Uniform & Identification Display");
  const [summary, setSummary] = useState(
    "Directing all active public utility tricycle drivers to strictly adhere to the approved dress code, closed footwear, and display official TMU driver identification inside passenger cabins."
  );
  const [legalBasis, setLegalBasis] = useState("Roxas City Ordinance No. 024-2024 & Municipal Transportation Code");
  const [issuingOffice, setIssuingOffice] = useState("Traffic Management Unit (TMU) Operations Desk");
  const [primarySignatory, setPrimarySignatory] = useState(defaultStaffName);
  const [secondarySignatory, setSecondarySignatory] = useState("P/Supt. Rodrigo M. Valdez");

  // Optional Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dynamic directives
  const [directives, setDirectives] = useState<string[]>([
    "All franchised drivers must wear clean upper garments and closed shoes during operational duty hours.",
    "Official TMU driver identification ID card must be hung visibly behind the driver seat facing passengers.",
    "First violation warrants a warning and ₱500.00 citation penalty; repeated offenses will be referred to TRB franchise review.",
  ]);
  const [newDirectiveInput, setNewDirectiveInput] = useState("");

  // Broadcast Channels
  const [publishToMobile, setPublishToMobile] = useState(true);
  const [sendPushAlert, setSendPushAlert] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wipNotice, setWipNotice] = useState<string | null>(null);

  if (!isOpen) return null;

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
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

  const handleGenerateRef = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const prefix = announcementType === "memorandum" ? "TMU-MC" : announcementType === "announcement" ? "PA-TMU" : "JRD-TRB";
    setRefNumber(`${prefix}-2026-10-${randomSuffix}`);
  };

  const handlePublishClick = async () => {
    if (!title.trim() || !summary.trim()) {
      notify.error("Please fill in both the Title and Executive Summary.");
      return;
    }

    const payload: NewAnnouncementData = {
      type: announcementType,
      refNumber,
      title: title.trim(),
      summary: summary.trim(),
      image: imageFile,
      issuingOffice: issuingOffice.trim(),
      date: todayStr,
      urgency,
      legalBasis: legalBasis.trim(),
      keyDirectives: directives,
      signatories: [
        { name: primarySignatory, title: "TMU Operations Specialist" },
        { name: secondarySignatory, title: "Chief of Police / Traffic Director" },
      ],
      publishToMobile,
      sendPushAlert,
    };

    setIsSubmitting(true);
    try {
      await AnnouncementService.create(payload);
      notify.success("Official announcement published and synced to mobile app successfully!");
      if (onPublish) {
        onPublish(payload);
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to publish announcement:", err);
      notify.error(err.message || "Failed to publish announcement to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog (Enlarged max-w-5xl for superior viewing comfort) */}
      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[94vh] overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">

        {/* Header */}
        <div className="relative z-10 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
              <Icon iconName="FaBullhorn" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Create Public Announcement / Memorandum
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  STAFF DISPATCH
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Draft and dispatch official circulars, rerouting advisories & fare directives to the citizen mobile app
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconName="FaXmark"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 p-2.5 rounded-xl transition-colors"
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7 custom-scrollbar">

          {wipNotice && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <Icon iconName="FaCircleCheck" size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wide text-xs block mb-0.5">Success & Staging Notice</span>
                <p className="leading-relaxed">{wipNotice}</p>
              </div>
              <button
                onClick={() => setWipNotice(null)}
                className="text-emerald-600 hover:text-emerald-800 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mode Switcher (Edit vs Mobile Phone Preview) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <span className="text-slate-500 dark:text-slate-400">View Mode:</span>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${!previewMode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Editor Form
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${previewMode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Icon iconName="FaMobileScreen" size={14} />
                <span>Mobile Preview</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              Live Gazette Mobile Sync
            </span>
          </div>

          {!previewMode ? (
            <div className="space-y-7">
              {/* SECTION 1: CLASSIFICATION & REFERENCE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-5 bg-blue-600 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    1. Announcement Classification & Reference Code
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                      Announcement Type
                    </label>
                    <Select
                      options={[
                        { value: "memorandum", label: "Official Memorandum (Directive)" },
                        { value: "announcement", label: "Public Advisory (Rerouting / Alerts)" },
                        { value: "directive", label: "Joint Regulatory Circular (TRB)" },
                      ]}
                      value={announcementType}
                      onChange={(e) => setAnnouncementType(e.target.value as any)}
                      fullWidth
                      className="text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                      Urgency Classification
                    </label>
                    <Select
                      options={[
                        { value: "routine", label: "Routine Advisory" },
                        { value: "priority", label: "Priority Compliance Action" },
                        { value: "urgent", label: "Urgent Public Notice" },
                      ]}
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      fullWidth
                      className="text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Reference Number
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRef}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <InputField
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      placeholder="e.g. TMU-MC-2026-10-095"
                      fullWidth
                      className="text-sm py-2 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TITLE, SUBJECT & OVERVIEW */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-5 bg-amber-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Memorandum Subject & Summary
                  </h3>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                      Official Subject / Title *
                    </label>
                    <InputField
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Strict Enforcement of Approved Tricycle Fare Matrix"
                      fullWidth
                      className="text-sm font-bold py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                      Executive Summary (Displayed in Citizen Mobile Feed) *
                    </label>
                    <TextArea
                      rows={4}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Brief overview explaining the directive to citizens and operators..."
                      fullWidth
                      showCounter
                      maxLength={600}
                      className="text-sm leading-relaxed"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                        Issuing Authority / Division
                      </label>
                      <InputField
                        value={issuingOffice}
                        onChange={(e) => setIssuingOffice(e.target.value)}
                        placeholder="e.g. Traffic Management Unit Operations Desk"
                        fullWidth
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                        Legal Basis / Municipal Ordinance
                      </label>
                      <InputField
                        value={legalBasis}
                        onChange={(e) => setLegalBasis(e.target.value)}
                        placeholder="e.g. Roxas City Ordinance No. 024-2024"
                        fullWidth
                        className="text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: OPTIONAL ANNOUNCEMENT IMAGE / FLYER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-5 bg-teal-500 rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      3. Announcement Photo / Flyer Attachment (Optional)
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Optional
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="modal-announcement-image-input"
                  />

                  {imagePreview ? (
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10">
                      <div className="relative w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 shrink-0">
                        <img
                          src={imagePreview}
                          alt="Announcement Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon iconName="FaImage" size={16} className="text-teal-500" />
                          <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {imageFile?.name || "Attached Announcement Image"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB • ${imageFile.type}` : "Image ready for publication"}
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                          ✓ This photo will be featured in the citizen mobile feed and document gazette.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold"
                          >
                            Change Photo
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Remove Photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-white/50 dark:bg-black/10 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all group text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon iconName="FaImage" size={24} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 block">
                          Click to upload announcement photo or flyer banner
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                          Attach an official traffic advisory banner, detour route map, fare schedule poster, or event memorandum graphic (PNG, JPG, WebP up to 10MB).
                        </p>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                        Browse Files
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: NUMBERED OPERATIONAL GUIDELINES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    4. Key Guidelines & Action Directives
                  </h3>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="space-y-2.5">
                    {directives.map((directive, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 text-sm"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="flex-1 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {directive}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirective(idx)}
                          className="text-slate-400 hover:text-rose-500 font-bold px-1.5 py-0.5 transition-colors"
                          title="Remove directive"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Directive Row */}
                  <div className="flex items-center gap-3 pt-2">
                    <InputField
                      value={newDirectiveInput}
                      onChange={(e) => setNewDirectiveInput(e.target.value)}
                      placeholder="Add an actionable directive or fine penalty rule..."
                      fullWidth
                      className="text-sm py-2.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDirective();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddDirective}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-xl shrink-0"
                    >
                      + Add Directive
                    </Button>
                  </div>
                </div>
              </div>

              {/* SECTION 5: SIGNATORIES & CHANNELS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-5 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    5. Signatories & Mobile Broadcast Channels
                  </h3>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                        Prepared & Endorsed by
                      </label>
                      <InputField
                        value={primarySignatory}
                        onChange={(e) => setPrimarySignatory(e.target.value)}
                        placeholder="Officer Name"
                        fullWidth
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                        Reviewed & Attested by
                      </label>
                      <InputField
                        value={secondarySignatory}
                        onChange={(e) => setSecondarySignatory(e.target.value)}
                        placeholder="Commander Name"
                        fullWidth
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm pt-2">
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={publishToMobile}
                        onChange={(e) => setPublishToMobile(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                          Sync to Citizen Mobile App
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Appears instantly in public citizen bulletin feed
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={sendPushAlert}
                        onChange={(e) => setSendPushAlert(e.target.checked)}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-amber-600 dark:text-amber-400 block text-xs sm:text-sm">
                          Trigger Mobile Push Broadcast Alert
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Dispatches urgent notification alert to connected mobile devices
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MOBILE PREVIEW SIMULATOR */
            <div className="flex flex-col items-center py-6">
              <div className="w-full max-w-md rounded-[40px] border-4 border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-800">
                {/* Phone Top Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-5" />

                {/* Mobile Card Simulation */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3.5 overflow-hidden">
                  {imagePreview && (
                    <div className="-mx-5 -mt-5 mb-3 h-44 overflow-hidden bg-slate-100">
                      <img
                        src={imagePreview}
                        alt="Simulated mobile attachment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                      {announcementType.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{refNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">{title}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{summary}</p>
                  </div>

                  {directives.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Directives ({directives.length})
                      </span>
                      <p className="text-xs text-slate-700 font-medium truncate">
                        • {directives[0]}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[170px] font-semibold">{issuingOffice}</span>
                    <span className="text-blue-600 font-black">Read Document →</span>
                  </div>
                </div>

                <div className="text-center text-xs text-slate-400 mt-5 font-medium">
                  Live synchronized preview on citizen mobile app
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4.5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm px-5 py-2.5 rounded-xl font-bold"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
            >
              {previewMode ? "Back to Editor" : "Preview Mobile Look"}
            </Button>

            <Button
              onClick={handlePublishClick}
              disabled={isSubmitting}
              iconName="FaPaperPlane"
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2.5 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish to Mobile App"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
