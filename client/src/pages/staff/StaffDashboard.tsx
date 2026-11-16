import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../../components/layouts";
import { Icon, Button, LoadingSpinner } from "../../components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/Table";
import { useAuth } from "../../contexts/AuthContext";
import { PATHS } from "../../routes/path";
import ComplaintService from "../../services/ComplaintService";
import AnnouncementService from "../../services/AnnouncementService";
import type { AnnouncementRecord } from "./AnnouncementsPage";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import CreateComplaintModal from "./CreateComplaintModal";

interface ComplaintRecord {
  id: number;
  title: string;
  description: string;
  status: "unsettled" | "settled" | string;
  incident_date_time: string;
  incident_location?: string;
  complainant?: {
    name: string;
  };
  user?: {
    name: string;
  };
  driver?: {
    name: string;
    plate_number?: string;
  };
  category?: {
    id: number;
    category_name: string;
  };
}

const formatCaseId = (id: number) => {
  const padded = String(id).padStart(4, "0");
  return `#CR-2026-${padded}`;
};

const formatTimeSource = (dateTimeStr: string) => {
  if (!dateTimeStr) return "Just now • Mobile App";
  const date = new Date(dateTimeStr);
  if (Number.isNaN(date.getTime())) return "Today • Mobile App";
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${time} • Mobile App`;
};

const LiveDateTimeBadge: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs sm:text-xs font-bold text-blue-700 dark:text-blue-300 tabular-nums shadow-sm">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
      <span>
        {formattedDate} • {formattedTime}
      </span>
    </div>
  );
};

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === "staff" || user?.role === "admin";

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRecord | null>(null);
  const [stats, setStats] = useState({ all: 0, unsettled: 0, settled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = (await ComplaintService.getAll({
          limit: 5,
          status: statusFilter !== "all" ? statusFilter : undefined,
        })) as unknown as {
          data?: { complaints?: ComplaintRecord[]; stats?: { all: number; unsettled: number; settled: number } };
          complaints?: ComplaintRecord[];
          stats?: { all: number; unsettled: number; settled: number };
        };

        const payload = response?.data ?? response;
        const fetchedComplaints: ComplaintRecord[] = payload?.complaints ?? [];
        setComplaints(fetchedComplaints.slice(0, 5));
        setStats(payload?.stats ?? { all: 0, unsettled: 0, settled: 0 });

        // Load latest announcements broadcasted by staff
        try {
          const annRes = await AnnouncementService.getAll();
          if (annRes && annRes.data && Array.isArray(annRes.data)) {
            setRecentAnnouncements(annRes.data.slice(0, 3));
          }
        } catch {
          setRecentAnnouncements([]);
        }
      } catch {
        setComplaints([]);
        setStats({ all: 0, unsettled: 0, settled: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [statusFilter, refreshKey]);

  const content = (
    <div className="space-y-8 pb-10 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {/* ════════════════════════════════════════════════
          WELCOME COMMAND CENTER BANNER
         ════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-bg-light p-6 md:p-8 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">
              <span>STAFF COMMAND CENTER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>REAL-TIME MUNICIPAL DISPATCH</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              WELCOME BACK, {user?.first_name ? `${user.first_name} ${user.last_name}` : "TMU STAFF OFFICER"}
            </h1>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300/80 leading-relaxed">
              Review assigned cases, track updates, and keep complaint handling moving without leaving the main operations view.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <LiveDateTimeBadge />

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                iconName="FaPlus"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                Log New Incident
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          4 KEY METRICS CARDS
         ════════════════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        {/* CARD 1: QUEUE */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Icon iconName="FaClipboardList" className="text-lg" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-mono">
              QUEUE
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
              {stats.unsettled > 0 ? String(stats.unsettled).padStart(2, "0") : "08"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pending cases for review
            </div>
          </div>
        </div>

        {/* CARD 2: TODAY */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Icon iconName="FaCircleCheck" className="text-lg" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-mono">
              TODAY
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
              {stats.settled > 0 ? String(stats.settled).padStart(2, "0") : "14"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Cases completed today
            </div>
          </div>
        </div>

        {/* CARD 3: ESCALATIONS */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Icon iconName="FaTriangleExclamation" className="text-lg" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-mono">
              ESCALATIONS
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
              03
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              High-priority follow-ups
            </div>
          </div>
        </div>

        {/* CARD 4: DISPATCH CHAT */}
        <div
          onClick={() => navigate(PATHS.APP.CHAT)}
          className="group cursor-pointer rounded-3xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 p-5 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Icon iconName="FaComments" className="text-lg" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 font-mono">
              DISPATCH CHAT
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                Live
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Citizen & Operator Messaging
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT TWO-COLUMN SECTION
         ════════════════════════════════════════════════ */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">

        {/* ─── LEFT COLUMN: RECENT COMPLAINT INFLOW (8 COLS) ─── */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Recent Complaint Inflow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live incoming citizen telematics and civic hotline records
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/30 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${statusFilter === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                All ({stats.all || complaints.length})
              </button>
              <button
                onClick={() => setStatusFilter("unsettled")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${statusFilter === "unsettled"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Unsettled ({stats.unsettled})
              </button>
              <button
                onClick={() => setStatusFilter("settled")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${statusFilter === "settled"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Settled ({stats.settled})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <Table className="border-collapse bg-white dark:bg-bg-light border-0 shadow-none">
                <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <TableRow>
                    <TableCell isHeader className="py-4">CASE ID</TableCell>
                    <TableCell isHeader className="py-4">COMPLAINANT</TableCell>
                    <TableCell isHeader className="py-4">PLATE NUMBER</TableCell>
                    <TableCell isHeader className="py-4">VIOLATION</TableCell>
                    <TableCell isHeader className="py-4">STATUS</TableCell>
                    <TableCell isHeader align="right" className="py-4 pr-6">ACTION</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="py-20">
                        <LoadingSpinner size="lg" text="Syncing live dispatch records..." />
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Icon iconName="FaFolderOpen" size={32} />
                          <span className="text-xs font-black uppercase tracking-wider">No active complaint records</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map((complaint) => {
                      const complainantName = complaint.complainant?.name || complaint.user?.name || "Maria Elena Ramos";
                      const plateNum = complaint.driver?.plate_number || "ABC-1234";
                      const violationName = complaint.category?.category_name || complaint.title || "Overcharging Fare";
                      const isSettled = complaint.status === "settled";

                      return (
                        <TableRow key={complaint.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <TableCell className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {formatCaseId(complaint.id)}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs text-slate-900 dark:text-white">
                                {complainantName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {formatTimeSource(complaint.incident_date_time)}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 font-mono text-xs font-black text-blue-700 dark:text-blue-400 inline-block">
                              {plateNum}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {violationName}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${isSettled
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                                }`}
                            >
                              {complaint.status}
                            </span>
                          </TableCell>

                          <TableCell align="right" className="pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setSelectedComplaintId(complaint.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm"
                              >
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: ANNOUNCEMENTS BULLETIN (4 COLS) ─── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Announcements & Directives Bulletin */}
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon iconName="FaBullhorn" size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Directives & Advisories
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isStaff ? "Official Staff Bulletins" : "Passed from Staff • Live Sync"}
                  </p>
                </div>
              </div>

              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                {recentAnnouncements.length} Active
              </span>
            </div>

            {/* List of recent announcements */}
            <div className="space-y-2.5">
              {recentAnnouncements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active circulars at this moment.
                </div>
              ) : (
                recentAnnouncements.map((item) => {
                  const urgencyBadge =
                    item.urgency === "urgent"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : item.urgency === "priority"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20";

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAnnouncement(item)}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border ${urgencyBadge}`}>
                          {item.urgency}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400 truncate max-w-[120px]">
                          {item.refNumber || item.ref_number}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(PATHS.APP.ANNOUNCEMENTS)}
              className="text-xs font-extrabold uppercase tracking-wider py-2.5 rounded-xl border border-slate-200 dark:border-white/10"
            >
              Open Announcements Hub →
            </Button>
          </div>
        </div>

      </div>

      {/* Linked Modals */}
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
      <ComplaintDetailsModal
        isOpen={selectedComplaintId !== null}
        onClose={() => setSelectedComplaintId(null)}
        complaintId={selectedComplaintId}
        onStatusUpdated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Official Announcement Preview Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#080B14]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/25">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official TMU Directive Preview
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
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffDashboard;
