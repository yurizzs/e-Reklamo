import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import { Button, Icon, Modal } from "../../components/ui";
import { InputField } from "../../components/ui/forms";
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
} from "../../components/ui/table/Table";
import OperatorScheduleService from "../../services/OperatorScheduleService";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import EmergencyConfirmModal from "./components/EmergencyConfirmModal";

interface EmployeeOption {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  position: string;
  role: string;
}

interface ScheduleItem {
  employee_id: number;
  staff: string;
  role: string;
  badge: string;
  employee_code: string;
  avatar_initials: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  // Biometric Attendance fields
  schedule_id?: number;
  attendance_status?: string; // 'pending' | 'verified' | 'emergency_manual' | 'absent'
  verified_at?: string;
  verification_method?: string;
  confidence_score?: number;
  emergency_reason?: string;
  confirmed_by_name?: string;
}

const dayHeaders = [
  { key: "monday", label: "MON", dateNum: "21", isToday: false },
  { key: "tuesday", label: "TUE", dateNum: "22", isToday: true },
  { key: "wednesday", label: "WED", dateNum: "23", isToday: false },
  { key: "thursday", label: "THU", dateNum: "24", isToday: false },
  { key: "friday", label: "FRI", dateNum: "25", isToday: false },
  { key: "saturday", label: "SAT", dateNum: "26", isToday: false },
  { key: "sunday", label: "SUN", dateNum: "27", isToday: false },
];

const mockBadges: Record<string, string> = {
  1: "HQ",
  2: "PATROL",
  3: "LEAD",
  4: "RADIO",
  5: "FIELD",
  6: "TRIAGE",
};

const StaffSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("tuesday");
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [scheduleViewMode, setScheduleViewMode] = useState<"mine" | "all">(!isAdmin ? "mine" : "all");
  const [isSaving, setIsSaving] = useState(false);

  // Emergency Modal for Staff Manual Confirmation
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [targetMemberForScan, setTargetMemberForScan] = useState<ScheduleItem | null>(null);

  const fetchData = async () => {
    try {
      const [employeesResponse, schedulesResponse] = await Promise.all([
        OperatorScheduleService.getEmployees() as any,
        OperatorScheduleService.getAll() as any,
      ]);

      const employeeList = employeesResponse?.data ?? [];
      const scheduleRecords = schedulesResponse?.data ?? [];

      const scheduleMap = new Map<string, Record<string, string>>();
      const attendanceMap = new Map<string, any>();

      scheduleRecords.forEach((record: any) => {
        const key = String(record.employee_id);
        let day = "";
        if (record.schedule_date) {
          const dateParts = record.schedule_date.split("-").map(Number);
          if (dateParts.length === 3) {
            const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
            day = dateObj.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase();
          }
        }
        if (day) {
          const current = scheduleMap.get(key) ?? {};
          current[day] =
            record.shift_type === "Off" || record.shift_start === "00:00"
              ? "Off"
              : `${record.shift_start}–${record.shift_end}`;
          scheduleMap.set(key, current);
        }

        // Store latest attendance record for officer
        if (!attendanceMap.has(key) || record.attendance_status === "verified" || record.attendance_status === "emergency_manual") {
          attendanceMap.set(key, record);
        }
      });

      const mapped: ScheduleItem[] = employeeList.map((employee: EmployeeOption, idx: number) => {
        const weekSchedule = scheduleMap.get(String(employee.id)) ?? {};
        const att = attendanceMap.get(String(employee.id)) ?? {};

        const fn = employee.first_name || "";
        const ln = employee.last_name || "";
        const fullName = `${fn} ${ln}`.trim() || employee.username;
        const initials = `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || "TM";
        const code = `#TMU-${String(employee.id).padStart(3, "0")}`;
        const badgeTag = mockBadges[(idx % 6) + 1] || "STAFF";

        return {
          employee_id: employee.id,
          staff: fullName,
          role: employee.position || employee.role || "Staff",
          badge: badgeTag,
          employee_code: code,
          avatar_initials: initials,
          monday: weekSchedule.monday ?? (idx % 2 === 0 ? "Off" : "06:00–14:00"),
          tuesday: weekSchedule.tuesday ?? (idx % 3 === 0 ? "08:00–17:00" : idx % 2 === 0 ? "06:00–14:00" : "14:00–22:00"),
          wednesday: weekSchedule.wednesday ?? "08:00–17:00",
          thursday: weekSchedule.thursday ?? (idx % 4 === 0 ? "Off" : "08:00–17:00"),
          friday: weekSchedule.friday ?? "08:00–17:00",
          saturday: weekSchedule.saturday ?? (idx % 3 === 0 ? "08:00–16:00" : "Off"),
          sunday: weekSchedule.sunday ?? "Off",
          // Biometric Evidence
          schedule_id: att.id,
          attendance_status: att.attendance_status || "pending",
          verified_at: att.verified_at,
          verification_method: att.verification_method,
          confidence_score: att.confidence_score ? Number(att.confidence_score) : undefined,
          emergency_reason: att.emergency_reason,
          confirmed_by_name: att.confirmed_by_name,
        };
      });

      setSchedules(mapped);
    } catch {
      notify.error("Could not load schedules from the server.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSchedules = useMemo(() => {
    let list = schedules;

    // For non-admin operators in "mine" view mode, filter to logged in operator's schedule
    if (!isAdmin && scheduleViewMode === "mine") {
      const uName = (user?.first_name || user?.name || user?.username || "").toLowerCase();
      const uId = user?.id;
      const myItem = list.find(
        (s) => s.employee_id === uId || (uName && s.staff.toLowerCase().includes(uName))
      );
      if (myItem) {
        list = [myItem];
      }
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.staff.toLowerCase().includes(q) ||
        s.employee_code.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q)
    );
  }, [schedules, searchQuery, scheduleViewMode, isAdmin, user]);

  const openEditModal = (member: ScheduleItem) => {
    setSelectedMember(member);
    setSelectedDay("tuesday");
    setIsRecurring(true);
    setIsModalOpen(true);
  };

  const handleAddScheduleClick = () => {
    if (!isAdmin) return;
    if (schedules.length > 0) {
      setSelectedMember(schedules[0]);
    }
    setSelectedDay("tuesday");
    setIsRecurring(true);
    setIsModalOpen(true);
  };

  const handleOpenEmergencyConfirm = (member: ScheduleItem) => {
    setTargetMemberForScan(member);
    setIsEmergencyModalOpen(true);
  };

  const updateScheduleValue = (day: string, value: string) => {
    if (!selectedMember) return;

    setSchedules((prev) =>
      prev.map((member) =>
        member.employee_id === selectedMember.employee_id
          ? { ...member, [day]: value }
          : member
      )
    );

    setSelectedMember((prev) =>
      prev ? { ...prev, [day]: value } : prev
    );
  };

  const handleSave = async () => {
    if (!selectedMember) return;

    setIsSaving(true);

    try {
      const dayDate = new Date("2026-10-21");
      const selectedDate = new Date(dayDate);

      if (selectedDay === "monday") selectedDate.setDate(dayDate.getDate() + 0);
      if (selectedDay === "tuesday") selectedDate.setDate(dayDate.getDate() + 1);
      if (selectedDay === "wednesday") selectedDate.setDate(dayDate.getDate() + 2);
      if (selectedDay === "thursday") selectedDate.setDate(dayDate.getDate() + 3);
      if (selectedDay === "friday") selectedDate.setDate(dayDate.getDate() + 4);
      if (selectedDay === "saturday") selectedDate.setDate(dayDate.getDate() + 5);
      if (selectedDay === "sunday") selectedDate.setDate(dayDate.getDate() + 6);

      const rawShiftValue = selectedMember[selectedDay as keyof ScheduleItem];
      const shiftValue = typeof rawShiftValue === "string" ? rawShiftValue : "Off";

      const payload = {
        employee_id: selectedMember.employee_id,
        schedule_date: selectedDate.toISOString().slice(0, 10),
        shift_start: shiftValue === "Off" ? "00:00" : shiftValue.split("–")[0] || "08:00",
        shift_end: shiftValue === "Off" ? "00:00" : shiftValue.split("–")[1] || "17:00",
        shift_type: shiftValue === "Off" ? "Off" : "Shift",
        status: "active",
      };

      await OperatorScheduleService.create(payload);
      notify.success("Schedule saved to server.");
      setIsModalOpen(false);
      await fetchData();
    } catch {
      notify.error("Failed to save schedule to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to render shift pill badges
  const renderShiftPill = (shiftValue: string, isToday: boolean) => {
    if (shiftValue === "Off" || !shiftValue) {
      return (
        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
          Off
        </span>
      );
    }

    if (shiftValue.includes("06:00") || shiftValue.includes("08:00–14:00")) {
      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border transition-all ${
            isToday
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
              : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"
          }`}
        >
          {shiftValue}
        </span>
      );
    }

    if (shiftValue.includes("08:00–17:00") || shiftValue.includes("08:00 - 17:00")) {
      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border transition-all ${
            isToday
              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
              : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
          }`}
        >
          {shiftValue}
        </span>
      );
    }

    if (shiftValue.includes("14:00") || shiftValue.includes("08:00–16:00")) {
      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border transition-all ${
            isToday
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
              : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20"
          }`}
        >
          {shiftValue}
        </span>
      );
    }

    if (shiftValue.includes("22:00") || shiftValue.includes("00:00")) {
      return (
        <span
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight border transition-all ${
            isToday
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
              : "bg-slate-800 dark:bg-slate-800/80 text-slate-100 border-slate-700"
          }`}
        >
          {shiftValue}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
        {shiftValue}
      </span>
    );
  };

  const verifiedCount = schedules.filter(
    (s) => s.attendance_status === "verified" || s.attendance_status === "emergency_manual"
  ).length;

  const content = (
    <div className="space-y-8 pb-10 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* ════════════════════════════════════════════════
          HEADER SECTION WITH TITLE & ACTION BUTTONS
         ════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Staff Schedule & Duty Roster
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Python Biometrics
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Sector 4 duty roster, shift allocation, and zero-storage biometric attendance evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {isAdmin ? (
            <Button
              variant="primary"
              iconName="FaPlus"
              onClick={handleAddScheduleClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              + Add Schedule
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold shadow-sm">
              <Icon iconName="FaEye" className="text-blue-500 text-xs" />
              <span>Supervisor View</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TOP 4 KPI METRICS CARDS
         ════════════════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1: TOTAL ROSTER */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Icon iconName="FaIdCard" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              TOTAL STAFF
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {String(schedules.length || 0).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Officers
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: BIOMETRIC ATTENDANCE VERIFIED */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icon iconName="FaShield" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              ATTENDANCE VERIFIED
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {String(verifiedCount).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                / {schedules.length || 0} Present
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: CURRENT SHIFT */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Icon iconName="FaClock" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              CURRENT SHIFT
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                Day Shift
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                08:00–17:00
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: STORAGE OPTIMIZATION */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Icon iconName="FaDatabase" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              STORAGE FOOTPRINT
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                0 KB
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-bold">
                RAM In-Memory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ROSTER TABLE CONTAINER CARD
         ════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300 space-y-4 p-6">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs">
                <Icon iconName="FaAngleLeft" />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white px-2">
                Oct 21 – Oct 27, 2026
              </span>
              <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs">
                <Icon iconName="FaAngleRight" />
              </button>
            </div>
            <button className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
              Today
            </button>

            {!isAdmin && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl ml-2">
                <button
                  type="button"
                  onClick={() => setScheduleViewMode("mine")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    scheduleViewMode === "mine"
                      ? "bg-[#1D3557] dark:bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  My Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    scheduleViewMode === "all"
                      ? "bg-[#1D3557] dark:bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Roster
                </button>
              </div>
            )}
          </div>

          {/* Shift Legend Indicators */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Morning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Afternoon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Off</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-64">
            <InputField
              label=""
              placeholder="Search officer..."
              iconName="FaMagnifyingGlass"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs py-2"
              fullWidth
            />
          </div>
        </div>

        {/* Duty Roster Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[1080px] border-collapse bg-white dark:bg-bg-light border-0 shadow-none">
            <TableHeader className="bg-slate-50/70 dark:bg-black/25 border-b border-slate-100 dark:border-white/5">
              <tr>
                <TableCell isHeader className="py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-56">
                  OFFICER
                </TableCell>
                <TableCell isHeader align="center" className="py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-44">
                  ATTENDANCE EVIDENCE
                </TableCell>
                {dayHeaders.map((dh) => (
                  <TableCell
                    key={dh.key}
                    isHeader
                    align="center"
                    className={`py-4 transition-colors ${
                      dh.isToday
                        ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-extrabold"
                        : "text-slate-500 dark:text-slate-400 font-bold"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                        <span>{dh.label}</span>
                        {dh.isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </div>
                      <div className="text-xs font-black tracking-tight">
                        {dh.isToday ? `${dh.dateNum} TODAY` : dh.dateNum}
                      </div>
                    </div>
                  </TableCell>
                ))}
                <TableCell isHeader align="center" className="py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28">
                  ACTIONS
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" className="py-16">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Icon iconName="FaDatabase" size={32} />
                      <span className="text-xs font-black uppercase tracking-wider">
                        No officer schedules found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((member) => (
                  <TableRow
                    key={member.employee_id}
                    className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    {/* Officer Column */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          {member.avatar_initials}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {member.staff}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                              {member.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {member.employee_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Attendance Evidence Column */}
                    <TableCell align="center" className="py-3">
                      {member.attendance_status === "verified" ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Verified ({member.confidence_score ? `${member.confidence_score}%` : "98%"})
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {member.verified_at
                              ? new Date(member.verified_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Face Match"} • RAM Only
                          </span>
                        </div>
                      ) : member.attendance_status === "emergency_manual" ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            <Icon iconName="FaShield" className="text-amber-600 text-[10px]" />
                            Manual Override
                          </span>
                          <span
                            className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]"
                            title={member.emergency_reason}
                          >
                            Auth: {member.confirmed_by_name || "Supervisor"}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            <Icon iconName="FaClock" className="text-[9px]" />
                            Pending Scan
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            Awaiting Check-in
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Day Schedule Columns */}
                    {dayHeaders.map((dh) => {
                      const shiftVal = member[dh.key as keyof ScheduleItem] as string;
                      return (
                        <TableCell
                          key={dh.key}
                          align="center"
                          className={`py-3 transition-colors ${
                            dh.isToday ? "bg-blue-50/30 dark:bg-blue-500/[0.03]" : ""
                          }`}
                        >
                          {renderShiftPill(shiftVal, dh.isToday)}
                        </TableCell>
                      );
                    })}

                    {/* Actions Column */}
                    <TableCell align="center" className="py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Supervisor Emergency Override button */}
                        {(isAdmin || user?.role === "staff") && (
                          <button
                            onClick={() => handleOpenEmergencyConfirm(member)}
                            className="p-2 rounded-xl text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                            title="Emergency Manual Attendance Confirmation"
                          >
                            <Icon iconName="FaShield" className="text-xs" />
                          </button>
                        )}

                        {/* View / Edit Modal */}
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                          title={isAdmin ? "Edit Schedule" : "View Schedule & Evidence"}
                        >
                          <Icon iconName={isAdmin ? "FaPen" : "FaEye"} className="text-xs" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>Showing {filteredSchedules.length} of {schedules.length || 0} officers</div>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-white/5">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-white/5">
              Next
            </button>
          </div>
        </div>

        {/* Bottom Sector Coverage Status Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sector 4 Coverage: Optimal (Minimum requirement met)</span>
          </div>
          <span className="text-slate-400">Zero Storage Biometric Engine • Python OpenCV Active</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SCHEDULE INSPECTOR & EDIT MODAL
         ════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        hideHeader
      >
        {selectedMember && (
          <div className="space-y-6 p-1">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[10px]">
                    {isAdmin ? "DUTY ROSTER CONTROL" : "DUTY ROSTER VIEW"}
                  </span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Station TMU-HQ</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                  {isAdmin ? "Edit Staff Schedule" : "View Staff Schedule"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAdmin
                    ? "Modify weekly duty assignments, shift timing, and sector allocation."
                    : "Read-only view of officer weekly duty assignments and shift timing."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <Icon iconName="FaXmark" className="text-base" />
              </button>
            </div>

            {/* Officer Overview Box */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {selectedMember.avatar_initials}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {selectedMember.staff} ({selectedMember.badge})
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {selectedMember.role} • {selectedMember.employee_code} • Sector 4 Deployment
                  </div>
                </div>
              </div>

              {/* Current Assigned Box */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 py-2.5 flex flex-col items-start md:items-end shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                  CURRENT ASSIGNED
                </span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    {selectedMember[selectedDay as keyof ScheduleItem] === "Off"
                      ? "Off Duty / Rest Day"
                      : `Shift (${selectedMember[selectedDay as keyof ScheduleItem]})`}
                  </span>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                ATTENDANCE & BIOMETRIC WORK EVIDENCE AUDIT CARD
               ════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900/40 dark:to-blue-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Attendance Evidence & Biometrics Audit
                  </span>
                </div>

                {selectedMember.attendance_status === "verified" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <Icon iconName="FaCheck" />
                    Verified ({selectedMember.confidence_score ? `${selectedMember.confidence_score}%` : "98.7%"})
                  </span>
                ) : selectedMember.attendance_status === "emergency_manual" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    <Icon iconName="FaTriangleExclamation" />
                    Manual Override
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Pending Check-in
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">METHOD</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedMember.verification_method === "facial_recognition"
                      ? "Python OpenCV (Face)"
                      : selectedMember.verification_method === "manual_emergency"
                      ? "Supervisor Override"
                      : "Awaiting Scan"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">VERIFIED AT</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedMember.verified_at
                      ? new Date(selectedMember.verified_at).toLocaleTimeString()
                      : "—"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">STORAGE ACCUMULATION</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    0 KB (RAM Volatile)
                  </div>
                </div>
              </div>

              {selectedMember.emergency_reason && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <strong>Emergency Reason:</strong> {selectedMember.emergency_reason}
                  {selectedMember.confirmed_by_name && (
                    <span className="block text-[10px] opacity-80 mt-0.5">
                      Authorized by: {selectedMember.confirmed_by_name}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons inside Audit Card */}
              <div className="flex items-center gap-2 pt-1">
                {(isAdmin || user?.role === "staff") && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleOpenEmergencyConfirm(selectedMember);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Icon iconName="FaShield" />
                    <span>Emergency Manual Override</span>
                  </button>
                )}
              </div>
            </div>

            {/* Day of Assignment Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  DAY OF ASSIGNMENT
                </span>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-400">
                  {selectedDay === "tuesday"
                    ? "Today: Tuesday, Oct 22"
                    : `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`}
                </span>
              </div>

              <div className="bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl p-1.5 grid grid-cols-7 gap-1">
                {dayHeaders.map((dh) => {
                  const isSelected = selectedDay === dh.key;
                  return (
                    <button
                      key={dh.key}
                      onClick={() => setSelectedDay(dh.key)}
                      className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#1D3557] dark:bg-blue-600 text-white font-bold shadow-md"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-white/60 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="text-[10px] opacity-80">{dh.label}</span>
                      <span className="text-xs font-bold mt-0.5">{dh.dateNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Allocation Grid */}
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                SHIFT ALLOCATION
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    id: "06:00–14:00",
                    title: "Morning Patrol",
                    duration: "06:00 – 14:00 (8h)",
                  },
                  {
                    id: "08:00–17:00",
                    title: "Day Shift (HQ Admin)",
                    duration: "08:00 – 17:00 (9h with 1h meal)",
                  },
                  {
                    id: "14:00–22:00",
                    title: "Afternoon Peak",
                    duration: "14:00 – 22:00 (8h)",
                  },
                  {
                    id: "22:00–06:00",
                    title: "Night Watch / Dispatch",
                    duration: "22:00 – 06:00 (8h)",
                  },
                ].map((shift) => {
                  const isSelected =
                    selectedMember[selectedDay as keyof ScheduleItem] === shift.id;
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => isAdmin && updateScheduleValue(selectedDay, shift.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm"
                          : "border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-900/40"
                      } ${!isAdmin ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {shift.title}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {shift.duration}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recurring Weekly Pattern Toggle */}
            <div className="border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm shrink-0">
                  <Icon iconName="FaRotate" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Recurring Weekly Pattern
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Apply {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} shift every week automatically
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!isAdmin}
                onClick={() => isAdmin && setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !isAdmin ? "opacity-60 cursor-not-allowed" : ""
                } ${
                  isRecurring ? "bg-[#1D3557] dark:bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRecurring ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Immediate Roster Sync Alert Banner */}
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs">
              <Icon iconName="FaCircleInfo" className="text-blue-700 dark:text-blue-400 text-sm shrink-0 mt-0.5" />
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">
                  {isAdmin ? "Immediate Roster Sync:" : "Sector Duty Roster:"}
                </span>{" "}
                {isAdmin
                  ? "Saving updates the sector duty roster immediately. Standby relief units will be automatically notified for Sector 4."
                  : "Duty roster schedule is managed by Station Administrators. Contact your unit lead for shift change requests."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => updateScheduleValue(selectedDay, "Off")}
                  className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs font-bold transition-colors"
                >
                  Mark Off Duty / Rest Day
                </button>
              ) : (
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Icon iconName="FaLock" className="text-xs text-slate-400" />
                  <span>Read-only view • Modifications restricted to Admins</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-[#1D3557] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Icon iconName="FaFloppyDisk" className="text-xs" />
                      <span>{isSaving ? "Saving..." : "Save Schedule"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#1D3557] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Emergency Manual Confirmation Modal */}
      {targetMemberForScan && (
        <EmergencyConfirmModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          onSuccess={() => fetchData()}
          scheduleId={targetMemberForScan.schedule_id}
          employeeId={targetMemberForScan.employee_id}
          employeeName={targetMemberForScan.staff}
          supervisorName={user?.first_name ? `${user.first_name} ${user.last_name}` : "Station Supervisor"}
        />
      )}
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffSchedulePage;
