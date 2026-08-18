import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import { useAuth } from "../contexts/AuthContext";
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
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, operators: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const dateFormat = useDateFormatter();
  const displayName = user?.name || user?.username || "User";

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
    <div className="relative space-y-10 pb-12 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-indigo-650/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero Header Area */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            System Dashboard
          </h1>
          <p className="text-sm text-blue-600 dark:text-blue-450 font-mono uppercase tracking-[0.3em]">
            Traffic Management Unit • Command Center
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl transition-colors duration-300">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Live System Link</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
              <Icon iconName="FaUsers" className="text-blue-600 dark:text-blue-500 text-lg" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">Users</span>
          </div>
          <div className="space-y-0.5">
            {isStatsLoading ? (
              <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {stats.total.toString().padStart(2, '0')}
              </div>
            )}
            <div className="text-[9px] text-blue-650 dark:text-blue-450 font-mono uppercase tracking-widest">Global identities</div>
          </div>
          <div className="mt-4 h-0.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-full opacity-35" />
          </div>
        </div>

        {/* Total Operators Card */}
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
              <Icon iconName="FaUserGear" className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">Field Units</span>
          </div>
          <div className="space-y-0.5">
            {isStatsLoading ? (
              <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {stats.operators.toString().padStart(2, '0')}
              </div>
            )}
            <div className="text-[9px] text-blue-600 dark:text-blue-400/60 font-mono uppercase tracking-widest">Active Operators</div>
          </div>
           <div className="mt-4 h-0.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 w-full opacity-35" />
          </div>
        </div>

        {/* Total Admins Card */}
        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
              <Icon iconName="FaUserShield" className="text-red-600 dark:text-red-400 text-lg" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono">Control</span>
          </div>
          <div className="space-y-0.5">
            {isStatsLoading ? (
              <div className="h-8 w-20 bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                {stats.admins.toString().padStart(2, '0')}
              </div>
            )}
            <div className="text-[9px] text-red-600 dark:text-red-400/60 font-mono uppercase tracking-widest">System Admins</div>
          </div>
           <div className="mt-4 h-0.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-red-500 w-full opacity-35" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800 dark:text-white/90">Users Snapshot</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            iconName="FaArrowRight" 
            iconPosition="right"
            className="text-[10px] text-blue-600 dark:text-blue-450 hover:text-blue-700 dark:hover:text-blue-400 border-transparent hover:bg-blue-500/5"
            onClick={() => navigate(PATHS.APP.USERS)}
          >
            View Full Users
          </Button>
        </div>

        <div className="bg-white dark:bg-bg-light border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
          <Table className="border-collapse bg-white dark:bg-bg-light border-0 shadow-none transition-colors duration-300">
            <TableHeader className="bg-slate-50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <TableCell isHeader align="center" className="text-slate-700 dark:text-slate-300 py-4 w-20">Avatar</TableCell>
                <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-1/4">Fullname</TableCell>
                <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-1/4">Email</TableCell>
                <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-1/5">Username</TableCell>
                <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-28">Role</TableCell>
                <TableCell isHeader className="text-slate-700 dark:text-slate-300 py-4 w-24">Provisioned</TableCell>
              </tr>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24">
                    <div className="flex items-center justify-center w-full">
                       <LoadingSpinner size="lg" text="Syncing Registered Users..." />
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell align="center" colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-center gap-3 text-slate-400">
                      <Icon iconName="FaDatabase" size={32} />
                      <p className="text-xs font-black uppercase tracking-wider">No user data detected</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <TableCell align="center">
                      {user.avatar ? (
                        <div className="relative inline-block">
                          <img
                            src={`${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                          />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-[#0B0F1A] rounded-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-primary font-black">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-extrabold text-sm text-slate-900 dark:text-white">{user.name}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-black/30 text-slate-700 dark:text-blue-400 font-mono text-xs font-bold border border-slate-200 dark:border-white/5">
                        @{user.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`
                        px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border
                        ${user.role === 'admin' 
                          ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' 
                          : 'bg-slate-100 border-slate-350 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-slate-350'}
                      `}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">{dateFormat.date(user.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Decorative System Footer */}
      <div className="relative z-10 flex items-center gap-4 opacity-30 px-2">
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 dark:text-slate-450">
          Terminal Status: Operational • System V2.4.0
        </span>
      </div>
    </div>
  );

  return <MainLayout content={content} />;
};

export default Dashboard;