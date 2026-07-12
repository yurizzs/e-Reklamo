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
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesResponse, schedulesResponse] = await Promise.all([
          OperatorScheduleService.getEmployees() as any,
          OperatorScheduleService.getAll({
            start_date: "2026-07-01",
            end_date: "2026-07-07",
          }) as any,
        ]);

        const employeeList = employeesResponse?.data ?? [];
        const scheduleRecords = schedulesResponse?.data ?? [];

        const scheduleMap = new Map<string, Record<string, string>>();
        scheduleRecords.forEach((record: any) => {
          const key = record.employee_id;
          const day = new Date(record.schedule_date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          const current = scheduleMap.get(key) ?? {};
          current[day] = `${record.shift_start} - ${record.shift_end}`;
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
    } catch {
      notify.error("Failed to save schedule to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-8 pb-8">
      <div className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-slate-950/40 p-6 shadow-2xl shadow-emerald-500/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/70">
              Admin Operations
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
              Staff Work Schedule
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              Manage recurring staff shifts in a weekly roster view so allocation stays clear and easy to update.
            </p>
          </div>
          <Button variant="primary" iconName="FaPlus" className="w-fit">
            Add Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Assigned Staff</div>
          <div className="mt-4 text-3xl font-black text-white">{summary.totalStaff}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Active Shifts</div>
          <div className="mt-4 text-3xl font-black text-white">{summary.activeShifts}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Pending Updates</div>
          <div className="mt-4 text-3xl font-black text-white">{summary.pendingUpdates}</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon iconName="FaCalendarDays" className="text-emerald-400" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-white/90">Weekly roster</h2>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            Weekly View
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] border-collapse">
            <TableHeader className="bg-black/40 border-b border-white/5">
              <tr>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-4">Staff</TableCell>
                {dayLabels.map((day) => (
                  <TableCell key={day} isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-4">{day}</TableCell>
                ))}
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-4">Action</TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {schedules.map((member) => (
                <TableRow key={member.staff} className="border-b border-white/5 last:border-0 hover:bg-emerald-500/5">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-white">{member.staff}</div>
                      <div className="text-xs text-slate-400">{member.role}</div>
                    </div>
                  </TableCell>
                  {dayLabels.map((day) => {
                    const shiftValue = member[day.toLowerCase() as keyof ScheduleItem];
                    const isOff = shiftValue === "Off";
                    return (
                      <TableCell key={day}>
                        <div className={`rounded-full px-3 py-1 text-center text-[11px] font-semibold ${isOff ? "bg-slate-800/70 text-slate-400" : "bg-emerald-500/15 text-emerald-300"}`}>
                          {shiftValue}
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="FaPenToSquare"
                        onClick={() => openEditModal(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        iconName="FaCalendarPlus"
                        onClick={() => openEditModal(member)}
                      >
                        Assign
                      </Button>
                    </div>
                  </TableCell>
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
