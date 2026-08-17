import { useEffect, useMemo, useState, useCallback } from "react";
import { MainLayout } from "../../components/layouts";
import { Button, Icon, LoadingSpinner } from "../../components/ui";
import { InputField, Select } from "../../components/ui/forms";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TablePagination,
  TableRow,
} from "../../components/ui/table/Table";
import { useDebounce } from "../../hooks";
import ComplaintService from "../../services/ComplaintService";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import CreateComplaintModal from "./CreateComplaintModal";

type ComplaintStatus = "all" | "unsettled" | "settled";

interface ComplaintRecord {
  id: number;
  user?: {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
  };
  complainant?: {
    first_name: string | null;
    last_name: string | null;
    name: string;
  };
  driver?: {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
  };
  category?: {
    id: number | null;
    category_name: string | null;
  };
  title: string;
  status: string;
  incident_date_time: string;
}

interface ComplaintStats {
  all?: number;
  unsettled: number;
  settled: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "unsettled", label: "Unsettled" },
  { value: "settled", label: "Settled" },
];

const statusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();

  if (normalized === "settled") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-400";
};

const formatIncidentTime = (value: string) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ComplaintsList = () => {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    all: 0,
    unsettled: 0,
    settled: 0,
  });

  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = (await ComplaintService.getAll({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: pageSize,
      })) as any;

      const payload = response?.data ?? response;

      setComplaints(payload?.complaints ?? []);
      setStats(payload?.stats ?? { all: 0, unsettled: 0, settled: 0 });

      if (payload?.meta) {
        setPagination(payload.meta);
      }
    } catch {
      setComplaints([]);
      setStats({ all: 0, unsettled: 0, settled: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, pageSize, refreshKey]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const statCards = useMemo(
    () => [
      {
        label: "Total Complaints",
        value: stats.all ?? pagination.total,
        icon: "FaList" as const,
        tone: "border-sky-500/20 bg-sky-500/10 text-sky-400",
      },
      {
        label: "Unsettled",
        value: stats.unsettled,
        icon: "FaClock" as const,
        tone: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      },
      {
        label: "Settled",
        value: stats.settled,
        icon: "FaCircleCheck" as const,
        tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      },
    ],
    [stats, pagination.total],
  );

  const content = (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-500/60">
            Staff Operations
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            Complaints List
          </h1>
        </div>

        <Button
          iconName="FaPlus"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start bg-emerald-600 hover:bg-emerald-500 md:self-auto"
        >
          Add Complaint
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-xl border p-3 ${card.tone}`}>
                <Icon iconName={card.icon} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                {card.label}
              </span>
            </div>
            <div className="mt-5 text-3xl font-black text-white">
              {card.value.toString().padStart(2, "0")}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {card.label} complaints
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:flex-row lg:items-end">
        <InputField
          label="Search"
          iconName="FaMagnifyingGlass"
          placeholder="Search complainant, driver, category, title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <Select
          label="Filter Status"
          iconName="FaFilter"
          options={statusOptions}
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as ComplaintStatus);
            setPage(1);
          }}
          fullWidth
        />
      </div>

      <div className="space-y-4">
        <Table>
          <TableHeader>
            <tr>
              <TableCell isHeader>Complainant</TableCell>
              <TableCell isHeader>Driver</TableCell>
              <TableCell isHeader>Category</TableCell>
              <TableCell isHeader>Title</TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader>Incident Time</TableCell>
              <TableCell isHeader>Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-16">
                  <LoadingSpinner text="Loading complaints..." />
                </TableCell>
              </TableRow>
            ) : complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Icon iconName="FaFolderOpen" size={32} />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">
                      No complaints found
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id} className="border-b border-white/5 last:border-0">
                  <TableCell className="font-semibold text-slate-200">
                    {complaint.complainant?.name || complaint.user?.name || "Unknown complainant"}
                  </TableCell>
                  <TableCell>{complaint.driver?.name || "Unknown driver"}</TableCell>
                  <TableCell>{complaint.category?.category_name || "Uncategorized"}</TableCell>
                  <TableCell className="max-w-xs truncate font-semibold text-white">
                    {complaint.title}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(
                        complaint.status,
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-400">
                    {formatIncidentTime(complaint.incident_date_time)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconName="FaEye"
                      onClick={() => setSelectedComplaintId(complaint.id)}
                      className="text-emerald-400 hover:text-emerald-300 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={pagination.current_page}
          totalPages={Math.max(pagination.last_page, 1)}
          onPageChange={(nextPage) => setPage(Math.max(nextPage, 1))}
          onPageSizeChange={(nextLimit) => {
            setPageSize(nextLimit);
            setPage(1);
          }}
          totalResults={pagination.total}
          pageSize={pagination.per_page}
          resourceLabel="Complaints"
        />
      </div>
    </div>
  );

  return (
    <>
      <MainLayout content={content} />
      <CreateComplaintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setRefreshKey((key) => key + 1)}
      />
      <ComplaintDetailsModal
        isOpen={selectedComplaintId !== null}
        onClose={() => setSelectedComplaintId(null)}
        complaintId={selectedComplaintId}
        onStatusUpdated={() => setRefreshKey((key) => key + 1)}
      />
    </>
  );
};

export default ComplaintsList;
