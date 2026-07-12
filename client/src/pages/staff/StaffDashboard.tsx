import { MainLayout } from "../../components/layouts";
import { Icon } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";

const StaffDashboard = () => {
  const { user } = useAuth();

  const content = (
    <div className="space-y-8 pb-6">
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-slate-950/40 p-6 shadow-2xl shadow-emerald-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/70">
            Staff Command Center
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            Welcome back, {user?.name ?? "Staff"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Review assigned cases, track updates, and keep complaint handling moving without leaving the main operations view.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
              <Icon iconName="FaClipboardList" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Queue
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-white">08</div>
          <p className="mt-1 text-sm text-slate-400">Pending cases for review</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-400">
              <Icon iconName="FaCircleCheck" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Today
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-white">14</div>
          <p className="mt-1 text-sm text-slate-400">Cases completed today</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-400">
              <Icon iconName="FaTriangleExclamation" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Escalations
            </span>
          </div>
          <div className="mt-5 text-3xl font-black text-white">03</div>
          <p className="mt-1 text-sm text-slate-400">High-priority follow-ups</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-tight text-white/90">
            Team priorities
          </h2>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
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
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mt-0.5 rounded-full bg-emerald-500/15 p-2 text-emerald-400">
                <Icon iconName="FaArrowRight" size={12} />
              </div>
              <p className="text-sm text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default StaffDashboard;
