import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import { LoadingSpinner, Icon, Button } from "../components/ui/index";
import { 
  Table, TableHeader, TableCell, TableBody, TableRow 
} from "../components/ui/table/Table";
import UserService from "../services/UserService";
import type { User } from "../interfaces/user";
import { useDateFormatter } from "../hooks/index";
import { PATHS } from "../routes/path";

interface Stats {
  total: number;
  admins: number;
  operators: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, operators: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const dateFormat = useDateFormatter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await UserService.getAll({ limit: 8 });
        const userData = response.data || response;
        setUsers(userData.users || userData.data || []);
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStats = async () => {
      setIsStatsLoading(true);
      try {
        const response = await UserService.getStats();
        setStats(response.data || response);
      } catch (error) {
        console.error("Stats Sync Error:", error);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchDashboardData();
    fetchStats();
  }, []);

  const content = (
    <div className="relative space-y-10 pb-12">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-green-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Header Area */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            System Dashboard
          </h1>
          <p className="text-sm text-emerald-500/60 font-mono uppercase tracking-[0.3em]">
            Traffic Management Unit • Command Center
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live System Link</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all rounded-3xl" />
          <div className="relative bg-white/2 border border-white/5 p-4 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Icon iconName="FaUsers" className="text-emerald-500 text-lg" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Users</span>
            </div>
            <div className="space-y-0.5">
              {isStatsLoading ? (
                <div className="h-8 w-20 bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <div className="text-3xl font-black text-white font-mono tracking-tighter">
                  {stats.total.toString().padStart(2, '0')}
                </div>
              )}
              <div className="text-[9px] text-emerald-500/60 font-mono uppercase tracking-widest">Global identities</div>
            </div>
            <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-full opacity-30 shadow-[0_0_10px_#10b981]" />
            </div>
          </div>
        </div>

        {/* Total Operators Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-all rounded-3xl" />
          <div className="relative bg-white/2 border border-white/5 p-4 rounded-3xl backdrop-blur-md hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Icon iconName="FaUserGear" className="text-blue-400 text-lg" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Field Units</span>
            </div>
            <div className="space-y-0.5">
              {isStatsLoading ? (
                <div className="h-8 w-20 bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <div className="text-3xl font-black text-white font-mono tracking-tighter">
                  {stats.operators.toString().padStart(2, '0')}
                </div>
              )}
              <div className="text-[9px] text-blue-400/60 font-mono uppercase tracking-widest">Active Operators</div>
            </div>
             <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-full opacity-30 shadow-[0_0_10px_#3b82f6]" />
            </div>
          </div>
        </div>

        {/* Total Admins Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-red-500/5 blur-xl group-hover:bg-red-500/10 transition-all rounded-3xl" />
          <div className="relative bg-white/2 border border-white/5 p-4 rounded-3xl backdrop-blur-md hover:border-red-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                <Icon iconName="FaUserShield" className="text-red-400 text-lg" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">Control</span>
            </div>
            <div className="space-y-0.5">
              {isStatsLoading ? (
                <div className="h-8 w-20 bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <div className="text-3xl font-black text-white font-mono tracking-tighter">
                  {stats.admins.toString().padStart(2, '0')}
                </div>
              )}
              <div className="text-[9px] text-red-400/60 font-mono uppercase tracking-widest">System Admins</div>
            </div>
             <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 w-full opacity-30 shadow-[0_0_10px_#ef4444]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-white/90">Users Snapshot</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            iconName="FaArrowRight" 
            iconPosition="right"
            className="text-[10px] text-emerald-500/60 hover:text-emerald-400 border-transparent hover:bg-emerald-500/5"
            onClick={() => navigate(PATHS.APP.USERS)}
          >
            View Full Users
          </Button>
        </div>

        <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <Table className="border-collapse">
            <TableHeader className="bg-black/40 border-b border-white/5">
              <tr>
                <TableCell isHeader align="center" className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Avatar</TableCell>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Fullname</TableCell>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Email</TableCell>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Username</TableCell>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Role</TableCell>
                <TableCell isHeader className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest py-5">Provisioned</TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24">
                    <div className="flex items-center justify-center w-full">
                       <LoadingSpinner size="lg" text="Syncing Registed Users..." />
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell align="center" colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Icon iconName="FaDatabase" size={40} />
                      <p className="font-mono text-xs uppercase tracking-widest">No user data detected</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-emerald-500/5 transition-colors border-b border-white/2 last:border-0 group">
                    <TableCell align="center">
                      {user.avatar ? (
                        <div className="relative inline-block">
                          <img
                            src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-emerald-500/50 transition-colors"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0B0F1A] rounded-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-slate-200">{user.name}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-black/40 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                        @{user.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`
                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${user.role === 'admin' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                      `}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-[10px]">{dateFormat.date(user.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Decorative System Footer */}
      <div className="relative z-10 flex items-center gap-4 opacity-20 px-2">
        <div className="flex-1 h-px bg-linear-to-r from-emerald-500 to-transparent" />
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-500">
          Terminal Status: Operational • System V2.4.0
        </span>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Dashboard;