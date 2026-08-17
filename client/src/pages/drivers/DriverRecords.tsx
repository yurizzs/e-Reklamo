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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-500/60">
          Staff Operations
        </p>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
          Driver Violation Records
        </h1>
        <p className="text-xs text-slate-400">
          Monitor driver infraction frequencies, repeat offenders, and violation histories.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-xl border p-3 ${card.tone}`}>
                <Icon iconName={card.icon} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </span>
            </div>
            <div className="mt-5 text-2xl font-black text-white">
              {card.isCurrency
                ? formatCurrency(card.value)
                : card.value.toString().padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
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
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Driver Name</TableCell>
              <TableCell isHeader>Plate Number</TableCell>
              <TableCell isHeader>Vehicle Type</TableCell>
              <TableCell isHeader>Violations Count</TableCell>
              <TableCell isHeader>Status Breakdown</TableCell>
              <TableCell isHeader>Last Reported</TableCell>
              <TableCell isHeader>Action</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-16">
                  <LoadingSpinner text="Loading driver records..." />
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Icon iconName="FaFolderOpen" size={32} />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">
                      No driver records found
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id} className="border-b border-white/5 last:border-0">
                  <TableCell className="font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 font-bold text-xs border border-white/10">
                        {driver.first_name[0]}
                        {driver.last_name[0]}
                      </div>
                      <div>
                        <span>{driver.full_name}</span>
                        {driver.address && (
                          <p className="text-[11px] font-normal text-slate-400">{driver.address}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-400">
                    {driver.plate_number}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {driver.vehicle_type}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
                        driver.total_violations === 0
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : driver.total_violations === 1
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {driver.total_violations >= 2 && (
                        <Icon iconName="FaTriangleExclamation" className="text-[10px]" />
                      )}
                      {driver.total_violations} {driver.total_violations === 1 ? "Violation" : "Violations"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400" title="Unsettled">
                        Unsettled: {driver.status_breakdown.unsettled}
                      </span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400" title="Settled">
                        Settled: {driver.status_breakdown.settled}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {formatDate(driver.last_reported_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconName="FaClockRotateLeft"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className="border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
