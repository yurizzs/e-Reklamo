import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../ui";
import * as FaIcons from "react-icons/fa6";
import { PATHS } from "../../routes/path";
import { useAuth } from "../../contexts/AuthContext";
import type { Role } from "../../interfaces/user";

// Define the shape of a single menu item
interface MenuItem {
  name: string;
  icon: keyof typeof FaIcons;
  path: string;
  roles?: Role[]; // If omitted, visible to all authenticated users
}

// Define the shape of a menu group
interface MenuGroup {
  group: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuGroups: MenuGroup[] = [
    {
      group: "Menu",
      items: [
        {
          name: "Dashboard",
          icon: "FaHouse",
          path: PATHS.APP.DASHBOARD,
        },
        {
          name: "Complaints List",
          icon: "FaClipboardList",
          path: PATHS.APP.COMPLAINTS,
          roles: ["staff", "operator"],
        },
        {
          name: "Driver Records",
          icon: "FaIdCard",
          path: PATHS.APP.DRIVER_RECORDS,
          roles: ["staff", "operator", "admin"],
        },
        {
          name: "Analytics Report",
          icon: "FaChartSimple",
          path: PATHS.APP.ANALYTICS,
          roles: ["staff", "operator"],
        },
        {
          name: "Final Schedule",
          icon: "FaCalendarDays",
          path: PATHS.APP.STAFF_SCHEDULES,
          roles: ["staff", "operator"],
        },
        {
          name: "Staff Schedules",
          icon: "FaCalendarDays",
          path: PATHS.APP.STAFF_SCHEDULES,
          roles: ["admin"],
        },
        {
          name: "Users",
          icon: "FaUsers",
          path: PATHS.APP.USERS,
          roles: ["admin"],
        },
        {
          name: "Logs",
          icon: "FaClipboardList",
          path: PATHS.APP.LOGS,
          roles: ["admin"],
        },
        {
          name: "Violation Categories",
          icon: "FaListUl",
          path: PATHS.APP.VIOLATION_CATEGORIES,
          roles: ["admin"],
        },
      ],
    },
  ];

  // Filter menu items by current user's role
  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`fixed top-0 left-0 z-[60] w-56 h-screen bg-[#1e3a8a] dark:bg-bg-light transition-transform border-r border-white/10 dark:border-white/5 flex flex-col 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
    >
      {/* Sidebar Branding / Logo Header (Desktop-only/Unified) */}
      <div className="h-18 flex items-center px-6 gap-3 bg-[#1e3a8a] dark:bg-bg-light shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-white/20 shrink-0">
          <Icon iconName="FaShieldHalved" size={16} className="text-white/90 dark:text-blue-500" />
        </div>
        <span className="text-white font-black text-xl tracking-tighter uppercase">
          e-<span className="text-amber-400">Reklamo</span>
        </span>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.group} className="mb-8">
            {/* Group Header */}
            <div className="flex items-center gap-2 px-3 mb-4">
              <div className="w-1 h-3 bg-white/20" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200/50">
                {group.group}
              </h3>
            </div>

            <ul className="space-y-1 font-medium">
              {group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center p-2.5 rounded-xl group relative transition-all duration-200 ${isActive
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "text-blue-100/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      {/* Icon */}
                      <Icon
                        iconName={item.icon}
                        className={`w-4 h-4 transition-colors duration-200 ${isActive
                          ? "text-white"
                          : "text-blue-200/60 group-hover:text-white"
                          }`}
                      />

                      {/* Nav Text */}
                      <span
                        className={`ml-3 text-xs font-semibold tracking-wide transition-colors ${isActive
                          ? "text-white"
                          : "text-blue-100/70"
                          }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
