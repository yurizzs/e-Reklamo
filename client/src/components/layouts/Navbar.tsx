import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PATHS } from "../../routes/path";
import { Icon } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { notify } from "../../util/notify";
import { useTheme } from "../../contexts/ThemeContext";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`
    : null;
  const displayName = user?.name || user?.username || "User";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      notify.success("Logged out successfully.");
      navigate(PATHS.LOGIN, { replace: true });
    } catch {
      notify.error("Failed to log out. Please try again.");
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white dark:bg-bg-light border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
      {/* Animated accent line under the nav */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_10px_oklch(var(--primary)/0.4)] opacity-0 dark:opacity-100 transition-opacity duration-300" />

      <div className="px-3 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          {/* ─── LEFT — LOGO & MOBILE TOGGLE ─── */}
          <div className="flex items-center justify-start gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 text-primary rounded-lg sm:hidden hover:bg-primary/10 focus:outline-none transition-all active:scale-90"
            >
              <Icon iconName="FaAlignJustify" />
            </button>

            <Link
              to={PATHS.APP.DASHBOARD}
              className="flex gap-3 items-center group"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Icon
                  iconName="FaShieldHalved"
                  size={16}
                  className="text-primary relative z-10"
                />
              </div>
              <span className="text-slate-900 dark:text-white font-black text-xl tracking-tighter uppercase hidden sm:block transition-colors duration-300">
                e-<span className="text-primary">Reklamo</span>
              </span>
            </Link>
          </div>

          {/* ─── RIGHT — USER PROFILE & THEME TOGGLE ─── */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
                title={`Switch Theme`}
              >
                <Icon
                  iconName={resolvedTheme === "light" ? "FaMoon" : "FaSun"}
                  size={16}
                />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-profile-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-3 p-1.5 rounded-2xl cursor-pointer transition-all duration-300 focus:outline-none border
                                  ${isDropdownOpen ? "bg-slate-100 dark:bg-primary/10 border-slate-200 dark:border-primary/30 shadow-sm" : "border-transparent hover:bg-slate-100 dark:hover:bg-white/5"}`}
                >
                  {/* Avatar Container */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-primary/30 flex items-center justify-center bg-slate-50 dark:bg-black/40 shrink-0 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black uppercase text-slate-700 dark:text-primary">
                        {displayInitial}
                      </span>
                    )}
                  </div>

                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                      {displayName}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-primary/70">
                      {user.role}
                    </span>
                  </div>

                  <Icon
                    iconName="FaChevronDown"
                    size={10}
                    className={`text-slate-400 dark:text-primary/50 hidden md:block transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-slate-600 dark:text-primary" : ""}`}
                  />
                </button>

                {/* ─── DROPDOWN MENU ─── */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-[120%] w-64 bg-white dark:bg-[#080B14] border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    {/* User Info Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-primary/30 flex items-center justify-center bg-slate-50 dark:bg-black/40 shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span className="text-lg font-black text-slate-700 dark:text-primary">
                              {displayInitial}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {displayName}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate font-medium">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-red-500/5 group-hover:bg-red-500/20 transition-colors">
                          <Icon
                            iconName="FaRightFromBracket"
                            size={14}
                            className="text-slate-400 group-hover:text-red-500 transition-colors"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-red-500 transition-colors">
                          Sign Out
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
