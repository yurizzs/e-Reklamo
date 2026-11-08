import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import { Button, Icon, Modal } from "../../components/ui";
import { InputField, Select } from "../../components/ui/forms";
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
  const [dutySector, setDutySector] = useState<string>("Sector 4 — Central Highway & Triage HQ");
  const [rosterRole, setRosterRole] = useState<string>("Station Commander / Desk Triage");
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [scheduleViewMode, setScheduleViewMode] = useState<"mine" | "all">(!isAdmin ? "mine" : "all");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [employeesResponse, schedulesResponse] = await Promise.all([
        OperatorScheduleService.getEmployees() as any,
        OperatorScheduleService.getAll() as any,
      ]);

      const employeeList = employeesResponse?.data ?? [];
      const scheduleRecords = schedulesResponse?.data ?? [];

      const scheduleMap = new Map<string, Record<string, string>>();
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
        if (!day) return;

        const current = scheduleMap.get(key) ?? {};
        current[day] = (record.shift_type === "Off" || record.shift_start === "00:00")
          ? "Off"
          : `${record.shift_start}–${record.shift_end}`;
        scheduleMap.set(key, current);
      });

      const mapped: ScheduleItem[] = employeeList.map((employee: EmployeeOption, idx: number) => {
        const weekSchedule = scheduleMap.get(String(employee.id)) ?? {};
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
    setDutySector("Sector 4 — Central Highway & Triage HQ");
    setRosterRole(member.role || "Station Commander / Desk Triage");
    setIsRecurring(true);
    setIsModalOpen(true);
  };

  const handleAddScheduleClick = () => {
    if (!isAdmin) return;
    if (schedules.length > 0) {
      setSelectedMember(schedules[0]);
    }
    setSelectedDay("tuesday");
    setDutySector("Sector 4 — Central Highway & Triage HQ");
    setRosterRole("Station Commander / Desk Triage");
    setIsRecurring(true);
    setIsModalOpen(true);
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

  // Helper function to render shift pill badges according to reference design
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

  const content = (
    <div className="space-y-8 pb-10 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ════════════════════════════════════════════════
          HEADER SECTION WITH TITLE & ACTION BUTTONS
         ════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Staff Schedule
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Weekly duty roster, officer shift allocation, and coverage overview for Sector 4.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="ghost"
            iconName="FaFilter"
            className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-white/5"
          >
            Filter
          </Button>

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
              <span>Read-Only Roster</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TOP 4 KPI METRICS CARDS
         ════════════════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* CARD 1: TOTAL STAFF */}
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
                {String(schedules.length || 13).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Officers
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: ON DUTY TODAY */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icon iconName="FaShield" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              ON DUTY TODAY
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                08
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                / {schedules.length || 13} Active
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
                Morning
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                06:00–14:00
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: STANDBY RELIEF */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Icon iconName="FaArrowsRotate" className="text-xl" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">
              STANDBY RELIEF
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                02
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ready
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
                Oct 21 – Oct 27, 2024
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
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Afternoon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100" />
              <span>Night</span>
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
          <Table className="min-w-[1000px] border-collapse bg-white dark:bg-bg-light border-0 shadow-none">
            <TableHeader className="bg-slate-50/70 dark:bg-black/25 border-b border-slate-100 dark:border-white/5">
              <tr>
                <TableCell isHeader className="py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-64">
                  OFFICER
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
                <TableCell isHeader align="center" className="py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-20">
                  ACTIONS
                </TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" className="py-16">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Icon iconName="FaDatabase" size={32} />
                      <span className="text-xs font-black uppercase tracking-wider">No officer schedules found</span>
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
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        title={isAdmin ? "Edit Schedule" : "View Schedule"}
                      >
                        <Icon iconName={isAdmin ? "FaPen" : "FaEye"} className="text-xs" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>Showing {filteredSchedules.length} of {schedules.length || 13} officers</div>

          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-white/5">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-white/5">
              2
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
          <span className="text-slate-400">Last updated 10 mins ago</span>
        </div>
      </div>

      {/* Schedule Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        hideHeader
      >
        {selectedMember && (
          <div className="space-y-6 p-1">
            {/* Custom Header Tag & Title */}
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
                      : `Day Shift (${selectedMember[selectedDay as keyof ScheduleItem]})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Day of Assignment Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  DAY OF ASSIGNMENT
                </span>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-400">
                  {selectedDay === "tuesday" ? "Today: Tuesday, Oct 22" : `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`}
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
                ].map((shiftOpt) => {
                  const currentVal = selectedMember[selectedDay as keyof ScheduleItem] as string;
                  const isSelected = currentVal === shiftOpt.id || (currentVal.includes("08:00") && shiftOpt.id === "08:00–17:00");

                  return (
                    <div
                      key={shiftOpt.id}
                      onClick={() => isAdmin && updateScheduleValue(selectedDay, shiftOpt.id)}
                      className={`p-4 rounded-2xl transition-all border ${
                        isAdmin ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelected
                          ? "border-2 border-[#1D3557] dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 shadow-sm"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-[#1D3557] dark:border-blue-500 bg-[#1D3557] dark:bg-blue-500"
                                : "border-slate-300 dark:border-slate-600 bg-transparent"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {shiftOpt.title}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="bg-[#1D3557] dark:bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {isAdmin ? "SELECTED" : "ASSIGNED"}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium pl-6 mt-1">
                        {shiftOpt.duration}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duty Sector & Roster Role Select Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="DUTY SECTOR"
                value={dutySector}
                disabled={!isAdmin}
                onChange={(e) => setDutySector(e.target.value)}
                options={[
                  { value: "Sector 4 — Central Highway & Triage HQ", label: "Sector 4 — Central Highway & Triage HQ" },
                  { value: "Sector 1 — Commercial Central", label: "Sector 1 — Commercial Central" },
                  { value: "Sector 2 — Residential West", label: "Sector 2 — Residential West" },
                  { value: "Sector 3 — Industrial South", label: "Sector 3 — Industrial South" },
                ]}
              />

              <Select
                label="ROSTER ROLE"
                value={rosterRole}
                disabled={!isAdmin}
                onChange={(e) => setRosterRole(e.target.value)}
                options={[
                  { value: "Station Commander / Desk Triage", label: "Station Commander / Desk Triage" },
                  { value: "Patrol Operations Lead", label: "Patrol Operations Lead" },
                  { value: "Field Response Officer", label: "Field Response Officer" },
                  { value: "Radio Dispatch Controller", label: "Radio Dispatch Controller" },
                ]}
              />
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
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffSchedulePage;
