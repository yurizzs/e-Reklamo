import React, { useEffect, useState, useMemo, useRef } from "react";
import { MainLayout } from "../../components/layouts";
import { Icon, Button, LoadingSpinner, Modal } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import AnnouncementService from "../../services/AnnouncementService";
import type { NewAnnouncementData } from "./CreateAnnouncementModal";
import EditAnnouncementModal from "./EditAnnouncementModal";

export interface AnnouncementRecord {
  id: string | number;
  type: "memorandum" | "announcement" | "directive";
  badgeLabel?: string;
  badge_label?: string;
  refNumber: string;
  ref_number?: string;
  title: string;
  summary: string;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  issuingOffice: string;
  issuing_office?: string;
  date: string;
  effectiveDate?: string;
  effective_date?: string;
  urgency: "routine" | "priority" | "urgent";
  legalBasis?: string;
  legal_basis?: string;
  keyDirectives?: string[];
  key_directives?: string[];
  signatories?: { name: string; title: string }[];
  publishToMobile?: boolean;
  publish_to_mobile?: boolean;
  sendPushAlert?: boolean;
  send_push_alert?: boolean;
  createdAt?: string;
}

export const getAnnouncementImageUrl = (item: AnnouncementRecord | null | undefined): string | null => {
  if (!item) return null;
  if (item.imageUrl) return item.imageUrl;
  if (item.image_url) return item.image_url;
  if (item.image) {
    if (item.image.startsWith("http://") || item.image.startsWith("https://") || item.image.startsWith("data:")) {
      return item.image;
    }
    const base = import.meta.env.VITE_STORAGE_URL || "http://localhost:8000/storage";
    return `${base}/${item.image}`;
  }
  return null;
};

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "staff" || user?.role === "admin";
  const isOperator = user?.role === "operator";

  const [activeTabState, setActiveTab] = useState<"catalog" | "create">("catalog");
  const activeTab = isStaff ? activeTabState : "catalog";
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRecord | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementRecord | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for creation
  const defaultStaffName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "TMU Operations Specialist";

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [formType, setFormType] = useState<"memorandum" | "announcement" | "directive">("memorandum");
  const [formUrgency, setFormUrgency] = useState<"routine" | "priority" | "urgent">("priority");
  const [formRefNumber, setFormRefNumber] = useState("TMU-MC-2026-10-098");
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formLegalBasis, setFormLegalBasis] = useState("Roxas City Ordinance No. 024-2024 & Municipal Transportation Code");
  const [formIssuingOffice, setFormIssuingOffice] = useState("Traffic Management Unit (TMU) Operations Desk");
  const [formPrimarySig, setFormPrimarySig] = useState(defaultStaffName);
  const [formSecondarySig, setFormSecondarySig] = useState("P/Supt. Rodrigo M. Valdez");
  const [formDirectives, setFormDirectives] = useState<string[]>([
    "All operators and drivers must comply immediately upon notice.",
    "Field traffic enforcers are instructed to inspect compliance across designated sectors.",
  ]);
  const [newDirectiveInput, setNewDirectiveInput] = useState("");
  const [publishToMobile, setPublishToMobile] = useState(true);
  const [sendPushAlert, setSendPushAlert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional Announcement Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  // Fetch announcements
  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const res = await AnnouncementService.getAll();
        if (isMounted && res && res.data) {
          setAnnouncements(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err: unknown) {
        console.error("Failed to load announcements:", err);
        notify.error("Unable to load announcements catalog.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleGenerateRef = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const prefix = formType === "memorandum" ? "TMU-MC" : formType === "announcement" ? "PA-TMU" : "JRD-TRB";
    setFormRefNumber(`${prefix}-2026-10-${randomSuffix}`);
  };

  const handleAddDirective = () => {
    if (!newDirectiveInput.trim()) return;
    setFormDirectives([...formDirectives, newDirectiveInput.trim()]);
    setNewDirectiveInput("");
  };

  const handleRemoveDirective = (idx: number) => {
    setFormDirectives(formDirectives.filter((_, i) => i !== idx));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) {
      notify.error("Only TMU Staff members are authorized to publish announcements.");
      return;
    }
    if (!formTitle.trim() || !formSummary.trim()) {
      notify.error("Please provide both a Title and Executive Summary.");
      return;
    }

    const payload: NewAnnouncementData = {
      type: formType,
      refNumber: formRefNumber,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      image: imageFile,
      issuingOffice: formIssuingOffice.trim(),
      date: todayStr,
      urgency: formUrgency,
      legalBasis: formLegalBasis.trim(),
      keyDirectives: formDirectives,
      signatories: [
        { name: formPrimarySig, title: "TMU Operations Specialist" },
        { name: formSecondarySig, title: "Chief of Police / Traffic Director" },
      ],
      publishToMobile,
      sendPushAlert,
    };

    setIsSubmitting(true);
    try {
      await AnnouncementService.create(payload);
      notify.success("Announcement published and broadcasted to mobile app!");
      // Reset form
      setFormTitle("");
      setFormSummary("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      handleGenerateRef();
      setActiveTab("catalog");
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      console.error("Failed to publish:", err);
      const message = err instanceof Error ? err.message : "Failed to publish announcement.";
      notify.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;
    if (!isStaff) {
      notify.error("Only TMU Staff members are authorized to delete announcements.");
      return;
    }
    setIsDeleting(true);
    try {
      await AnnouncementService.delete(announcementToDelete.id);
      const typeLabel =
        announcementToDelete.type === "memorandum"
          ? "Memorandum"
          : announcementToDelete.type === "directive"
            ? "Directive"
            : "Announcement";
      notify.success(`${typeLabel} archived successfully.`);
      setAnnouncements((prev) => prev.filter((a) => String(a.id) !== String(announcementToDelete.id)));
      if (selectedAnnouncement && String(selectedAnnouncement.id) === String(announcementToDelete.id)) {
        setSelectedAnnouncement(null);
      }
      setAnnouncementToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove announcement.";
      notify.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = announcements.length;
    const memos = announcements.filter((a) => a.type === "memorandum").length;
    const advisories = announcements.filter((a) => a.type === "announcement").length;
    const directives = announcements.filter((a) => a.type === "directive").length;
    const urgent = announcements.filter((a) => a.urgency !== "routine").length;
    return { total, memos, advisories, directives, urgent };
  }, [announcements]);

  // Filtered list
  const filteredList = useMemo(() => {
    return announcements.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterUrgency !== "all" && item.urgency !== filterUrgency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title?.toLowerCase().includes(q);
        const inRef = (item.refNumber || item.ref_number || "")?.toLowerCase().includes(q);
        const inSummary = item.summary?.toLowerCase().includes(q);
        const inOffice = (item.issuingOffice || item.issuing_office || "")?.toLowerCase().includes(q);
        return inTitle || inRef || inSummary || inOffice;
      }
      return true;
    });
  }, [announcements, filterType, filterUrgency, searchQuery]);

  const content = (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-bg-light p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Icon iconName="FaBullhorn" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Public Announcements & Directives
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {isStaff
                ? "Author, broadcast, and manage official transportation memoranda, fare matrices, and advisories to synchronize across Operator terminals and Citizen mobile apps."
                : isOperator
                  ? "Official transportation circulars, fare matrix regulations, and traffic rerouting directives issued by TMU Staff for operational enforcement and commuter guidance."
                  : "Official transportation circulars, approved fare matrices, rerouting advisories, and emergency alerts synchronized directly from Roxas City TMU."}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/30 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "catalog"
                ? "bg-white dark:bg-bg-light text-slate-900 dark:text-white shadow-md shadow-black/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Icon iconName="FaListUl" size={13} />
            Directory ({announcements.length})
          </button>

          {isStaff && (
            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === "create"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <Icon iconName="FaPlus" size={13} />
              Create Announcement
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-bg-light p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Icon iconName="FaFileLines" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Published</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-bg-light p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Icon iconName="FaLandmark" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Memoranda</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.memos}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-bg-light p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Icon iconName="FaCircleInfo" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Public Advisories</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.advisories}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-bg-light p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Icon iconName="FaTriangleExclamation" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority / Urgent</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.urgent}</span>
          </div>
        </div>
      </div>

      {/* TAB 1: CATALOG DIRECTORY VIEW */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-bg-light p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search reference code, ordinance, title, authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
              <div className="absolute left-3.5 top-3 text-slate-400">
                <Icon iconName="FaMagnifyingGlass" size={13} />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Classifications</option>
                <option value="memorandum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Memorandum</option>
                <option value="announcement" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Public Advisory</option>
                <option value="directive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Regulatory Directive</option>
              </select>

              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Urgency Levels</option>
                <option value="routine" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Routine</option>
                <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Priority</option>
                <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Urgent</option>
              </select>

              <button
                onClick={handleRefresh}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 shrink-0 transition-colors"
                title="Refresh from server"
              >
                <Icon iconName="FaRotate" size={13} />
              </button>
            </div>
          </div>

          {/* Catalog Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Retrieving active notices...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white dark:bg-bg-light p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mx-auto">
                <Icon iconName="FaInbox" size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No circulars matched your filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing your search query or reset the classification filters above.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterUrgency("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((item) => {
                const isMemo = item.type === "memorandum";
                const isDirective = item.type === "directive";
                const isUrgent = item.urgency === "urgent";
                const isPriority = item.urgency === "priority";

                const categoryBg = isMemo
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"
                  : isDirective
                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";

                const urgencyBg = isUrgent
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20"
                  : isPriority
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10";

                const directives = item.keyDirectives || item.key_directives || [];
                const refCode = item.refNumber || item.ref_number || "";
                const photoUrl = getAnnouncementImageUrl(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-bg-light rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Card Top Meta */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border ${categoryBg}`}>
                            {item.badgeLabel || item.badge_label || item.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wider border ${urgencyBg}`}>
                            {item.urgency}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">{item.date}</span>
                      </div>

                      {/* Attached Announcement Image Banner */}
                      {photoUrl && (
                        <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 shrink-0">
                          <img
                            src={photoUrl}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Ref code */}
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        <Icon iconName="FaHashtag" size={10} className="text-slate-400" />
                        <span>{refCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(refCode);
                            notify.success(`Copied ${refCode}`);
                          }}
                          className="hover:text-blue-500 ml-1 p-0.5"
                          title="Copy reference code"
                        >
                          <Icon iconName="FaCopy" size={10} />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>

                      {/* Directives Pill & Legal Basis */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10.5px] font-bold flex items-center gap-1.5">
                          <Icon iconName="FaListCheck" size={11} className="text-blue-500" />
                          {directives.length} Key Directives
                        </span>
                        {(item.legalBasis || item.legal_basis) && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10.5px] font-semibold truncate max-w-[220px]">
                            {item.legalBasis || item.legal_basis}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">
                        {item.issuingOffice || item.issuing_office}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAnnouncement(item)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Read Document</span>
                          <Icon iconName="FaArrowRight" size={10} />
                        </button>

                        {isStaff && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingAnnouncement(item)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit Announcement"
                            >
                              <Icon iconName="FaPencil" size={12} />
                            </button>
                            <button
                              onClick={() => setAnnouncementToDelete(item)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title={`Archive / Remove ${item.type === "memorandum" ? "memorandum" : item.type === "directive" ? "directive" : "announcement"}`}
                            >
                              <Icon iconName="FaTrashCan" size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEDICATED WORKBENCH & POSTING STUDIO */}
      {activeTab === "create" && isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-bg-light rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-7">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Announcement Drafting Workbench
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Complete the fields below to dispatch an official ordinance notice directly to the mobile app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Back to Directory
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-6">
              {/* Type & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Classification
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as "memorandum" | "announcement" | "directive";
                      setFormType(newType);
                      const prefix = newType === "memorandum" ? "TMU-MC" : newType === "announcement" ? "PA-TMU" : "JRD-TRB";
                      setFormRefNumber(`${prefix}-2026-10-${Math.floor(100 + Math.random() * 900)}`);
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                  >
                    <option value="memorandum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Official Memorandum</option>
                    <option value="announcement" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Public Advisory (Rerouting / Alerts)</option>
                    <option value="directive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Regulatory Directive (TRB / Compliance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Urgency Priority
                  </label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value as "routine" | "priority" | "urgent")}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                  >
                    <option value="routine" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Routine</option>
                    <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Priority</option>
                    <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Reference Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Official Reference Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formRefNumber}
                    onChange={(e) => setFormRefNumber(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. TMU-MC-2026-10-098"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRef}
                    iconName="FaRotate"
                    className="shrink-0 px-4 font-bold text-xs sm:text-sm rounded-2xl"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mandatory Tricycle Fare Matrix Display & Student Discount Compliance"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Executive Summary & Scope *
                </label>
                <textarea
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  rows={4}
                  placeholder="Briefly state the mandate, background context, and who must comply..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Optional Photo / Flyer Banner Attachment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Announcement Photo / Flyer Banner (Optional)
                  </label>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Optional
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="announcements-page-image-input"
                />

                {imagePreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10">
                    <div className="relative w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 shrink-0">
                      <img
                        src={imagePreview}
                        alt="Announcement flyer preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon iconName="FaImage" size={16} className="text-teal-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {imageFile?.name || "Attached Image"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB • ${imageFile.type}` : "Ready for broadcast"}
                      </p>
                      <div className="flex items-center gap-3 pt-1">
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
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-slate-50/50 dark:bg-black/10 hover:bg-blue-50/20 dark:hover:bg-blue-500/5 transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon iconName="FaImage" size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                        Click to attach an announcement photo or flyer banner
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                        Attach an official circular advisory poster, route detour map, or ordinance graphic (PNG, JPG, WebP up to 10MB).
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                      Browse File
                    </span>
                  </div>
                )}
              </div>

              {/* Statutory Basis & Issuing Authority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Statutory / Legal Basis
                  </label>
                  <input
                    type="text"
                    value={formLegalBasis}
                    onChange={(e) => setFormLegalBasis(e.target.value)}
                    placeholder="e.g. Roxas City Ordinance No. 024-2024"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Issuing Authority Desk
                  </label>
                  <input
                    type="text"
                    value={formIssuingOffice}
                    onChange={(e) => setFormIssuingOffice(e.target.value)}
                    placeholder="e.g. TMU Operations Directorate"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Directives */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mandatory Key Directives
                </label>

                <div className="space-y-2">
                  {formDirectives.map((dir, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">
                        {dir}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDirectiveInput}
                    onChange={(e) => setNewDirectiveInput(e.target.value)}
                    placeholder="Type a new directive bullet and click Add..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDirective();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDirective}
                    iconName="FaPlus"
                    className="rounded-2xl px-4 font-bold text-xs sm:text-sm"
                  >
                    Add Directive
                  </Button>
                </div>
              </div>

              {/* Signatories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Primary Signatory
                  </label>
                  <input
                    type="text"
                    value={formPrimarySig}
                    onChange={(e) => setFormPrimarySig(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Secondary Attestation
                  </label>
                  <input
                    type="text"
                    value={formSecondarySig}
                    onChange={(e) => setFormSecondarySig(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Broadcast Options */}
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-1">
                  Broadcast Distribution
                </span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishToMobile}
                    onChange={(e) => setPublishToMobile(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    Publish live to citizen mobile app announcement feed
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPushAlert}
                    onChange={(e) => setSendPushAlert(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Broadcast notification ping to connected devices
                  </span>
                </label>
              </div>

              {/* Submission Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab("catalog")}
                  className="text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  iconName="FaPaperPlane"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-7 py-3 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2.5"
                >
                  {isSubmitting ? "Publishing to Network..." : "Publish & Broadcast Live"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile Preview Studio (5 Columns) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-slate-200/90 dark:bg-slate-900 rounded-[44px] p-6 sm:p-7 border-4 border-slate-300 dark:border-slate-800 shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-slate-300 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-900" />
              </div>

              {/* Simulated App Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px]">
                    <Icon iconName="FaShieldHalved" size={11} />
                  </div>
                  <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white">TMU App • Roxas</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  LIVE PREVIEW
                </span>
              </div>

              {/* Simulated Mobile Card */}
              <div className="bg-white dark:bg-bg-light rounded-2xl p-5 text-slate-900 dark:text-slate-100 shadow-md space-y-3 border-l-4 border-blue-600 border border-slate-200/80 dark:border-white/5 transition-colors overflow-hidden">
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
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                    {formType.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                    {formRefNumber}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {formTitle || "Untitled Announcement"}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {formSummary || "The executive summary and directive overview will appear here as you type in the workbench..."}
                  </p>
                </div>

                {/* Directives Preview */}
                <div className="pt-2">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                    Key Directives Preview ({formDirectives.length})
                  </span>
                  <div className="space-y-1">
                    {formDirectives.slice(0, 2).map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-slate-300">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span className="line-clamp-1">{d}</span>
                      </div>
                    ))}
                    {formDirectives.length > 2 && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block">
                        +{formDirectives.length - 2} more provisions
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[140px] font-bold">{formIssuingOffice}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black">View Memo →</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-6 font-semibold">
                This simulated preview matches the exact rendering inside the citizen mobile app feed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DOCUMENT MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-200">
            {/* Modal Top */}
            <div className="px-6 py-4 border-b border-slate-300 dark:border-white/10 flex items-center justify-between bg-slate-100/90 dark:bg-slate-900/95">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Icon iconName="FaFileLines" size={15} />
                </div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Official Document Preview
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconName="FaXmark"
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer"
              />
            </div>

            {/* Letterhead and Details */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  Republic of the Philippines • City of Roxas
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  TRAFFIC MANAGEMENT UNIT (TMU)
                </h2>
                <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-2">
                  <span>{selectedAnnouncement.refNumber || selectedAnnouncement.ref_number}</span>
                  <span>•</span>
                  <span>{selectedAnnouncement.date}</span>
                </div>
              </div>

              {/* Photo Display if Present */}
              {getAnnouncementImageUrl(selectedAnnouncement) && (
                <div className="w-full max-h-96 rounded-2xl overflow-hidden bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  <img
                    src={getAnnouncementImageUrl(selectedAnnouncement)!}
                    alt={selectedAnnouncement.title}
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              <div>
                <span className="px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                  {selectedAnnouncement.type.toUpperCase()}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                  {selectedAnnouncement.summary}
                </p>
              </div>

              {(selectedAnnouncement.legalBasis || selectedAnnouncement.legal_basis) && (
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-xs">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">Statutory Basis</span>
                  <span className="text-blue-800 dark:text-blue-200">
                    {selectedAnnouncement.legalBasis || selectedAnnouncement.legal_basis}
                  </span>
                </div>
              )}

              {/* Key Directives */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  Mandatory Provisions & Directives
                </span>
                <div className="space-y-2">
                  {(selectedAnnouncement.keyDirectives || selectedAnnouncement.key_directives || []).map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatories */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Authority: {selectedAnnouncement.issuingOffice || selectedAnnouncement.issuing_office}</span>
                <button
                  onClick={() => {
                    const ref = selectedAnnouncement.refNumber || selectedAnnouncement.ref_number || "";
                    navigator.clipboard.writeText(ref);
                    notify.success(`Reference ${ref} copied.`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon iconName="FaCopy" size={11} />
                  <span>Copy Reference Code</span>
                </button>
              </div>
            </div>

            {/* Modal Bottom (High-Visibility Controls) */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-sm flex flex-wrap items-center justify-between gap-2.5">
              {isStaff ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const toEdit = selectedAnnouncement;
                      setSelectedAnnouncement(null);
                      setEditingAnnouncement(toEdit);
                    }}
                    iconName="FaPencil"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 min-h-[34px] rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Edit Document
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const toDelete = selectedAnnouncement;
                      setSelectedAnnouncement(null);
                      setAnnouncementToDelete(toDelete);
                    }}
                    iconName="FaTrashCan"
                    className="bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs px-3 py-1.5 min-h-[34px] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  iconName="FaPrint"
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500 font-bold text-xs px-3.5 py-1.5 min-h-[34px] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  Print Notice
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingAnnouncement && (
        <EditAnnouncementModal
          key={editingAnnouncement.id}
          announcement={editingAnnouncement}
          isOpen={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onUpdated={(updated) => {
            setAnnouncements((prev) =>
              prev.map((a) => (String(a.id) === String(updated.id) ? updated : a))
            );
            if (selectedAnnouncement && String(selectedAnnouncement.id) === String(updated.id)) {
              setSelectedAnnouncement(updated);
            }
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {announcementToDelete && (() => {
        const typeLabel =
          announcementToDelete.type === "memorandum"
            ? "memorandum"
            : announcementToDelete.type === "directive"
              ? "directive"
              : "announcement";
        const typeCapitalized = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

        return (
          <Modal
            isOpen={!!announcementToDelete}
            onClose={() => {
              if (!isDeleting) setAnnouncementToDelete(null);
            }}
            title={
              <span className="text-base font-medium normal-case tracking-normal">
                Confirm Remove {typeCapitalized}
              </span>
            }
            centerFooter
            primaryAction={{
              label: `Yes, Remove ${typeCapitalized}`,
              onClick: confirmDelete,
              isLoading: isDeleting,
              loadingText: "Archiving...",
              variant: "danger",
              iconName: "FaTrashCan",
              size: "sm",
              className: "px-5 py-2 text-xs font-semibold normal-case tracking-normal rounded-xl whitespace-nowrap",
            }}
            secondaryAction={{
              label: "Cancel",
              onClick: () => setAnnouncementToDelete(null),
              variant: "outline",
              size: "sm",
              className: "px-5 py-2 text-xs font-semibold normal-case tracking-normal rounded-xl",
            }}
            size="sm"
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Are you sure you want to remove this {typeLabel}?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will unpublish <strong className="text-slate-900 dark:text-white">{announcementToDelete.title}</strong> (Ref: {announcementToDelete.refNumber || announcementToDelete.ref_number}) from the public directory and mobile notifications.
              </p>
            </div>
          </Modal>
        );
      })()}
    </div>
  );

  return <MainLayout content={content} />;
};

export default AnnouncementsPage;
