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

interface MayorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyticsData?: AnalyticsData | null;
  onOpenPrint?: (data: {
    period: string;
    memoSubject: string;
    executiveSummary: string;
    recommendations: string;
    totalComplaints: number;
    totalFeeCollected: number;
    violationTableData: TableItem[];
    officerName: string;
  }) => void;
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
  onOpenPrint,
}) => {
  const { user } = useAuth();

  const defaultStaffName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "TMU Staff Officer";

  // Form states
  const [officerName, setOfficerName] = useState(defaultStaffName);
  const [reportingCycle, setReportingCycle] = useState("October 2026 (Monthly Operations Cycle)");
  const [urgencyLevel, setUrgencyLevel] = useState("routine");
  const [memoSubject, setMemoSubject] = useState(
    "TRANSMITTAL OF MUNICIPAL TRAFFIC COMPLAINTS, ENFORCEMENT CITATIONS & PENALTY COLLECTIONS"
  );
  const [executiveSummary, setExecutiveSummary] = useState(
    "Respectfully submitted to the Office of the City Mayor is the consolidated operations briefing from the Traffic Management Unit (TMU). During this reporting period, active field monitoring and digital complaint intake mechanisms recorded 14 resolved/settled cases and 8 pending administrative inquiries, yielding PHP 18,500.00 in municipal penalty fines. Priority cases handled centered on passenger fare overcharging and illegal terminal staging."
  );
  const [recommendations, setRecommendations] = useState(
    "1. Intensify field patrol deployments during peak morning and evening rush along Sector 2 and Sector 4.\n2. Coordinate joint inspections with the Tricycle Regulatory Board for franchise validation.\n3. Expand citizen digital grievance tracking terminals at key barangay hubs."
  );

  // Checkbox annexes
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeRoster, setIncludeRoster] = useState(true);
  const [flagUrgent, setFlagUrgent] = useState(false);

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

  const handleSaveDraftClick = () => {
    setWipNotice("Draft saved to local session. Official transmission remains in WIP mode.");
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
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-[#080B14]/85 backdrop-blur-md transition-opacity"
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Executive Mayoral Report Transmittal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  WIP UI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
          
          {/* WIP Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
            <Icon iconName="FaCircleInfo" size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">Staff Operational Transmittal Module (Work in Progress)</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                This view allows staff to prepare executive summaries and transmittal dossiers for the
                City Mayor. Automatic transmission APIs are in staging. You can preview the layout and
                use <strong className="text-slate-900 dark:text-white">Print to Document</strong> to generate hardcopy or PDF memoranda.
              </p>
            </div>
          </div>

          {wipNotice && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 animate-fadeIn">
              <Icon iconName="FaTriangleExclamation" size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wide text-[10px] block mb-0.5">Notice</span>
                <p className="text-[11px] leading-relaxed">{wipNotice}</p>
              </div>
              <button
                onClick={() => setWipNotice(null)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Official Routing Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                1. Official Routing & Destination
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Recipient Office
                </label>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon iconName="FaBuildingColumns" size={13} className="text-blue-500" />
                  Office of the City Mayor - Executive Desk
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Thru: City Administrator / Chief of Staff
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Transmitting Staff Officer
                </label>
                <InputField
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Officer Name"
                  fullWidth
                  className="text-xs py-1.5"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Key Indicators Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. Executive Indicators Snapshot
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Data Sync</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Grievances</div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {totalComplaints}
                </div>
                <div className="text-[9px] text-slate-400">Recorded cases</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Settled Cases</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  14
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">64% Resolution Rate</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Penalties Collected</div>
                <div className="text-sm font-black text-blue-650 dark:text-blue-400 font-mono mt-1 truncate">
                  {formatCurrency(totalFees)}
                </div>
                <div className="text-[9px] text-slate-400">Total remitted</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Active Patrol Units</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  04
                </div>
                <div className="text-[9px] text-slate-400">On-field deployment</div>
              </div>
            </div>
          </div>

          {/* Section 3: Memorandum Subject & Narrative */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                3. Executive Memo Content
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                  Memorandum Subject
                </label>
                <InputField
                  value={memoSubject}
                  onChange={(e) => setMemoSubject(e.target.value)}
                  placeholder="Subject line"
                  fullWidth
                  className="text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                  className="text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Report Annexes / Checklists */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                4. Transmittal Inclusions & Attachments
              </h3>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeBreakdown}
                  onChange={(e) => setIncludeBreakdown(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Itemized Violation Breakdown & Penalty Ledger
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Municipal Treasury Remittance Summary
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeRoster}
                  onChange={(e) => setIncludeRoster(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Active Field Officer Caseload & Sector Shifts
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={flagUrgent}
                  onChange={(e) => setFlagUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Flag Unsettled Grievances for Executive Inquiry
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenPrintPreview}
              iconName="FaPrint"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 shadow-sm"
            >
              Print to Document
            </Button>
            <Button
              variant="ghost"
              onClick={handleSaveDraftClick}
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 text-xs px-3 py-2 rounded-xl"
            >
              Save Draft
            </Button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-600 dark:text-slate-400 text-xs px-4 py-2 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              onClick={handleTransmitClick}
              iconName="FaPaperPlane"
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2"
            >
              Transmit to Mayor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MayorReportModal;
