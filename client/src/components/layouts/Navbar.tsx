import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PATHS } from "../../routes/path";
import { Icon } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { notify } from "../../util/notify";
import Logo from "../../assets/react.svg";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <nav className="fixed top-0 z-50 w-full bg-bg-dark/80 backdrop-blur-xl border-b border-white/5">
      {/* Animated accent line under the nav */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_10px_oklch(var(--primary)/0.4)]" />

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
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/40 transition-all" />
                <img
                  src={Logo}
                  alt="App Logo"
                  className="relative w-5 h-5 object-contain brightness-110"
                />
              </div>
              <span className="text-white font-black text-xl tracking-tighter uppercase italic hidden sm:block">
                e-<span className="text-primary">Reklamo</span>
              </span>
            </Link>
          </div>

          {/* ─── RIGHT — USER PROFILE ─── */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-3 p-1.5 rounded-2xl cursor-pointer transition-all duration-300 focus:outline-none border
                                ${isDropdownOpen ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_oklch(var(--primary)/0.1)]" : "border-transparent hover:bg-white/5"}`}
              >
                {/* Avatar Container */}
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/30 flex items-center justify-center bg-black/40 shrink-0 shadow-[0_0_10px_oklch(var(--primary)/0.1)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black uppercase text-primary">
                      {displayInitial}
                    </span>
                  )}
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-white leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">
                    {user.role}
                  </span>
                </div>

                <Icon
                  iconName="FaChevronDown"
                  size={10}
                  className={`text-primary/50 hidden md:block transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                />
              </button>

              {/* ─── DROPDOWN MENU ─── */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-[120%] w-64 bg-[#080B14] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  {/* User Info Header */}
                  <div className="px-5 py-4 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-primary/30 flex items-center justify-center bg-black/40 shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-lg font-black text-primary">
                            {displayInitial}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">
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
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-red-500/10 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-red-500/5 group-hover:bg-red-500/20 transition-colors">
                        <Icon
                          iconName="FaRightFromBracket"
                          size={14}
                          className="text-slate-400 group-hover:text-red-500 transition-colors"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-red-500 transition-colors">
                        Sign Out
                      </span>
                    </button>
                  </div>

                  {/* HUD Decoration */}
                  <div className="flex justify-between px-4 pb-2 opacity-20">
                    <div className="h-0.5 w-1/3 bg-primary" />
                    <div className="h-0.5 w-4 bg-primary" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
