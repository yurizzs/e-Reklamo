import React, { useEffect, useState, useMemo, useCallback } from "react";
import { MainLayout } from "../../components/layouts";
import { Icon, Button, LoadingSpinner } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import AnnouncementService from "../../services/AnnouncementService";
import type { NewAnnouncementData } from "./CreateAnnouncementModal";

export interface AnnouncementRecord {
  id: string | number;
  type: "memorandum" | "announcement" | "directive";
  badgeLabel?: string;
  badge_label?: string;
  refNumber: string;
  ref_number?: string;
  title: string;
  summary: string;
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

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"catalog" | "create">("catalog");
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRecord | null>(null);

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

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AnnouncementService.getAll();
      if (res && res.data) {
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      notify.error("Unable to load announcements catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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
    if (!formTitle.trim() || !formSummary.trim()) {
      notify.error("Please provide both a Title and Executive Summary.");
      return;
    }

    const payload: NewAnnouncementData = {
      type: formType,
      refNumber: formRefNumber,
      title: formTitle.trim(),
      summary: formSummary.trim(),
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
      handleGenerateRef();
      setActiveTab("catalog");
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Failed to publish:", err);
      notify.error(err.message || "Failed to publish announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to remove this announcement from the public feed?")) {
      return;
    }
    try {
      await AnnouncementService.delete(id);
      notify.success("Announcement archived successfully.");
      setAnnouncements((prev) => prev.filter((a) => String(a.id) !== String(id)));
      if (selectedAnnouncement && String(selectedAnnouncement.id) === String(id)) {
        setSelectedAnnouncement(null);
      }
    } catch (err: any) {
      notify.error(err.message || "Failed to remove announcement.");
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                LIVE DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Official transportation memoranda, fare matrices, rerouting circulars, and emergency alerts synchronized directly with the citizen mobile app.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/30 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "catalog"
                ? "bg-white dark:bg-bg-light text-slate-900 dark:text-white shadow-md shadow-black/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Icon iconName="FaListUl" size={13} />
            Directory ({announcements.length})
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "create"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Icon iconName="FaPlus" size={13} />
            Create Announcement
          </button>
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
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Classifications</option>
                <option value="memorandum">Memorandum</option>
                <option value="announcement">Public Advisory</option>
                <option value="directive">Regulatory Directive</option>
              </select>

              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Urgency Levels</option>
                <option value="routine">Routine</option>
                <option value="priority">Priority</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                onClick={fetchAnnouncements}
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
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
                        >
                          Read Document →
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Archive / Remove circular"
                        >
                          <Icon iconName="FaTrashCan" size={12} />
                        </button>
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
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-bg-light rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Announcement Drafting Workbench
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete the fields below to dispatch an official ordinance notice directly to the mobile app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
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
                      const newType = e.target.value as any;
                      setFormType(newType);
                      const prefix = newType === "memorandum" ? "TMU-MC" : newType === "announcement" ? "PA-TMU" : "JRD-TRB";
                      setFormRefNumber(`${prefix}-2026-10-${Math.floor(100 + Math.random() * 900)}`);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="memorandum">Official Memorandum</option>
                    <option value="announcement">Public Advisory (Rerouting / Alerts)</option>
                    <option value="directive">Regulatory Directive (TRB / Compliance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Urgency Priority
                  </label>
                  <select
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="priority">Priority</option>
                    <option value="urgent">Urgent</option>
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. TMU-MC-2026-10-098"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRef}
                    iconName="FaRotate"
                    className="shrink-0"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  rows={3}
                  placeholder="Briefly state the mandate, background context, and who must comply..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        {dir}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirective(idx)}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
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
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Broadcast Options */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-1">
                  Broadcast Distribution
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

              {/* Submission Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab("catalog")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  iconName="FaPaperPlane"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? "Publishing to Network..." : "Publish & Broadcast Live"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile Preview Studio (5 Columns) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-slate-900 rounded-[40px] p-6 border-4 border-slate-800 shadow-2xl text-slate-100">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900" />
              </div>

              {/* Simulated App Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px]">
                    <Icon iconName="FaShieldHalved" size={11} />
                  </div>
                  <span className="text-xs font-extrabold tracking-tight">TMU App • Roxas</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                  LIVE PREVIEW
                </span>
              </div>

              {/* Simulated Mobile Card */}
              <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-lg space-y-3 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                    {formType.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {formRefNumber}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {formTitle || "Untitled Announcement"}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {formSummary || "The executive summary and directive overview will appear here as you type in the workbench..."}
                  </p>
                </div>

                {/* Directives Preview */}
                <div className="pt-2">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">
                    Key Directives Preview ({formDirectives.length})
                  </span>
                  <div className="space-y-1">
                    {formDirectives.slice(0, 2).map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-700">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="line-clamp-1">{d}</span>
                      </div>
                    ))}
                    {formDirectives.length > 2 && (
                      <span className="text-[9px] font-bold text-blue-600 block">
                        +{formDirectives.length - 2} more provisions
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[140px] font-bold">{formIssuingOffice}</span>
                  <span className="text-blue-600 font-black">View Memo →</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 mt-6 font-semibold">
                This simulated preview matches the exact rendering inside the citizen mobile app feed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DOCUMENT MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#080B14]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-200">
            {/* Modal Top */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/25">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official Document Preview
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Letterhead and Details */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  Republic of the Philippines • City of Roxas
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  TRAFFIC MANAGEMENT UNIT (TMU)
                </h2>
                <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-2">
                  <span>{selectedAnnouncement.refNumber || selectedAnnouncement.ref_number}</span>
                  <span>•</span>
                  <span>{selectedAnnouncement.date}</span>
                </div>
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                  {selectedAnnouncement.type.toUpperCase()}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {selectedAnnouncement.summary}
                </p>
              </div>

              {(selectedAnnouncement.legalBasis || selectedAnnouncement.legal_basis) && (
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">Statutory Basis</span>
                  <span className="text-blue-800 dark:text-blue-200">
                    {selectedAnnouncement.legalBasis || selectedAnnouncement.legal_basis}
                  </span>
                </div>
              )}

              {/* Key Directives */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Mandatory Provisions & Directives
                </span>
                <div className="space-y-2">
                  {(selectedAnnouncement.keyDirectives || selectedAnnouncement.key_directives || []).map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatories */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                <span>Authority: {selectedAnnouncement.issuingOffice || selectedAnnouncement.issuing_office}</span>
                <button
                  onClick={() => {
                    const ref = selectedAnnouncement.refNumber || selectedAnnouncement.ref_number || "";
                    navigator.clipboard.writeText(ref);
                    notify.success(`Reference ${ref} copied.`);
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Copy Reference Code
                </button>
              </div>
            </div>

            {/* Modal Bottom */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex justify-end">
              <Button onClick={() => setSelectedAnnouncement(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <MainLayout content={content} />;
};

export default AnnouncementsPage;
