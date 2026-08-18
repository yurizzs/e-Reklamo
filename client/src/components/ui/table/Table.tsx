import React, { type FC, type ReactNode, type MouseEventHandler } from "react";
import { Icon } from "../../ui";

/* =========================
   TABLE
========================= */
export const Table: FC<{ children: ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 dark:border-white/5 bg-white/2 backdrop-blur-md shadow-2xl overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  </div>
);

/* =========================
   HEADER
========================= */
export const TableHeader: FC<{ children: ReactNode; className?: string }> = ({ children, className = "" }) => (
  <thead className={`text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 ${className}`}>
    {children}
  </thead>
);

/* =========================
   BODY
========================= */
export const TableBody: FC<{ children: ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-white/2">
    {children}
  </tbody>
);

/* =========================
   ROW
========================= */
export const TableRow = React.forwardRef<HTMLTableRowElement, { children: ReactNode; className?: string; onClick?: MouseEventHandler<HTMLTableRowElement> }>(({
  children, className = "", onClick }, ref) => (
  <tr
    ref={ref}
    onClick={onClick}
    className={`
      transition-colors duration-200
      ${onClick ? "cursor-pointer hover:bg-emerald-500/5" : ""}
      ${className}
    `}
  >
    {children}
  </tr>
));

/* =========================
   CELL (WITH SORTABLE)
========================= */
interface TableCellProps<T = string> {
  children?: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  isHeader?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
  sortKey?: T;
  currentSort?: { key: T; direction: "asc" | "desc" };
  onSort?: (key: T) => void;
}

export const TableCell = <T extends string = string>({
  children,
  colSpan,
  rowSpan,
  isHeader,
  className = "",
  align = "left",
  sortKey,
  currentSort,
  onSort,
}: TableCellProps<T>) => {
  const Tag = isHeader ? "th" : "td";

  const isSortable = isHeader && sortKey && onSort;
  const isActive = currentSort?.key === sortKey;

  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <Tag
      colSpan={colSpan}
      rowSpan={rowSpan}
      onClick={() => isSortable && onSort!(sortKey!)}
      className={`
        px-4 py-4 whitespace-nowrap
        ${isHeader ? "text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase tracking-widest" : "text-slate-800 dark:text-slate-200"}
        ${isSortable ? "cursor-pointer group" : ""}
        ${alignClass}
        ${rowSpan && rowSpan > 1 ? "align-top" : ""}
        ${className}
      `}
    >
      <div className={`flex items-center gap-2 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
        {children}

        {isSortable && (
          <div className="flex flex-col leading-none">
            <Icon
              iconName="FaChevronUp"
              size={10}
              className={
                isActive && currentSort?.direction === "asc"
                  ? "text-emerald-500"
                  : "text-slate-700 group-hover:text-emerald-500/50"
              }
            />
            <Icon
              iconName="FaChevronDown"
              size={10}
              className={
                isActive && currentSort?.direction === "desc"
                  ? "text-emerald-500"
                  : "text-slate-700 group-hover:text-emerald-500/50"
              }
            />
          </div>
        )}
      </div>
    </Tag>
  );
};

/* =========================
   PAGINATION
========================= */
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalResults: number;
  pageSize: number;
  resourceLabel?: string;
}

export const TablePagination: FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  totalResults,
  pageSize,
  resourceLabel = "Results",
}) => {
  const start = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalResults);

  const pageSizeOptions = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const getPages = () => {
    if (totalPages <= 3) return [...Array(totalPages)].map((_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1)
      return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  };

  const pages = getPages();

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">

      {/* LEFT: RESULTS INFO */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-700 dark:text-slate-400">Registry Range</span>
          <div className="w-16">
            <select
              value={pageSize.toString()}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-800 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-white/20 transition-colors"
            >
              {pageSizeOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-white dark:bg-bg-light text-slate-900 dark:text-white">{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/5" />

        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-700 dark:text-slate-400">
          Viewing <span className="font-extrabold text-slate-900 dark:text-white">{start}</span> -{" "}
          <span className="font-extrabold text-slate-900 dark:text-white">{end}</span> of{" "}
          <span className="font-extrabold text-slate-900 dark:text-white">{totalResults}</span>{" "}
          {resourceLabel}
        </span>
      </div>

      {/* RIGHT: NAVIGATION */}
      <div className="flex items-center gap-2">

        {/* PREV */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-white/10 disabled:opacity-20 transition-all duration-300"
        >
          <Icon iconName="FaChevronLeft" size={10} />
        </button>

        {/* PAGES */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/5">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                w-8 h-8 rounded-lg text-[10px] font-mono transition-all duration-300
                ${currentPage === page
                  ? "bg-slate-900/70 text-white dark:bg-slate-200/90 dark:text-slate-950 font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
                }
              `}>
              {page}
            </button>
          ))}
        </div>

        {/* NEXT */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-white/10 disabled:opacity-20 transition-all duration-300"
        >
          <Icon iconName="FaChevronRight" size={10} />
        </button>

      </div>
    </div>
  );
};
