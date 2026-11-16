import React, { useState } from "react";
import { Icon, Button } from "../../components/ui";
import { InputField, TextArea, Select } from "../../components/ui/forms";
import { useAuth } from "../../contexts/AuthContext";

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
  violation_chart_data?: { category_name: string; complaints_count: number }[];
  violation_table_data?: TableItem[];
}

export interface MayorReportFormData {
  period?: string;
  memoSubject?: string;
  executiveSummary?: string;
  recommendations?: string;
  totalComplaints?: number;
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
  onOpenPrint?: (data: MayorReportFormData) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export const MayorReportModal: React.FC<MayorReportModalProps> = ({
  isOpen,
  onClose,
  analyticsData,
  savedData,
  onOpenPrint,
}) => {
  const { user } = useAuth();

  const defaultStaffName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "TMU Staff Officer";

  // Form states
  const [officerName, setOfficerName] = useState(savedData?.officerName || defaultStaffName);
  const [reportingCycle, setReportingCycle] = useState(
    savedData?.period || "October 2026 (Monthly Operations Cycle)"
  );
  const [urgencyLevel, setUrgencyLevel] = useState(savedData?.urgencyLevel || "routine");
  const [memoSubject, setMemoSubject] = useState(
    savedData?.memoSubject ||
    "TRANSMITTAL OF MUNICIPAL TRAFFIC COMPLAINTS, ENFORCEMENT CITATIONS & PENALTY COLLECTIONS"
  );
  const [executiveSummary, setExecutiveSummary] = useState(
    savedData?.executiveSummary ||
    "Respectfully submitted to the Office of the City Mayor is the consolidated operations briefing from the Traffic Management Unit (TMU). During this reporting period, active field monitoring and digital complaint intake mechanisms recorded 14 resolved/settled cases and 8 pending administrative inquiries, yielding PHP 18,500.00 in municipal penalty fines. Priority cases handled centered on passenger fare overcharging and illegal terminal staging."
  );
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

  // WIP alert status
  const [wipNotice, setWipNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalComplaints = analyticsData?.total_complaints ?? 22;
  const totalFees = analyticsData?.total_fee_collected ?? 18500;
  const tableData = analyticsData?.violation_table_data ?? [];

  const handleTransmitClick = () => {
    setWipNotice(
      "Direct Mayoral Telematics transmission is currently in WIP mode. The secure API dispatch channel to the Mayor's Executive Portal is scheduled for integration in the next release. Please use 'Print to Document' to generate official hardcopy or PDF executive records."
    );
  };

  const handleOpenPrintPreview = () => {
    if (onOpenPrint) {
      onOpenPrint({
        period: reportingCycle,
        memoSubject,
        executiveSummary,
        recommendations,
        totalComplaints,
        totalFeeCollected: totalFees,
        violationTableData: tableData,
        officerName,
        urgencyLevel,
        includeBreakdown,
        includeFinancials,
        includeRoster,
        flagUrgent,
      });
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
                  Executive Mayoral Report Transmittal
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  WIP UI
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
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-xl transition-colors"
          />
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          {wipNotice && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-300 animate-fadeIn">
              <Icon iconName="FaTriangleExclamation" size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wide text-xs block mb-0.5">Notice</span>
                <p className="text-xs leading-relaxed">{wipNotice}</p>
              </div>
              <button
                onClick={() => setWipNotice(null)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

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
                  options={[
                    { value: "October 2026 (Monthly Operations Cycle)", label: "October 2026 (Monthly Cycle)" },
                    { value: "Q3 2026 (Quarterly Consolidated)", label: "Q3 2026 (Quarterly Consolidated)" },
                    { value: "Full Year 2026 (Annual Review)", label: "Full Year 2026 (Annual Review)" },
                    { value: "Custom Special Operations Window", label: "Custom Special Operations Window" },
                  ]}
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
              <span className="text-xs text-slate-400 font-mono">Live Data Sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Grievances
                    </span>
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                    {totalComplaints}
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">
                    14
                  </div>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                  64% Resolution Rate
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Penalties Collected
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1.5 truncate">
                    {formatCurrency(totalFees)}
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
            iconName="FaPrint"
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            Print to Document
          </Button>

          <Button
            onClick={handleTransmitClick}
            iconName="FaPaperPlane"
            className="bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2"
          >
            Transmit to Mayor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MayorReportModal;
