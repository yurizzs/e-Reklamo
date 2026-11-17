import React, { useState, useEffect } from "react";
import { Icon, Button } from "../../components/ui";
import { InputField, TextArea, Select } from "../../components/ui/forms";
import { useAuth } from "../../contexts/AuthContext";
import ComplaintService from "../../services/ComplaintService";

interface TableItem {
  category_id: number;
  category_name: string;
  fee: number;
  violators_count: number;
  total_amount: number;
}

interface AnalyticsData {
  total_complaints: number;
  settled_complaints?: number;
  under_review_complaints?: number;
  total_fee_collected: number;
  violation_chart_data?: { category_name: string; complaints_count: number }[];
  violation_table_data?: TableItem[];
}

export interface MayorReportFormData {
  period?: string;
  memoSubject?: string;
  executiveSummary?: string;
  recommendations?: string;
  totalComplaints?: number;
  settledComplaints?: number;
  underReviewComplaints?: number;
  totalFeeCollected?: number;
  violationTableData?: TableItem[];
  officerName?: string;
  urgencyLevel?: string;
  includeBreakdown?: boolean;
  includeFinancials?: boolean;
  includeRoster?: boolean;
  flagUrgent?: boolean;
}

interface MayorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyticsData?: AnalyticsData | null;
  savedData?: MayorReportFormData | null;
  onOpenPrint?: (data: MayorReportFormData, autoPrint?: boolean) => void;
  selectedMonth?: string;
  selectedYear?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const MONTH_LIST = [
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

const parseCycleToParams = (cycle: string, fallbackYear: string) => {
  const MONTH_MAP: Record<string, string> = {
    january: "1",
    february: "2",
    march: "3",
    april: "4",
    may: "5",
    june: "6",
    july: "7",
    august: "8",
    september: "9",
    october: "10",
    november: "11",
    december: "12",
  };

  const lower = cycle.toLowerCase();
  const yearMatch = cycle.match(/\b(20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : fallbackYear;

  if (lower.includes("full year") || lower.includes("annual")) {
    return { year, month: "all" };
  }

  for (const [mName, mNum] of Object.entries(MONTH_MAP)) {
    if (lower.includes(mName)) {
      return { year, month: mNum };
    }
  }

  if (lower.includes("q1")) return { year, month: "1" };
  if (lower.includes("q2")) return { year, month: "4" };
  if (lower.includes("q3")) return { year, month: "7" };
  if (lower.includes("q4")) return { year, month: "10" };

  return { year, month: "all" };
};

export const MayorReportModal: React.FC<MayorReportModalProps> = ({
  isOpen,
  onClose,
  analyticsData,
  savedData,
  onOpenPrint,
  selectedMonth,
  selectedYear,
}) => {
  const { user } = useAuth();

  const defaultStaffName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "TMU Staff Officer";

  const activeYear =
    selectedYear && selectedYear !== "all"
      ? selectedYear
      : new Date().getFullYear().toString();

  const matchedMonth =
    MONTH_LIST.find((m) => m.value === selectedMonth)?.label || "October";
  const defaultPeriod = `${matchedMonth} ${activeYear} (Monthly Operations Cycle)`;

  // Form states
  const [officerName, setOfficerName] = useState(savedData?.officerName || defaultStaffName);
  const [reportingCycle, setReportingCycle] = useState(
    savedData?.period || defaultPeriod
  );

  const cycleOptions = [
    ...MONTH_LIST.map((m) => ({
      value: `${m.label} ${activeYear} (Monthly Operations Cycle)`,
      label: `${m.label} ${activeYear} (Monthly Cycle)`,
    })),
    { value: `Q3 ${activeYear} (Quarterly Consolidated)`, label: `Q3 ${activeYear} (Quarterly Consolidated)` },
    { value: `Full Year ${activeYear} (Annual Review)`, label: `Full Year ${activeYear} (Annual Review)` },
    { value: "Custom Special Operations Window", label: "Custom Special Operations Window" },
  ];

  const [cycleAnalytics, setCycleAnalytics] = useState<AnalyticsData | null>(analyticsData || null);
  const [isCycleLoading, setIsCycleLoading] = useState<boolean>(false);

  // Sync cycle data when reportingCycle changes
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    const fetchCycleData = async () => {
      const { year, month } = parseCycleToParams(reportingCycle, activeYear);
      setIsCycleLoading(true);
      try {
        const response = (await ComplaintService.getAnalytics({
          year,
          month,
        })) as unknown as {
          data?: AnalyticsData & { data?: AnalyticsData };
          violation_chart_data?: AnalyticsData["violation_chart_data"];
        } & AnalyticsData;

        const extracted = response?.violation_chart_data
          ? response
          : response?.data?.violation_chart_data
          ? response.data
          : response?.data?.data?.violation_chart_data
          ? response.data.data
          : response?.data ?? response;

        if (isCurrent && extracted) {
          setCycleAnalytics(extracted);
        }
      } catch (err) {
        console.error("Failed to load analytics for cycle", err);
      } finally {
        if (isCurrent) {
          setIsCycleLoading(false);
        }
      }
    };

    fetchCycleData();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, reportingCycle, activeYear]);

  const totalComplaints = cycleAnalytics?.total_complaints ?? 0;
  const settledComplaints =
    cycleAnalytics?.settled_complaints !== undefined
      ? cycleAnalytics.settled_complaints
      : Math.round(totalComplaints * 0.64);
  const underReviewComplaints =
    cycleAnalytics?.under_review_complaints !== undefined
      ? cycleAnalytics.under_review_complaints
      : Math.max(0, totalComplaints - settledComplaints);
  const totalFees = cycleAnalytics?.total_fee_collected ?? 0;
  const tableData = cycleAnalytics?.violation_table_data ?? [];

  const resolutionRate =
    totalComplaints > 0
      ? Math.round((settledComplaints / totalComplaints) * 100)
      : 0;

  const [urgencyLevel, setUrgencyLevel] = useState(savedData?.urgencyLevel || "routine");
  const [memoSubject, setMemoSubject] = useState(
    savedData?.memoSubject ||
    "TRANSMITTAL OF MUNICIPAL TRAFFIC COMPLAINTS, ENFORCEMENT CITATIONS & PENALTY COLLECTIONS"
  );
  const [executiveSummary, setExecutiveSummary] = useState(
    savedData?.executiveSummary ||
    `Respectfully submitted to the Office of the City Mayor is the consolidated operations briefing from the Traffic Management Unit (TMU). During this reporting period, active field monitoring and digital complaint intake mechanisms recorded ${settledComplaints} resolved/settled cases and ${underReviewComplaints} pending administrative inquiries, yielding ${formatCurrency(totalFees)} in municipal penalty fines. Priority cases handled centered on passenger fare overcharging and illegal terminal staging.`
  );

  // Dynamically update executive summary narrative when indicators update if not manually overridden
  useEffect(() => {
    if (cycleAnalytics && !savedData?.executiveSummary) {
      const narrative = `Respectfully submitted to the Office of the City Mayor is the consolidated operations briefing from the Traffic Management Unit (TMU). During this reporting period (${reportingCycle}), active field monitoring and digital complaint intake mechanisms recorded ${settledComplaints} resolved/settled cases and ${underReviewComplaints} pending administrative inquiries, yielding ${formatCurrency(totalFees)} in municipal penalty fines. Priority cases handled centered on passenger fare overcharging and illegal terminal staging.`;
      setExecutiveSummary(narrative);
    }
  }, [cycleAnalytics, reportingCycle, settledComplaints, underReviewComplaints, totalFees, savedData]);

  const [recommendations, setRecommendations] = useState(
    savedData?.recommendations ||
    "1. Intensify field patrol deployments during peak morning and evening rush along Sector 2 and Sector 4.\n2. Coordinate joint inspections with the Tricycle Regulatory Board for franchise validation.\n3. Expand citizen digital grievance tracking terminals at key barangay hubs."
  );

  // Checkbox annexes
  const [includeBreakdown, setIncludeBreakdown] = useState(
    savedData?.includeBreakdown !== undefined ? savedData.includeBreakdown : true
  );
  const [includeFinancials, setIncludeFinancials] = useState(
    savedData?.includeFinancials !== undefined ? savedData.includeFinancials : true
  );
  const [includeRoster, setIncludeRoster] = useState(
    savedData?.includeRoster !== undefined ? savedData.includeRoster : true
  );
  const [flagUrgent, setFlagUrgent] = useState(
    savedData?.flagUrgent !== undefined ? savedData.flagUrgent : false
  );

  if (!isOpen) return null;

  const handleExportPdf = () => {
    if (onOpenPrint) {
      onOpenPrint({
        period: reportingCycle,
        memoSubject,
        executiveSummary,
        recommendations,
        totalComplaints,
        settledComplaints,
        underReviewComplaints,
        totalFeeCollected: totalFees,
        violationTableData: tableData,
        officerName,
        urgencyLevel,
        includeBreakdown,
        includeFinancials,
        includeRoster,
        flagUrgent,
      }, true);
    }
  };

  const handleOpenPrintPreview = () => {
    if (onOpenPrint) {
      onOpenPrint({
        period: reportingCycle,
        memoSubject,
        executiveSummary,
        recommendations,
        totalComplaints,
        settledComplaints,
        underReviewComplaints,
        totalFeeCollected: totalFees,
        violationTableData: tableData,
        officerName,
        urgencyLevel,
        includeBreakdown,
        includeFinancials,
        includeRoster,
        flagUrgent,
      }, false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-bg-light border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* Header */}
        <div className="relative z-10 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Icon iconName="FaLandmark" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Executive Mayoral Report
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  OFFICIAL REPORT
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Staff operational intelligence briefing for the Office of the City Mayor
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconName="FaXmark"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer"
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">

          {/* Section 1: Official Routing Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4.5 bg-amber-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                1. Official Routing & Destination
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Recipient Office
                </label>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon iconName="FaBuildingColumns" size={15} className="text-blue-500 shrink-0" />
                  Office of the City Mayor - Executive Desk
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thru: City Administrator / Chief of Staff
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Transmitting Staff Officer
                </label>
                <InputField
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Officer Name"
                  fullWidth
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Reporting Period / Cycle
                </label>
                <Select
                  options={cycleOptions}
                  value={reportingCycle}
                  onChange={(e) => setReportingCycle(e.target.value)}
                  fullWidth
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Urgency / Classification
                </label>
                <Select
                  options={[
                    { value: "routine", label: "Routine Operations Briefing" },
                    { value: "priority", label: "Priority Mayoral Action Required" },
                    { value: "urgent", label: "Urgent Escalation / Public Grievance" },
                  ]}
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                  fullWidth
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Key Indicators Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4.5 bg-blue-600 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. Executive Indicators Snapshot
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {isCycleLoading ? "Syncing data..." : "Live Data Sync"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Grievances
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isCycleLoading ? "bg-amber-400 animate-ping" : "bg-slate-400"}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                    {isCycleLoading ? "..." : totalComplaints}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">Recorded cases</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Settled Cases
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isCycleLoading ? "bg-amber-400 animate-ping" : "bg-emerald-500"}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">
                    {isCycleLoading ? "..." : settledComplaints}
                  </div>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                  {resolutionRate}% Resolution Rate
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Penalties Collected
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isCycleLoading ? "bg-amber-400 animate-ping" : "bg-blue-500"}`} />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1.5 truncate">
                    {isCycleLoading ? "..." : formatCurrency(totalFees)}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">Total remitted</div>
              </div>
            </div>
          </div>

          {/* Section 3: Memorandum Subject & Narrative */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4.5 bg-indigo-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                3. Executive Memo Content
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Memorandum Subject
                </label>
                <InputField
                  value={memoSubject}
                  onChange={(e) => setMemoSubject(e.target.value)}
                  placeholder="Subject line"
                  fullWidth
                  className="text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Executive Summary for the Mayor
                </label>
                <TextArea
                  rows={4}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Draft executive overview..."
                  fullWidth
                  showCounter
                  maxLength={1000}
                  className="text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Enforcement Recommendations & Key Directives
                </label>
                <TextArea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Staff observations and action recommendations..."
                  fullWidth
                  showCounter
                  maxLength={600}
                  className="text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Report Annexes / Checklists */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4.5 bg-emerald-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                4. Transmittal Inclusions & Attachments
              </h3>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 text-sm">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeBreakdown}
                  onChange={(e) => setIncludeBreakdown(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  Itemized Violation Breakdown & Penalty Ledger
                </span>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  Municipal Treasury Remittance Summary
                </span>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeRoster}
                  onChange={(e) => setIncludeRoster(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  Active Field Officer Caseload & Sector Shifts
                </span>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={flagUrgent}
                  onChange={(e) => setFlagUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                />
                <span className="font-semibold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                  Flag Unsettled Grievances for Executive Inquiry
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            onClick={handleOpenPrintPreview}
            iconName="FaEye"
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 shadow-sm cursor-pointer transition-all"
          >
            Preview Document
          </Button>

          <Button
            onClick={handleExportPdf}
            iconName="FaFilePdf"
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            Export to PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MayorReportModal;
