import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import { Button, Icon, Modal } from "../../components/ui";
import { Select } from "../../components/ui/forms";
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
} from "../../components/ui/table/Table";
import OperatorScheduleService from "../../services/OperatorScheduleService";
import { notify } from "../../util/notify";
import { useAuth } from "../../contexts/AuthContext";

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
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const StaffSchedulePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("monday");
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
          : `${record.shift_start} - ${record.shift_end}`;
        scheduleMap.set(key, current);
      });

      const mapped = employeeList.map((employee: EmployeeOption) => {
        const weekSchedule = scheduleMap.get(String(employee.id)) ?? {};
        return {
          employee_id: employee.id,
          staff: `${employee.first_name} ${employee.last_name}`.trim() || employee.username,
          role: employee.position || employee.role || "Staff",
          monday: weekSchedule.monday ?? "Off",
          tuesday: weekSchedule.tuesday ?? "Off",
          wednesday: weekSchedule.wednesday ?? "Off",
          thursday: weekSchedule.thursday ?? "Off",
          friday: weekSchedule.friday ?? "Off",
          saturday: weekSchedule.saturday ?? "Off",
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

  const summary = useMemo(() => {
    const totalStaff = schedules.length;
    const activeShifts = schedules.reduce((count, member) => {
      return count + dayLabels.filter((day) => member[day.toLowerCase() as keyof ScheduleItem] !== "Off").length;
    }, 0);

    return {
      totalStaff,
      activeShifts,
      pendingUpdates: Math.max(0, totalStaff - activeShifts),
    };
  }, [schedules]);

  const openEditModal = (member: ScheduleItem) => {
    setSelectedMember(member);
    setSelectedDay("monday");
    setIsModalOpen(true);
  };

  const handleAddScheduleClick = () => {
    if (schedules.length > 0) {
      setSelectedMember(schedules[0]);
    }
    setSelectedDay("monday");
    setIsModalOpen(true);
  };

  const updateScheduleValue = (day: string, value: string) => {
    if (!selectedMember) return;

    setSchedules((prev) =>
      prev.map((member) =>
        member.staff === selectedMember.staff
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
      const dayDate = new Date("2026-07-05");
      const selectedDate = new Date(dayDate);

      if (selectedDay === "monday") selectedDate.setDate(dayDate.getDate() + 1);
      if (selectedDay === "tuesday") selectedDate.setDate(dayDate.getDate() + 2);
      if (selectedDay === "wednesday") selectedDate.setDate(dayDate.getDate() + 3);
      if (selectedDay === "thursday") selectedDate.setDate(dayDate.getDate() + 4);
      if (selectedDay === "friday") selectedDate.setDate(dayDate.getDate() + 5);
      if (selectedDay === "saturday") selectedDate.setDate(dayDate.getDate() + 6);
      if (selectedDay === "sunday") selectedDate.setDate(dayDate.getDate() + 0);

      const rawShiftValue = selectedMember[selectedDay as keyof ScheduleItem];
      const shiftValue = typeof rawShiftValue === "string" ? rawShiftValue : "Off";

      const payload = {
        employee_id: selectedMember.employee_id,
        schedule_date: selectedDate.toISOString().slice(0, 10),
        shift_start: shiftValue === "Off" ? "00:00" : shiftValue.split(" - ")[0],
        shift_end: shiftValue === "Off" ? "00:00" : shiftValue.split(" - ")[1],
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

  const content = (
    <div className="space-y-8 pb-8 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
              {isAdmin ? "Admin Operations" : "Staff Roster"}
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              {isAdmin ? "Staff Work Schedule" : "Final Staff Schedule"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {isAdmin
                ? "Manage recurring staff shifts in a weekly roster view so allocation stays clear and easy to update."
                : "View your official published weekly work roster and assigned duty shifts."}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="primary"
              iconName="FaPlus"
              className="w-fit bg-blue-950 hover:bg-blue-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 border border-slate-950 dark:border-transparent shadow-sm font-extrabold"
              onClick={handleAddScheduleClick}
            >
              Add Schedule
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Assigned Staff</div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{summary.totalStaff}</div>
        </div>
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Active Shifts</div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{summary.activeShifts}</div>
        </div>
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Pending Updates</div>
          <div className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{summary.pendingUpdates}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon iconName="FaCalendarDays" className="text-slate-900 dark:text-white" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800 dark:text-white/90">
              {isAdmin ? "Weekly roster" : "Official Weekly Schedule"}
            </h2>
          </div>
          <div className="rounded-full border border-slate-250 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-850 dark:text-white">
            {isAdmin ? "Weekly View" : "Final Roster"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] border-collapse bg-white dark:bg-bg-light border-0 shadow-none transition-colors duration-300">
            <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <TableCell isHeader className="text-slate-500 dark:text-slate-400 py-4 w-40">Staff</TableCell>
                {dayLabels.map((day) => (
                  <TableCell key={day} isHeader className="text-slate-500 dark:text-slate-400 py-4">{day}</TableCell>
                ))}
                {isAdmin && (
                  <TableCell isHeader className="text-slate-500 dark:text-slate-400 py-4 w-32">Action</TableCell>
                )}
              </tr>
            </TableHeader>

            <TableBody>
              {schedules.map((member) => (
                <TableRow key={member.staff} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">{member.staff}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{member.role}</div>
                    </div>
                  </TableCell>
                  {dayLabels.map((day) => {
                    const shiftValue = member[day.toLowerCase() as keyof ScheduleItem];
                    const isOff = shiftValue === "Off";
                    return (
                      <TableCell key={day}>
                        <div className={`rounded-full px-3 py-1 text-center text-[11px] font-extrabold border ${isOff ? "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800/70 dark:border-transparent dark:text-slate-400" : "bg-slate-900 border-transparent text-white dark:bg-white dark:text-slate-950"}`}>
                          {shiftValue}
                        </div>
                      </TableCell>
                    );
                  })}
                  {isAdmin && (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="FaPenToSquare"
                          className="text-slate-500 hover:text-emerald-600 border-transparent hover:bg-emerald-500/10"
                          onClick={() => openEditModal(member)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          iconName="FaCalendarPlus"
                          className="bg-blue-800 hover:bg-blue-700 text-white shadow-sm font-bold"
                          onClick={() => openEditModal(member)}
                        >
                          Assign
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MainLayout content={content} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMember ? `Edit ${selectedMember.staff}` : "Edit Schedule"}
        size="lg"
        primaryAction={{
          label: "Save Changes",
          onClick: handleSave,
          iconName: "FaFloppyDisk",
          isLoading: isSaving,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setIsModalOpen(false),
        }}
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">{selectedMember.staff}</div>
              <div className="text-sm text-slate-400">{selectedMember.role}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Select Day"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                options={dayLabels.map((day) => ({
                  value: day.toLowerCase(),
                  label: day,
                }))}
              />

              <Select
                label="Shift"
                value={selectedMember[selectedDay as keyof ScheduleItem]}
                onChange={(e) => updateScheduleValue(selectedDay, e.target.value)}
                options={[
                  { value: "Off", label: "Off" },
                  { value: "08:00 - 16:00", label: "08:00 - 16:00" },
                  { value: "09:00 - 17:00", label: "09:00 - 17:00" },
                  { value: "08:00 - 14:00", label: "08:00 - 14:00" },
                  { value: "10:00 - 18:00", label: "10:00 - 18:00" },
                ]}
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              Changes will update the weekly roster immediately after you save.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default StaffSchedulePage;
