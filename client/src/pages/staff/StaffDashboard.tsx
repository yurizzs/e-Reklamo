import { MainLayout } from "../../components/layouts";
import { Icon } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";

const StaffDashboard = () => {
  const { user } = useAuth();

  const content = (
    <div className="space-y-8 pb-6">
      <div className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-white dark:bg-slate-900/40 p-6 shadow-xl transition-colors duration-300">
        <div className="relative space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-650 dark:text-blue-400">
            Staff Command Center
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Welcome back, {user?.name ?? "Staff"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Review assigned cases, track updates, and keep complaint handling moving without leaving the main operations view.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
              <Icon iconName="FaClipboardList" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Queue
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-slate-900 dark:text-white">08</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pending cases for review</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-400">
              <Icon iconName="FaCircleCheck" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Today
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-slate-900 dark:text-white">14</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cases completed today</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-5 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-400">
              <Icon iconName="FaTriangleExclamation" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Escalations
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-slate-900 dark:text-white">03</div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">High-priority follow-ups</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 dark:border-white/5 bg-white dark:bg-bg-light p-6 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800 dark:text-white/90">
            Team priorities
          </h2>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
            Live
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {[
            "Verify newly submitted complaints before handoff.",
            "Confirm follow-up details for escalated cases.",
            "Keep the latest case notes synchronized with the admin queue.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-4"
            >
              <div className="mt-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 p-2 text-blue-600 dark:text-blue-400">
                <Icon iconName="FaArrowRight" size={12} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffDashboard;
