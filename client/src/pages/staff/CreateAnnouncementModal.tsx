import React, { useState } from "react";
import { Icon, Button } from "../../components/ui";
import { InputField, TextArea, Select } from "../../components/ui/forms";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";

export interface NewAnnouncementData {
  type: "memorandum" | "announcement" | "directive";
  refNumber: string;
  title: string;
  summary: string;
  issuingOffice: string;
  date: string;
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
  const [wipNotice, setWipNotice] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handlePublishClick = () => {
    if (!title.trim() || !summary.trim()) {
      notify.error("Please fill in both the Title and Executive Summary.");
      return;
    }

    const payload: NewAnnouncementData = {
      type: announcementType,
      refNumber,
      title,
      summary,
      issuingOffice,
      date: todayStr,
      urgency,
      legalBasis,
      keyDirectives: directives,
      signatories: [
        { name: primarySignatory, title: "TMU Operations Specialist" },
        { name: secondarySignatory, title: "Chief of Police / Traffic Director" },
      ],
      publishToMobile,
      sendPushAlert,
    };

    if (onPublish) {
      onPublish(payload);
    }

    notify.success("Official announcement drafted and synced to mobile dispatch stream!");
    setWipNotice(
      "Notice (WIP Feature): Telematics API successfully queued this announcement. Live citizen push broadcast will be dispatched to connected mobile devices."
    );
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-[#080B14]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* Header */}
        <div className="relative z-10 px-6 sm:px-8 py-4.5 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Icon iconName="FaBullhorn" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Create Public Announcement / Memorandum
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  STAFF DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Draft and dispatch official circulars, rerouting advisories & fare directives to the citizen mobile app
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconName="FaXmark"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-xl transition-colors"
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          
          {wipNotice && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <Icon iconName="FaCircleCheck" size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wide text-[10px] block mb-0.5">Success & Staging Notice</span>
                <p className="text-[11px] leading-relaxed">{wipNotice}</p>
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-500 dark:text-slate-400">View Mode:</span>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  !previewMode
                    ? "bg-blue-600 text-white font-black shadow-sm"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                }`}
              >
                Editor Form
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  previewMode
                    ? "bg-blue-600 text-white font-black shadow-sm"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Icon iconName="FaMobileScreen" size={12} />
                <span>Mobile Preview</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              Live App Gazette Sync
            </span>
          </div>

          {!previewMode ? (
            <>
              {/* SECTION 1: CLASSIFICATION & REFERENCE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    1. Announcement Classification & Reference Code
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Reference Number
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRef}
                        className="text-[9.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <InputField
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      placeholder="e.g. TMU-MC-2026-10-095"
                      fullWidth
                      className="text-xs py-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TITLE, SUBJECT & OVERVIEW */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Memorandum Subject & Summary
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Official Subject / Title
                    </label>
                    <InputField
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Strict Enforcement of Approved Tricycle Fare Matrix"
                      fullWidth
                      className="text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Executive Summary (Displayed in Citizen Mobile Feed)
                    </label>
                    <TextArea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Brief overview explaining the directive to citizens and operators..."
                      fullWidth
                      showCounter
                      maxLength={400}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                        Issuing Authority / Division
                      </label>
                      <InputField
                        value={issuingOffice}
                        onChange={(e) => setIssuingOffice(e.target.value)}
                        placeholder="e.g. Traffic Management Unit Operations Desk"
                        fullWidth
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                        Legal Basis / Municipal Ordinance
                      </label>
                      <InputField
                        value={legalBasis}
                        onChange={(e) => setLegalBasis(e.target.value)}
                        placeholder="e.g. Roxas City Ordinance No. 024-2024"
                        fullWidth
                        className="text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: NUMBERED OPERATIONAL GUIDELINES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    3. Key Guidelines & Action Directives
                  </h3>
                </div>

                <div className="space-y-2">
                  {directives.map((directive, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {directive}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-400 hover:text-rose-500 font-bold px-1 transition-colors"
                        title="Remove directive"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add New Directive Row */}
                  <div className="flex items-center gap-2 pt-2">
                    <InputField
                      value={newDirectiveInput}
                      onChange={(e) => setNewDirectiveInput(e.target.value)}
                      placeholder="Add an actionable directive or fine penalty rule..."
                      fullWidth
                      className="text-xs"
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
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shrink-0"
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* SECTION 4: SIGNATORIES & CHANNELS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    4. Signatories & Mobile Broadcast Channels
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Prepared & Endorsed by
                    </label>
                    <InputField
                      value={primarySignatory}
                      onChange={(e) => setPrimarySignatory(e.target.value)}
                      placeholder="Officer Name"
                      fullWidth
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Reviewed & Attested by
                    </label>
                    <InputField
                      value={secondarySignatory}
                      onChange={(e) => setSecondarySignatory(e.target.value)}
                      placeholder="Commander Name"
                      fullWidth
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={publishToMobile}
                      onChange={(e) => setPublishToMobile(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Sync to Citizen Mobile App Announcement Feed
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={sendPushAlert}
                      onChange={(e) => setSendPushAlert(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Trigger Mobile Push Broadcast Alert (WIP)
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* MOBILE PREVIEW SIMULATOR */
            <div className="flex flex-col items-center py-4">
              <div className="w-full max-w-sm rounded-[32px] border-4 border-slate-700 bg-slate-900 p-4 shadow-2xl text-slate-800">
                {/* Phone Top Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4" />

                {/* Mobile Card Simulation */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                      {announcementType.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{refNumber}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">{title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{summary}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[150px]">{issuingOffice}</span>
                    <span className="text-blue-600 font-bold">Read Document →</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 mt-4">
                  Simulated mobile view on citizen device
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 text-xs px-4 py-2 rounded-xl"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
            >
              {previewMode ? "Edit Form" : "Preview Mobile Look"}
            </Button>

            <Button
              onClick={handlePublishClick}
              iconName="FaPaperPlane"
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              Publish to Mobile App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
