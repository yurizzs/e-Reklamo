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
      group: "Main",
      items: [
        {
          name: "Dashboard",
          icon: "FaHouse",
          path: PATHS.APP.DASHBOARD,
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
      className={`fixed top-0 left-0 z-40 w-56 h-screen bg-bg-dark pt-20 transition-transform border-r border-white/5 
      ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
    >
      {/* ─── HUD BACKGROUND ELEMENTS ─── */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(oklch(var(--primary)) 0.5px, transparent 0.5px)`,
          backgroundSize: "15px 15px",
        }}
      />

      <div className="relative h-full px-4 pb-4 overflow-y-auto custom-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.group} className="mb-8">
            {/* Group Header with Label Notch */}
            <div className="flex items-center gap-2 px-3 mb-4">
              <div className="w-1 h-3 bg-primary/40" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">
                {group.group}
              </h3>
            </div>

            <ul className="space-y-2 font-medium">
              {group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center p-3 rounded-xl group relative transition-all duration-300 overflow-hidden ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 shadow-[0_0_15px_oklch(var(--primary)/0.05)]"
                          : "text-slate-400 hover:text-white border border-transparent hover:border-white/5"
                      }`}
                    >
                      {/* Active Indicator Line (Neon Glow) */}
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-3/5 rounded-r-full transition-all duration-500 
                        ${isActive ? "bg-primary shadow-[0_0_8px_oklch(var(--primary))]" : "bg-transparent group-hover:bg-white/20"}`}
                      />

                      {/* Icon with subtle glow when active */}
                      <div className="ml-2 relative">
                        {isActive && (
                          <div className="absolute inset-0 bg-primary/40 blur-md rounded-full" />
                        )}
                        <Icon
                          iconName={item.icon}
                          className={`relative z-10 transition-colors duration-300 ${
                            isActive
                              ? "text-primary"
                              : "text-slate-500 group-hover:text-white"
                          }`}
                        />
                      </div>

                      {/* Nav Text */}
                      <span
                        className={`ml-3 text-xs tracking-wider transition-all duration-300 ${
                          isActive
                            ? "font-black uppercase text-white"
                            : "font-semibold group-hover:translate-x-1"
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* Active Notch Decoration */}
                      {isActive && (
                        <div className="absolute right-0 top-0 w-2 h-2 border-t-2 border-r-2 border-primary/40 rounded-tr-md" />
                      )}
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
