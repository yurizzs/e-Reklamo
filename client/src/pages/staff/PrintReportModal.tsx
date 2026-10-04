import React, { useRef } from "react";
import { Icon, Button } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";

interface TableItem {
  category_id: number;
  category_name: string;
  fee: number;
  violators_count: number;
  total_amount: number;
}

interface PrintReportData {
  period?: string;
  memoSubject?: string;
  executiveSummary?: string;
  recommendations?: string;
  totalComplaints?: number;
  totalFeeCollected?: number;
  violationTableData?: TableItem[];
  officerName?: string;
}

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: PrintReportData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  const { user } = useAuth();
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const staffName =
    reportData?.officerName ||
    (user?.first_name ? `${user.first_name} ${user.last_name}` : "TMU Staff Officer");

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const periodStr = reportData?.period || "October 2026 (Monthly Operations Cycle)";
  const subjectStr =
    reportData?.memoSubject ||
    "EXECUTIVE CONSOLIDATED REPORT ON TRAFFIC ENFORCEMENT, CITIZEN GRIEVANCES, AND PENALTY REVENUES";

  const summaryStr =
    reportData?.executiveSummary ||
    "Respectfully submitted to the Office of the City Mayor is the consolidated operations briefing from the Traffic Management Unit (TMU). During this reporting period, active field monitoring and digital complaint intake mechanisms recorded 14 resolved/settled cases and 8 pending administrative inquiries, yielding PHP 18,500.00 in municipal penalty fines. Priority cases handled centered on passenger fare overcharging and illegal terminal staging.";

  const recommendationsStr =
    reportData?.recommendations ||
    "1. Intensify field patrol deployments during peak morning and evening rush along Sector 2 and Sector 4.\n2. Coordinate joint inspections with the Tricycle Regulatory Board for franchise validation.\n3. Expand citizen digital grievance tracking terminals at key barangay hubs.";

  const defaultTableData: TableItem[] = [
    {
      category_id: 1,
      category_name: "Overcharging of Fare",
      fee: 500,
      violators_count: 14,
      total_amount: 7000,
    },
    {
      category_id: 2,
      category_name: "Refusal to Convey Passengers",
      fee: 1000,
      violators_count: 5,
      total_amount: 5000,
    },
    {
      category_id: 3,
      category_name: "Illegal Parking / Obstruction",
      fee: 750,
      violators_count: 6,
      total_amount: 4500,
    },
    {
      category_id: 4,
      category_name: "Reckless Driving & Discourtesy",
      fee: 1000,
      violators_count: 2,
      total_amount: 2000,
    },
  ];

  const tableRows =
    reportData?.violationTableData && reportData.violationTableData.length > 0
      ? reportData.violationTableData
      : defaultTableData;

  const totalViolators = tableRows.reduce((sum, r) => sum + r.violators_count, 0);
  const grandTotalFee = tableRows.reduce((sum, r) => sum + r.total_amount, 0);
  const totalComplaints = reportData?.totalComplaints ?? totalViolators;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-[#080B14]/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-700/60 shadow-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Icon iconName="FaPrint" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Official Document Print Preview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  WIP UI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Memorandum formatted for City Mayor Executive Briefing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              iconName="FaPrint"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              Print Document
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="FaXmark"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl"
            />
          </div>
        </div>

        {/* Scrollable Printable Document View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 custom-scrollbar">
          
          {/* Printable White Paper Container */}
          <div
            id="printable-mayor-report"
            ref={printContentRef}
            className="mx-auto max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-2xl sm:rounded-none p-6 sm:p-12 font-serif text-[13px] leading-relaxed border border-slate-200"
            style={{ minHeight: "297mm" }}
          >
            {/* Government Official Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                {/* Municipal Seal Icon */}
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                  <Icon iconName="FaShieldHalved" size={28} className="text-blue-900" />
                </div>
                <div>
                  <h4 className="text-[11px] font-sans font-black uppercase tracking-[0.25em] text-slate-700">
                    Republic of the Philippines
                  </h4>
                  <h2 className="text-base font-sans font-black uppercase tracking-tight text-slate-900">
                    CITY GOVERNMENT OF SAN JOSE
                  </h2>
                  <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-blue-900">
                    TRAFFIC MANAGEMENT UNIT (TMU)
                  </h3>
                  <p className="text-[10px] font-sans text-slate-600">
                    Operations Directorate • Civic Grievances & Enforcement Bureau
                  </p>
                </div>
                {/* Executive Emblem */}
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                  <Icon iconName="FaLandmark" size={26} className="text-amber-800" />
                </div>
              </div>
            </div>

            {/* Memorandum Header Info */}
            <div className="space-y-1.5 font-sans border-b border-slate-300 pb-4 mb-6 text-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
                <span>MEMORANDUM CIRCULAR NO: TMU-2026-10-094</span>
                <span>SECURITY: OFFICIAL BUSINESS</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-700 uppercase tracking-wider">FOR:</span>
                <span className="col-span-9 font-black text-slate-900 uppercase">
                  HON. CITY MAYOR
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-700 uppercase tracking-wider">THRU:</span>
                <span className="col-span-9 font-semibold text-slate-800">
                  The City Administrator / Executive Chief of Staff
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-700 uppercase tracking-wider">FROM:</span>
                <span className="col-span-9 font-bold text-slate-900">
                  Traffic Management Unit (TMU) Operations Desk
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-700 uppercase tracking-wider">DATE:</span>
                <span className="col-span-9 font-medium text-slate-800">{todayStr}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold text-slate-700 uppercase tracking-wider">PERIOD:</span>
                <span className="col-span-9 font-medium text-slate-800">{periodStr}</span>
              </div>
              <div className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-200">
                <span className="col-span-3 font-black text-slate-900 uppercase tracking-wider">SUBJECT:</span>
                <span className="col-span-9 font-black text-slate-950 uppercase tracking-tight">
                  {subjectStr}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 text-slate-800">
              {/* Executive Summary */}
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                  1. Executive Overview
                </h4>
                <p className="text-justify leading-relaxed whitespace-pre-line text-xs font-serif">
                  {summaryStr}
                </p>
              </div>

              {/* Statistical KPI Grid */}
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                  2. Operational Highlights & Revenue Metrics
                </h4>
                <div className="grid grid-cols-4 gap-3 my-3 font-sans">
                  <div className="border border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Total Cases Logged</div>
                    <div className="text-xl font-black text-slate-900 mt-1 font-mono">{totalComplaints}</div>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Settled Complaints</div>
                    <div className="text-xl font-black text-emerald-700 mt-1 font-mono">14</div>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Under Review</div>
                    <div className="text-xl font-black text-amber-700 mt-1 font-mono">08</div>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Penalties Collected</div>
                    <div className="text-base font-black text-blue-900 mt-1 font-mono">
                      {formatCurrency(grandTotalFee)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                  3. Violation Breakdown & Penalty Assessment Ledger
                </h4>
                <table className="w-full font-sans text-xs border border-slate-300 border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                      <th className="p-2 text-left border-r border-slate-300">Violation Category</th>
                      <th className="p-2 text-right border-r border-slate-300">Standard Penalty</th>
                      <th className="p-2 text-center border-r border-slate-300">Violators Count</th>
                      <th className="p-2 text-right">Total Assessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-200 font-semibold">{row.category_name}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                          {formatCurrency(row.fee)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">
                          {row.violators_count}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(row.total_amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                      <td className="p-2 border-r border-slate-300 uppercase">Grand Total Assessment</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">
                        {formatCurrency(tableRows.reduce((acc, r) => acc + r.fee, 0))}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-mono">
                        {totalViolators}
                      </td>
                      <td className="p-2 text-right font-mono text-blue-900 font-black text-sm">
                        {formatCurrency(grandTotalFee)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                  4. Staff Observations & Enforcement Recommendations
                </h4>
                <p className="text-justify leading-relaxed whitespace-pre-line text-xs font-serif">
                  {recommendationsStr}
                </p>
              </div>

              {/* Official Sign-off and Endorsement Box */}
              <div className="pt-8 mt-8 border-t border-slate-300 font-sans">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  {/* Prepared By */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                      Prepared & Certified by:
                    </div>
                    <div className="border-b border-slate-900 pb-1 font-bold text-slate-900 uppercase">
                      {staffName}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      TMU Operations Specialist
                    </div>
                  </div>

                  {/* Endorsed By */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                      Reviewed & Endorsed by:
                    </div>
                    <div className="border-b border-slate-900 pb-1 font-bold text-slate-900 uppercase">
                      P/Supt. Rodrigo M. Valdez
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      Chief of Police / Traffic Director
                    </div>
                  </div>

                  {/* Received By */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                      Received for the Office of the Mayor:
                    </div>
                    <div className="border border-dashed border-slate-400 p-2 text-slate-400 text-[10px] font-mono h-12 flex items-center justify-center">
                      OFFICIAL RECEIVING STAMP / DATE
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode & Footer Security Tracking */}
              <div className="pt-6 text-center border-t border-slate-200 text-[9px] font-mono text-slate-500 flex justify-between items-center">
                <span>DOCUMENT NO: TMU-DOC-2026-MYR-09418</span>
                <span>AUTHENTICATED BY E-REKLAMO MUNICIPAL COMMAND SYSTEM</span>
                <span>PAGE 1 OF 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="no-print px-6 py-3.5 border-t border-slate-700/80 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Icon iconName="FaInfo" size={12} className="text-blue-400" />
            <span>Click &apos;Print Document&apos; to print or save to PDF via your system print dialog.</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-4 py-2 rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              iconName="FaPrint"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              Print Document (PDF / Paper)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReportModal;
