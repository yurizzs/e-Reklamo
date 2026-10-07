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
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import CreateComplaintModal from "./CreateComplaintModal";
import MayorReportModal from "./MayorReportModal";
import PrintReportModal from "./PrintReportModal";
import CreateAnnouncementModal from "./CreateAnnouncementModal";

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

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [stats, setStats] = useState({ all: 0, unsettled: 0, settled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMayorModalOpen, setIsMayorModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [printCustomData, setPrintCustomData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = (await ComplaintService.getAll({
          limit: 5,
          status: statusFilter !== "all" ? statusFilter : undefined,
        })) as any;

        const payload = response?.data ?? response;
        const fetchedComplaints: ComplaintRecord[] = payload?.complaints ?? [];
        setComplaints(fetchedComplaints.slice(0, 5));
        setStats(payload?.stats ?? { all: 0, unsettled: 0, settled: 0 });
      } catch {
        setComplaints([]);
        setStats({ all: 0, unsettled: 0, settled: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [statusFilter, refreshKey]);

  // Active Officers Mock Data
  const activeOfficers = [
    {
      id: 1,
      name: "Insp. Miguel Santos",
      badge: "Badge #TMU-104 • Sector 2",
      avatar: "M",
      statusText: "3 Cases • On patrol",
      statusColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      id: 2,
      name: "Officer Ana Reyes",
      badge: "Badge #TMU-221 • Sector 4",
      avatar: "A",
      statusText: "1 Case • Stationary",
      statusColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: 3,
      name: "Sgt. Danilo Ramos",
      badge: "Badge #TMU-088 • Sector 1",
      avatar: "D",
      statusText: "2 Cases • En route",
      statusColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: 4,
      name: "Officer Kim Villanueva",
      badge: "Badge #TMU-315 • Desk Review",
      avatar: "K",
      statusText: "0 Active • On break",
      statusColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
  ];

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
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Updated Just Now • 09:42 AM PST</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                iconName="FaBullhorn"
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                Post Announcement (WIP)
              </Button>
              <Button
                iconName="FaLandmark"
                onClick={() => setIsMayorModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-3 rounded-2xl shadow-lg shadow-amber-500/20 text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                Mayor Report (WIP)
              </Button>
              <Button
                iconName="FaPlus"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                + Log New Incident
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-400 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>+3 incoming from Sector B</span>
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold text-blue-700 dark:text-blue-400 w-fit">
            <Icon iconName="FaFlag" className="text-[10px]" />
            <span>Target: 20 cases (70% done)</span>
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold text-rose-700 dark:text-rose-400 w-fit">
            <Icon iconName="FaShield" className="text-[10px]" />
            <span>Requires supervisor sign-off</span>
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-[10px] font-bold text-blue-800 dark:text-blue-300 w-fit">
            <Icon iconName="FaHeadphones" className="text-[10px]" />
            <span>4 active operator channels</span>
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
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All ({stats.all || complaints.length})
              </button>
              <button
                onClick={() => setStatusFilter("unsettled")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  statusFilter === "unsettled"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Unsettled ({stats.unsettled})
              </button>
              <button
                onClick={() => setStatusFilter("settled")}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  statusFilter === "settled"
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
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                                isSettled
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

        {/* ─── RIGHT COLUMN: ACTIVE OFFICERS (4 COLS) ─── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6 transition-colors duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Active Officers
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Shift deployment & caseload
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4 Online
              </span>
            </div>

            {/* Officers List */}
            <div className="space-y-4">
              {activeOfficers.map((officer) => (
                <div
                  key={officer.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-black/20 border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-white border border-slate-300 dark:border-white/10">
                        {officer.avatar}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {officer.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {officer.badge}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider ${officer.statusColor}`}
                  >
                    {officer.statusText}
                  </span>
                </div>
              ))}
            </div>

            {/* Roster Button */}
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate(PATHS.APP.STAFF_SCHEDULES)}
              className="mt-2 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all text-center"
            >
              View Complete Roster & Schedules
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
      <MayorReportModal
        isOpen={isMayorModalOpen}
        onClose={() => setIsMayorModalOpen(false)}
        onOpenPrint={(customData) => {
          setPrintCustomData(customData);
          setIsMayorModalOpen(false);
          setIsPrintModalOpen(true);
        }}
      />
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={printCustomData}
      />
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffDashboard;
