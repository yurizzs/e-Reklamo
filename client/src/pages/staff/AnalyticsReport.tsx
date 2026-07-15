import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "../../components/layouts";
import { Icon, LoadingSpinner } from "../../components/ui";
import { Select } from "../../components/ui/forms";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/Table";
import ComplaintService from "../../services/ComplaintService";

interface ChartItem {
  category_name: string;
  complaints_count: number;
}

interface TableItem {
  category_id: number;
  category_name: string;
  fee: number;
  violators_count: number;
  total_amount: number;
}

interface AnalyticsData {
  total_complaints: number;
  total_fee_collected: number;
  violation_chart_data: ChartItem[];
  violation_table_data: TableItem[];
  available_years: string[];
}

const months = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const AnalyticsReport = () => {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = (await ComplaintService.getAnalytics({
          year: selectedYear,
          month: selectedMonth,
        })) as any;

        const payload = response?.data ?? response;
        setData(payload);
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  // Year options list dynamically populated from backend years
  const yearOptions = useMemo(() => {
    const baseOptions = [{ value: "all", label: "All Years" }];
    if (data?.available_years) {
      data.available_years.forEach((yr) => {
        baseOptions.push({ value: String(yr), label: String(yr) });
      });
    }
    return baseOptions;
  }, [data?.available_years]);

  // Find the maximum complaints count to scale the bar chart values relatively
  const maxComplaintsCount = useMemo(() => {
    if (!data?.violation_chart_data || data.violation_chart_data.length === 0) return 1;
    const counts = data.violation_chart_data.map((item) => item.complaints_count);
    return Math.max(...counts, 1);
  }, [data?.violation_chart_data]);

  // Calculate table aggregates
  const tableTotals = useMemo(() => {
    if (!data?.violation_table_data) {
      return { totalViolators: 0, grandTotalAmount: 0 };
    }
    return data.violation_table_data.reduce(
      (acc, curr) => {
        acc.totalViolators += curr.violators_count;
        acc.grandTotalAmount += curr.total_amount;
        return acc;
      },
      { totalViolators: 0, grandTotalAmount: 0 }
    );
  }, [data?.violation_table_data]);

  const content = (
    <div className="space-y-8 pb-12">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-teal-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header and Notch */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-500/60">
            Operational Intelligence
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            Analytics Report
          </h1>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            System Live Feed
          </span>
        </div>
      </div>

      {/* Filtering Section */}
      <div className="relative z-10 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md md:flex-row md:items-end">
        <div className="flex-1">
          <Select
            label="Filter Year"
            iconName="FaCalendarDays"
            options={yearOptions}
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            fullWidth
          />
        </div>

        <div className="flex-1">
          <Select
            label="Filter Month"
            iconName="FaFilter"
            options={months}
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            fullWidth
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" text="Syncing report metrics..." />
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="relative z-10 grid gap-6 md:grid-cols-2">
            {/* Total Fee Collected */}
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all rounded-3xl" />
              <div className="relative bg-white/2 border border-white/5 p-5 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Icon iconName="FaPesoSign" className="text-emerald-500 text-xl" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                    Financials
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-white font-mono tracking-tighter">
                    {formatCurrency(data?.total_fee_collected ?? 0)}
                  </div>
                  <div className="text-[10px] text-emerald-500/60 font-mono uppercase tracking-widest">
                    Total penalty fee collected (Resolved Cases)
                  </div>
                </div>
              </div>
            </div>

            {/* Total Complaints */}
            <div className="relative group">
              <div className="absolute inset-0 bg-teal-500/5 blur-xl group-hover:bg-teal-500/10 transition-all rounded-3xl" />
              <div className="relative bg-white/2 border border-white/5 p-5 rounded-3xl backdrop-blur-md hover:border-teal-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform">
                    <Icon iconName="FaClipboardList" className="text-teal-400 text-xl" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                    Statistics
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-white font-mono tracking-tighter">
                    {(data?.total_complaints ?? 0).toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-teal-400/60 font-mono uppercase tracking-widest">
                    Total recorded complaints count
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Graph Section (Custom SVG/HTML Horizontal Chart) */}
          <div className="relative z-10 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
              <h2 className="text-lg font-bold uppercase tracking-tight text-white/90">
                Complaints by Violation Category
              </h2>
            </div>

            {!data?.violation_chart_data || data.violation_chart_data.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 opacity-30">
                <Icon iconName="FaDatabase" size={40} />
                <p className="font-mono text-xs uppercase tracking-widest">No complaints data available</p>
              </div>
            ) : (
              <div className="space-y-5">
                {data.violation_chart_data.map((item, idx) => {
                  const percentage = (item.complaints_count / maxComplaintsCount) * 100;
                  return (
                    <div key={idx} className="group space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {item.category_name}
                        </span>
                        <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          {item.complaints_count}
                        </span>
                      </div>
                      <div className="relative h-6 w-full bg-white/2 rounded-lg overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600/80 to-teal-500/80 rounded-r-md transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          style={{ width: `${Math.max(percentage, 2.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Violation Details Table Section */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
              <h2 className="text-lg font-bold uppercase tracking-tight text-white/90">
                Violation breakdown & Fees
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Violation Category</TableCell>
                  <TableCell isHeader align="right">Penalty Fee</TableCell>
                  <TableCell isHeader align="center">No. of Violators</TableCell>
                  <TableCell isHeader align="right">Total Amount</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.violation_table_data || data.violation_table_data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Icon iconName="FaDatabase" size={40} />
                        <p className="font-mono text-xs uppercase tracking-widest">
                          No violation records found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.violation_table_data.map((row) => (
                      <TableRow key={row.category_id} className="hover:bg-emerald-500/5">
                        <TableCell className="font-bold text-slate-200">
                          {row.category_name}
                        </TableCell>
                        <TableCell align="right" className="font-mono text-slate-400">
                          {formatCurrency(row.fee)}
                        </TableCell>
                        <TableCell align="center" className="font-mono text-slate-300 font-bold">
                          {row.violators_count}
                        </TableCell>
                        <TableCell align="right" className="font-mono text-emerald-400 font-bold">
                          {formatCurrency(row.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Aggregate Summary Row */}
                    <TableRow className="bg-emerald-500/5 font-bold border-t border-emerald-500/20">
                      <TableCell className="text-white uppercase tracking-wider">
                        Grand Total
                      </TableCell>
                      <TableCell align="right" className="text-slate-400 font-mono">
                        -
                      </TableCell>
                      <TableCell align="center" className="text-white font-mono text-base">
                        {tableTotals.totalViolators}
                      </TableCell>
                      <TableCell align="right" className="text-emerald-400 font-mono text-base shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        {formatCurrency(tableTotals.grandTotalAmount)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );

  return <MainLayout content={content} />;
};

export default AnalyticsReport;
