import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  settledComplaints?: number;
  underReviewComplaints?: number;
  totalFeeCollected?: number;
  violationTableData?: TableItem[];
  officerName?: string;
}

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  reportData?: PrintReportData | null;
  autoPrint?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const extractMonthFromPeriod = (period?: string): string => {
  if (period) {
    const found = MONTH_NAMES.find((m) =>
      period.toLowerCase().includes(m.toLowerCase())
    );
    if (found) return found;
  }
  return new Date().toLocaleDateString("en-US", { month: "long" });
};

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  onBack,
  reportData,
  autoPrint,
}) => {
  const { user } = useAuth();
  const printContentRef = useRef<HTMLDivElement>(null);

  const periodStr = reportData?.period || "October 2026 (Monthly Operations Cycle)";
  const reportMonth = extractMonthFromPeriod(periodStr);
  const pdfFileName = `${reportMonth} Monthly Report`;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("has-print-modal");
      const originalTitle = document.title;
      document.title = pdfFileName;

      const handleBeforePrint = () => {
        document.title = pdfFileName;
      };
      const handleAfterPrint = () => {
        if (!isOpen) {
          document.title = originalTitle;
        }
      };

      window.addEventListener("beforeprint", handleBeforePrint);
      window.addEventListener("afterprint", handleAfterPrint);

      return () => {
        document.body.classList.remove("has-print-modal");
        document.title = originalTitle;
        window.removeEventListener("beforeprint", handleBeforePrint);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [isOpen, pdfFileName]);

  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  if (!isOpen) return null;

  const staffName =
    reportData?.officerName ||
    (user?.first_name ? `${user.first_name} ${user.last_name}` : "TMU Staff Officer");

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
  const settledComplaints =
    reportData?.settledComplaints !== undefined
      ? reportData.settledComplaints
      : Math.round(totalComplaints * 0.64);
  const underReviewComplaints =
    reportData?.underReviewComplaints !== undefined
      ? reportData.underReviewComplaints
      : Math.max(0, totalComplaints - settledComplaints);

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="print-modal-overlay fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Background Overlay */}
      <div
        className="no-print fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="print-modal-container relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-700/60 shadow-2xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">

        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Icon iconName="FaFilePdf" size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Official Document Print Preview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  PDF READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Memorandum formatted for City Mayor Executive Briefing • Export filename:{" "}
                <span className="font-mono text-emerald-400 font-semibold">{pdfFileName}.pdf</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconName="FaXmark"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl cursor-pointer"
          />
        </div>

        {/* Scrollable Printable Document View */}
        <div className="print-modal-scroll flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/70 custom-scrollbar">

          {/* Printable White Paper Container */}
          <div
            id="printable-mayor-report"
            ref={printContentRef}
            className="mx-auto max-w-[210mm] min-h-[297mm] print:min-h-0 print:h-auto bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 font-serif text-[12px] leading-relaxed border border-slate-200"
          >
            {/* Government Official Letterhead */}
            <div className="print-avoid-break text-center border-b-2 border-slate-900 pb-2 mb-2.5">
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-1.5">
                {/* Municipal Seal Icon */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                  <Icon iconName="FaShieldHalved" size={23} className="text-blue-900" />
                </div>
                <div>
                  <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-slate-700">
                    Republic of the Philippines • Province of Capiz
                  </h4>
                  <h2 className="text-base font-sans font-black uppercase tracking-tight text-slate-900">
                    CITY GOVERNMENT OF ROXAS
                  </h2>
                  <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-blue-900">
                    TRAFFIC MANAGEMENT UNIT (TMU)
                  </h3>
                  <p className="text-[9.5px] font-sans text-slate-600">
                    Operations Directorate • Civic Grievances & Enforcement Bureau • City Hall, Roxas City
                  </p>
                </div>
                {/* Executive Emblem */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                  <Icon iconName="FaLandmark" size={21} className="text-amber-800" />
                </div>
              </div>
            </div>

            {/* Memorandum Header Info */}
            <div className="print-avoid-break space-y-1 font-sans border-b border-slate-300 pb-2.5 mb-2.5 text-[11px]">
              <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-mono mb-1.5">
                <span>MEMORANDUM CIRCULAR NO: TMU-2026-10-094</span>
                <span>SECURITY: OFFICIAL BUSINESS</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-bold text-slate-700 uppercase tracking-wider">FOR:</span>
                <span className="col-span-9 sm:col-span-10 font-black text-slate-900 uppercase">
                  HON. CITY MAYOR
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-bold text-slate-700 uppercase tracking-wider">THRU:</span>
                <span className="col-span-9 sm:col-span-10 font-semibold text-slate-800">
                  The City Administrator / Executive Chief of Staff
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-bold text-slate-700 uppercase tracking-wider">FROM:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-slate-900">
                  Traffic Management Unit (TMU) Operations Desk
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-bold text-slate-700 uppercase tracking-wider">DATE:</span>
                <span className="col-span-9 sm:col-span-10 font-medium text-slate-800">{todayStr}</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-bold text-slate-700 uppercase tracking-wider">PERIOD:</span>
                <span className="col-span-9 sm:col-span-10 font-medium text-slate-800">{periodStr}</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline pt-1.5 border-t border-slate-200">
                <span className="col-span-3 sm:col-span-2 font-black text-slate-900 uppercase tracking-wider">SUBJECT:</span>
                <span className="col-span-9 sm:col-span-10 font-black text-slate-950 uppercase tracking-tight">
                  {subjectStr}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-2.5 text-slate-800">
              {/* Executive Summary */}
              <div className="print-avoid-break">
                <h4 className="font-sans font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                  1. Executive Overview
                </h4>
                <p className="text-justify leading-snug whitespace-pre-line text-[11px] font-serif">
                  {summaryStr}
                </p>
              </div>

              {/* Statistical KPI Grid */}
              <div className="print-avoid-break">
                <h4 className="font-sans font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                  2. Operational Highlights & Revenue Metrics
                </h4>
                <div className="grid grid-cols-4 gap-2 my-1.5 font-sans">
                  <div className="border border-slate-300 rounded-md py-1.5 px-2 text-center bg-slate-50 flex flex-col justify-between">
                    <div className="text-[9px] font-bold uppercase text-slate-600 tracking-tight leading-tight">Total Cases Logged</div>
                    <div className="text-base font-black text-slate-900 mt-0.5 font-mono">{totalComplaints}</div>
                  </div>
                  <div className="border border-slate-300 rounded-md py-1.5 px-2 text-center bg-slate-50 flex flex-col justify-between">
                    <div className="text-[9px] font-bold uppercase text-slate-600 tracking-tight leading-tight">Settled Complaints</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5 font-mono">{settledComplaints}</div>
                  </div>
                  <div className="border border-slate-300 rounded-md py-1.5 px-2 text-center bg-slate-50 flex flex-col justify-between">
                    <div className="text-[9px] font-bold uppercase text-slate-600 tracking-tight leading-tight">Under Review</div>
                    <div className="text-base font-black text-amber-700 mt-0.5 font-mono">{underReviewComplaints}</div>
                  </div>
                  <div className="border border-slate-300 rounded-md py-1.5 px-2 text-center bg-slate-50 flex flex-col justify-between">
                    <div className="text-[9px] font-bold uppercase text-slate-600 tracking-tight leading-tight">Penalties Collected</div>
                    <div className="text-xs sm:text-sm font-black text-blue-900 mt-0.5 font-mono">
                      {formatCurrency(grandTotalFee)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="print-avoid-break">
                <h4 className="font-sans font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                  3. Violation Breakdown & Penalty Assessment Ledger
                </h4>
                <div className="overflow-x-auto mt-1">
                  <table className="w-full font-sans text-[10.5px] border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[9.5px] border-b border-slate-300">
                        <th className="px-2.5 py-1 text-left border-r border-slate-300">Violation Category</th>
                        <th className="px-2.5 py-1 text-right border-r border-slate-300">Standard Penalty</th>
                        <th className="px-2.5 py-1 text-center border-r border-slate-300">Violators Count</th>
                        <th className="px-2.5 py-1 text-right">Total Assessed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="px-2.5 py-1 border-r border-slate-200 font-semibold">{row.category_name}</td>
                          <td className="px-2.5 py-1 border-r border-slate-200 text-right font-mono text-slate-700">
                            {formatCurrency(row.fee)}
                          </td>
                          <td className="px-2.5 py-1 border-r border-slate-200 text-center font-mono font-bold">
                            {row.violators_count}
                          </td>
                          <td className="px-2.5 py-1 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(row.total_amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-900">
                        <td className="px-2.5 py-1 border-r border-slate-300 uppercase">Grand Total Assessment</td>
                        <td className="px-2.5 py-1 border-r border-slate-300 text-right font-mono">
                          {formatCurrency(tableRows.reduce((acc, r) => acc + r.fee, 0))}
                        </td>
                        <td className="px-2.5 py-1 border-r border-slate-300 text-center font-mono">
                          {totalViolators}
                        </td>
                        <td className="px-2.5 py-1 text-right font-mono text-blue-900 font-black text-xs">
                          {formatCurrency(grandTotalFee)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              <div className="print-avoid-break">
                <h4 className="font-sans font-black text-[11px] uppercase tracking-wider text-slate-900 mb-1 border-b border-slate-200 pb-0.5">
                  4. Staff Observations & Enforcement Recommendations
                </h4>
                <p className="text-justify leading-snug whitespace-pre-line text-[11px] font-serif">
                  {recommendationsStr}
                </p>
              </div>

              {/* Official Sign-off and Endorsement Box */}
              <div className="print-avoid-break pt-2.5 mt-2.5 border-t border-slate-300 font-sans">
                <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center text-xs">
                  {/* Prepared By */}
                  <div className="flex flex-col justify-between h-16">
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Prepared & Certified by:
                    </div>
                    <div>
                      <div className="border-b border-slate-900 pb-0.5 font-bold text-slate-900 uppercase text-[11px]">
                        {staffName}
                      </div>
                      <div className="text-[9.5px] text-slate-600 mt-0.5">
                        TMU Operations Specialist
                      </div>
                    </div>
                  </div>

                  {/* Endorsed By */}
                  <div className="flex flex-col justify-between h-16">
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Reviewed & Endorsed by:
                    </div>
                    <div>
                      <div className="border-b border-slate-900 pb-0.5 font-bold text-slate-900 uppercase text-[11px]">
                        P/Supt. Rodrigo M. Valdez
                      </div>
                      <div className="text-[9.5px] text-slate-600 mt-0.5">
                        Chief of Police / Traffic Director
                      </div>
                    </div>
                  </div>

                  {/* Received By */}
                  <div className="flex flex-col justify-between h-16">
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Received for the Office of the Mayor:
                    </div>
                    <div className="border border-dashed border-slate-400 p-1 text-slate-400 text-[9px] font-mono h-8 flex items-center justify-center">
                      OFFICIAL RECEIVING STAMP / DATE
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode & Footer Security Tracking */}
              <div className="print-avoid-break pt-2 mt-2 text-center border-t border-slate-200 text-[8.5px] font-mono text-slate-500 flex justify-between items-center">
                <span>DOCUMENT NO: TMU-DOC-2026-MYR-09418</span>
                <span>AUTHENTICATED BY ROXAS CITY MUNICIPAL COMMAND SYSTEM</span>
                <span>PAGE 1 OF 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="no-print px-5 sm:px-6 py-3.5 border-t border-slate-700/80 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Icon iconName="FaInfo" size={12} className="text-blue-400" />
            <span>Click &apos;Export to PDF&apos; to download or print the official executive document.</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onBack || onClose}
              iconName="FaArrowLeft"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-400 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              Back
            </Button>
            <Button
              onClick={handlePrint}
              iconName="FaFilePdf"
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95"
            >
              Export to PDF / Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PrintReportModal;
