import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../../components/layouts";
import { Icon, Button, LoadingSpinner } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { PATHS } from "../../routes/path";
import AnnouncementService from "../../services/AnnouncementService";
import ComplaintService from "../../services/ComplaintService";
import CreateComplaintModal from "../staff/CreateComplaintModal";
import type { AnnouncementRecord } from "../staff/AnnouncementsPage";
import { notify } from "../../util/notify";

interface CitizenComplaintItem {
  id: number;
  title: string;
  description: string;
  status: string;
  incident_location?: string;
  incident_date_time?: string;
}

export const CitizenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [complaints, setComplaints] = useState<CitizenComplaintItem[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load announcements and citizen complaints
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [annRes, compRes] = await Promise.allSettled([
          AnnouncementService.getAll(),
          ComplaintService.getAll({ limit: 5 }),
        ]);

        if (isMounted && annRes.status === "fulfilled" && annRes.value?.data) {
          setAnnouncements(Array.isArray(annRes.value.data) ? annRes.value.data : []);
        }

        if (isMounted && compRes.status === "fulfilled") {
          const raw = compRes.value as { data?: { complaints?: CitizenComplaintItem[] }; complaints?: CitizenComplaintItem[] };
          const payload = raw?.data ?? raw;
          setComplaints(payload?.complaints ?? []);
        }
      } catch (err: unknown) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoadingAnnouncements(false);
          setLoadingComplaints(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const citizenName = user?.first_name ? `${user.first_name} ${user.last_name}` : "Valued Commuter";

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Citizen Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-24 translate-x-24 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black uppercase tracking-wider text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Roxas City TMU Public Citizen Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {citizenName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Stay up-to-date with official transportation circulars, mandatory fare matrices, and rerouting directives issued by TMU Staff. Report transit violations and track your grievance resolutions.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Button
              iconName="FaBullhorn"
              onClick={() => navigate(PATHS.APP.ANNOUNCEMENTS)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all"
            >
              All Advisories ({announcements.length})
            </Button>
            <Button
              iconName="FaPlus"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              + File Incident Report
            </Button>
          </div>
        </div>
      </div>

      {/* Commuter Rights & Approved Fare Matrix Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Icon iconName="FaPesoSign" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Official Base Fare
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              ₱15.00
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Approved cap for first 2 km under City Ordinance No. 024-2024.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Icon iconName="FaPercent" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Mandatory 20% Discount
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              Students, PWD & Seniors
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ₱10.00 discounted base fare upon presentation of valid ID.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Icon iconName="FaIdCard" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Driver Identification
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              Cabin ID Display
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              All public tricycles must display TMU driver ID cards inside.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Live Announcements Feed (Passed from Staff) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Official TMU Announcements & Directives
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Staff Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Directives, rerouting schedules, and public transportation advisories issued by TMU Operations
            </p>
          </div>

          <button
            onClick={() => navigate(PATHS.APP.ANNOUNCEMENTS)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Catalog</span>
            <span>→</span>
          </button>
        </div>

        {loadingAnnouncements ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner text="Fetching official announcements..." />
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 text-center">
            <Icon iconName="FaBullhorn" className="text-3xl text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active announcements</p>
            <p className="text-xs text-slate-400 mt-1">Official circulars from TMU Staff will be posted here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.slice(0, 6).map((item) => {
              const urgencyColor =
                item.urgency === "urgent"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  : item.urgency === "priority"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

              const typeBadge =
                item.type === "memorandum"
                  ? "Memorandum"
                  : item.type === "directive"
                  ? "Directive"
                  : "Public Advisory";

              const directives = item.keyDirectives || item.key_directives || [];

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${urgencyColor}`}>
                        {item.urgency.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.refNumber || item.ref_number}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                        {typeBadge}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    {directives.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Key Provision:
                        </span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                          "{directives[0]}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {item.date}
                    </span>
                    <button
                      onClick={() => setSelectedAnnouncement(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
                    >
                      Read Notice →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: My Incident Grievance Reports */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              My Incident Grievance Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status of complaints you have lodged with the TMU Desk
            </p>
          </div>

          <Button
            iconName="FaPlus"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold self-start sm:self-auto"
          >
            Report Incident
          </Button>
        </div>

        {loadingComplaints ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner text="Loading your records..." />
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Icon iconName="FaShieldHeart" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No active incidents filed</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                If you ever experience fare overcharging, reckless driving, or trip refusal, submit a formal report here to trigger TMU investigation.
              </p>
            </div>
            <Button
              variant="outline"
              iconName="FaPlus"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-bold"
            >
              File a Grievance Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map((c) => {
              const isSettled = c.status === "settled";
              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #CR-2026-{String(c.id).padStart(4, "0")}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isSettled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{c.incident_location || "Roxas City"}</span>
                    <span>{c.incident_date_time?.split(" ")[0] || "Recent"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Announcement Preview Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#080B14]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/25">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official TMU Notice
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

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

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Key Directives & Guidelines
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

            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex justify-end">
              <Button onClick={() => setSelectedAnnouncement(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          notify.success("Incident grievance submitted to TMU Desk.");
        }}
      />
    </div>
  );

  return <MainLayout content={content} />;
};

export default CitizenDashboard;

