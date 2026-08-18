import React, { useEffect, useState } from "react";
import { Button, Icon, LoadingSpinner, Modal } from "../../components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/Table";
import DriverService from "../../services/DriverService";

interface DriverViolationItem {
  id: number;
  title: string;
  description: string;
  status: string;
  incident_date_time: string;
  incident_location: string;
  complainant_name: string;
  category: {
    id: number | null;
    name: string;
    penalty_amount: number;
  };
  evidence_count: number;
  created_at: string;
}

interface DriverProfile {
  id: number;
  slug: string;
  avatar: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  plate_number: string;
  vehicle_type: string;
  address: string | null;
  total_violations: number;
  total_penalties: number;
}

interface DriverHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: number | null;
  onSelectComplaint?: (complaintId: number) => void;
}

const statusBadgeStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "settled") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  return "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
};

const formatDate = (value: string) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const DriverHistoryModal: React.FC<DriverHistoryModalProps> = ({
  isOpen,
  onClose,
  driverId,
  onSelectComplaint,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [violations, setViolations] = useState<DriverViolationItem[]>([]);

  useEffect(() => {
    if (!isOpen || !driverId) {
      setDriver(null);
      setViolations([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = (await DriverService.getHistory(driverId)) as any;
        const payload = res?.data ?? res;
        setDriver(payload?.driver ?? null);
        setViolations(payload?.violations ?? []);
      } catch {
        setDriver(null);
        setViolations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, driverId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Driver Violation History"
      size="xl"
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading driver history..." />
        </div>
      ) : !driver ? (
        <div className="py-12 text-center text-slate-500">
          <Icon iconName="FaCircleExclamation" className="mx-auto mb-2 text-2xl text-slate-400" />
          <p className="text-sm font-semibold">Driver record not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Driver Summary Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-5 transition-colors duration-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Icon iconName="FaIdCard" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white transition-colors">{driver.full_name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded border border-blue-200 bg-blue-50 dark:border-white/10 dark:bg-white/5 px-2 py-0.5 font-mono text-blue-650 dark:text-blue-400">
                      Plate: {driver.plate_number}
                    </span>
                    <span className="rounded border border-indigo-200 bg-indigo-50 dark:border-white/10 dark:bg-white/5 px-2 py-0.5 font-mono text-indigo-650 dark:text-indigo-400">
                      Vehicle: {driver.vehicle_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-4 py-2 text-center">
                  <span className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                    Violations
                  </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">
                    {driver.total_violations}
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-4 py-2 text-center">
                  <span className="block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                    Total Fines
                  </span>
                  <span className="text-base font-black text-emerald-605 dark:text-emerald-300 font-mono">
                    {formatCurrency(driver.total_penalties)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Violations List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                Reported Incident Records ({violations.length})
              </h4>
            </div>

            <Table>
              <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Date & Time</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Violation Category</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Report Title & Location</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Complainant</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Status</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4">Penalty</TableCell>
                  <TableCell isHeader align="center" className="text-slate-700 dark:text-slate-300 py-4 text-right pr-8">Action</TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-10 text-slate-500">
                      No violations recorded for this driver.
                    </TableCell>
                  </TableRow>
                ) : (
                  violations.map((item) => (
                    <TableRow key={item.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatDate(item.incident_date_time)}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 px-2.5 py-1 text-xs font-extrabold text-slate-800 dark:text-slate-200 inline-block">
                          {item.category.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">📍 {item.incident_location}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.complainant_name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadgeStyle(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.category.penalty_amount)}
                      </TableCell>
                      <TableCell align="right" className="pr-4">
                        {onSelectComplaint ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            iconName="FaEye"
                            onClick={() => {
                              onSelectComplaint(item.id);
                              onClose();
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs font-bold transition-all animate-none"
                          >
                            View Ticket
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DriverHistoryModal;
