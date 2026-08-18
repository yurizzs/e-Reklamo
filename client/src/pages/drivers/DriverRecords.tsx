import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "../../components/layouts";
import { Icon, LoadingSpinner, Button } from "../../components/ui";
import { InputField } from "../../components/ui/forms";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TablePagination,
  TableRow,
} from "../../components/ui/table/Table";
import { useDebounce } from "../../hooks";
import DriverService from "../../services/DriverService";
import DriverHistoryModal from "./DriverHistoryModal";
import ComplaintDetailsModal from "../staff/ComplaintDetailsModal";

interface DriverRecord {
  id: number;
  slug: string;
  avatar: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  plate_number: string;
  vehicle_type: string;
  address: string | null;
  total_violations: number;
  status_breakdown: {
    unsettled: number;
    settled: number;
  };
  total_penalties: number;
  last_reported_at: string | null;
}

interface DriverStats {
  total_drivers: number;
  total_violations: number;
  repeat_offenders: number;
  total_penalties_collected: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const formatDate = (value: string | null) => {
  if (!value) return "No reports";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const DriverRecords = () => {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    total_drivers: 0,
    total_violations: 0,
    repeat_offenders: 0,
    total_penalties_collected: 0,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchDriverRecords = async () => {
      setIsLoading(true);

      try {
        const response = (await DriverService.getRecords({
          search: debouncedSearch || undefined,
          page,
          limit,
        })) as any;

        const payload = response?.data ?? response;
        setDrivers(payload?.drivers ?? []);
        setStats(
          payload?.stats ?? {
            total_drivers: 0,
            total_violations: 0,
            repeat_offenders: 0,
            total_penalties_collected: 0,
          },
        );
        setMeta(
          payload?.meta ?? {
            current_page: page,
            last_page: 1,
            per_page: limit,
            total: 0,
          },
        );
      } catch {
        setDrivers([]);
        setStats({
          total_drivers: 0,
          total_violations: 0,
          repeat_offenders: 0,
          total_penalties_collected: 0,
        });
        setMeta({
          current_page: page,
          last_page: 1,
          per_page: limit,
          total: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverRecords();
  }, [debouncedSearch, page, limit]);

  const cards = useMemo(
    () => [
      {
        label: "Total Registered Drivers",
        value: stats.total_drivers,
        isCurrency: false,
        icon: "FaIdCard" as const,
        tone: "border-sky-500/20 bg-sky-500/10 text-sky-400",
      },
      {
        label: "Total Violations Reported",
        value: stats.total_violations,
        isCurrency: false,
        icon: "FaTriangleExclamation" as const,
        tone: "border-rose-500/20 bg-rose-500/10 text-rose-400",
      },
      {
        label: "Repeat Offender Drivers",
        value: stats.repeat_offenders,
        isCurrency: false,
        icon: "FaUserSlash" as const,
        tone: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      },
      {
        label: "Total Penalties Collected",
        value: stats.total_penalties_collected,
        isCurrency: true,
        icon: "FaCircleDollarToSlot" as const,
        tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      },
    ],
    [stats],
  );

  const content = (
    <div className="relative space-y-10 pb-12 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-indigo-650/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Driver Records
          </h1>
          <p className="text-sm text-blue-600 dark:text-blue-450 font-mono uppercase tracking-[0.3em]">
            TMU Operational Database
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl transition-colors duration-300">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Database Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-xl border p-3 ${card.tone}`}>
                <Icon iconName={card.icon} className="text-lg" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">
                {card.label.split(" ").slice(-1)[0]}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {card.isCurrency
                  ? formatCurrency(card.value)
                  : card.value.toString().padStart(2, "0")}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest truncate">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative z-10 bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <InputField
          label="Search Drivers"
          iconName="FaMagnifyingGlass"
          placeholder="Search by driver name or vehicle plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
      </div>

      {/* Drivers Table */}
      <div className="relative z-10 space-y-4">
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
          <div className="overflow-x-auto">
            <Table className="border-collapse bg-white dark:bg-bg-light border-0 shadow-none transition-colors duration-300">
              <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-1/4">Driver Name</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-28">Plate Number</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-32">Vehicle Type</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-36">Violations Count</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-48">Status Breakdown</TableCell>
                  <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-32">Last Reported</TableCell>
                  <TableCell isHeader align="center" className="text-slate-700 dark:text-slate-300 py-4 pr-8 text-right">Action</TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24">
                      <div className="flex items-center justify-center w-full">
                        <LoadingSpinner size="lg" text="Syncing driver database..." />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : drivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-center gap-3 text-slate-400">
                        <Icon iconName="FaDatabase" size={32} />
                        <p className="text-xs font-black uppercase tracking-wider">No driver records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver) => (
                    <TableRow key={driver.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-extrabold text-sm text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-black/20 text-slate-700 dark:text-primary font-bold text-xs border border-slate-200 dark:border-white/10 shrink-0">
                            {driver.first_name[0]}
                            {driver.last_name[0]}
                          </div>
                          <div>
                            <span>{driver.full_name}</span>
                            {driver.address && (
                              <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{driver.address}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span className="px-2 py-0.5 border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 rounded-md inline-block">
                          {driver.plate_number}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {driver.vehicle_type}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 h-[22px] text-[10px] font-black uppercase tracking-wider ${driver.total_violations === 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : driver.total_violations === 1
                              ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                              : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                            }`}
                        >
                          {driver.total_violations >= 2 && (
                            <Icon iconName="FaTriangleExclamation" size={10} className="shrink-0" />
                          )}
                          {driver.total_violations} {driver.total_violations === 1 ? "Violation" : "Violations"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
                          <span className="rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-rose-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400" title="Unsettled">
                            Unsettled: {driver.status_breakdown.unsettled}
                          </span>
                          <span className="rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-slate-300" title="Settled">
                            Settled: {driver.status_breakdown.settled}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(driver.last_reported_at)}
                      </TableCell>
                      <TableCell align="right" className="pr-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          iconName="FaClockRotateLeft"
                          onClick={() => setSelectedDriverId(driver.id)}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs font-bold transition-all"
                        >
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && drivers.length > 0 && (
            <div className="bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 p-6">
              <TablePagination
                currentPage={meta.current_page}
                totalPages={Math.max(meta.last_page, 1)}
                onPageChange={(nextPage) => setPage(Math.max(nextPage, 1))}
                onPageSizeChange={(nextLimit) => {
                  setLimit(nextLimit);
                  setPage(1);
                }}
                totalResults={meta.total}
                pageSize={meta.per_page}
                resourceLabel="Drivers"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MainLayout content={content} />
      <DriverHistoryModal
        isOpen={selectedDriverId !== null}
        onClose={() => setSelectedDriverId(null)}
        driverId={selectedDriverId}
        onSelectComplaint={(complaintId) => setSelectedComplaintId(complaintId)}
      />
      <ComplaintDetailsModal
        isOpen={selectedComplaintId !== null}
        onClose={() => setSelectedComplaintId(null)}
        complaintId={selectedComplaintId}
      />
    </>
  );
};

export default DriverRecords;
