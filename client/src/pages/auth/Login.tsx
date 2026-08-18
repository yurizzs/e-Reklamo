import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastProvider, Icon } from "../../components/ui/index";
import {
  InputField,
  PasswordInputField,
} from "../../components/ui/forms/index";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import { PATHS } from "../../routes/path";
import type { AxiosError } from "axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const t = window.setInterval(() => {
      setLockoutSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [lockoutSeconds]);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9._]{3,30}$/.test(username)) {
      newErrors.username =
        "Username must be 3-30 characters long and can contain letters, numbers, dots, and underscores.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      notify.error(`Too many login attempts. Try again in ${lockoutSeconds}s.`);
      return;
    }
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ username, password });
      notify.success("Logged in successfully!");
      navigate(PATHS.APP.DASHBOARD, { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<{
        message?: string;
        data?: { retry_after?: number };
        errors?: Record<string, string[]>;
      }>;
      const status = axiosErr.response?.status;
      const data = axiosErr.response?.data;

      if (status === 422 && data?.errors) {
        setErrors({
          username: data.errors.username?.[0],
          password: data.errors.password?.[0],
        });
      } else if (status === 401) {
        notify.error(data?.message || "Invalid credentials. Please try again.");
      } else if (status === 429) {
        const retryAfterFromData = data?.data?.retry_after ?? 0;
        const retryAfterFromMessage = Number(
          (data?.message || "").match(/(\d+)\s*seconds?/i)?.[1] ?? 0,
        );
        const retryAfter = Math.max(retryAfterFromData, retryAfterFromMessage);
        if (retryAfter > 0) setLockoutSeconds(retryAfter);
        notify.error(
          data?.message || "Too many login attempts. Please wait and try again.",
        );
      } else {
        notify.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden grid lg:grid-cols-12 bg-bg-dark transition-colors duration-300">

        {/* ─── LEFT PANEL: DESKTOP ONLY BRAND PREVIEW ─── */}
        <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-[#0a0d18] dark:to-slate-900 p-12 flex-col justify-between border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-40">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(37,99,235,0.06),_transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(99,102,241,0.04),_transparent_50%)]" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(37,99,235,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.015) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          {/* Logo & Subtitle */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-550/5 dark:bg-blue-500/10 border border-blue-550/15 dark:border-blue-500/20 flex items-center justify-center transition-colors">
              <Icon iconName="FaShieldHalved" size={18} className="text-blue-600 dark:text-blue-505" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none transition-colors">
                e-<span className="text-amber-500 dark:text-amber-400">Reklamo</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-none mt-1 transition-colors">
                Traffic Operations
              </span>
            </div>
          </div>

          {/* Abstract Operations Shield Graphic */}
          <div className="relative z-10 max-w-md mx-auto w-full my-auto text-center space-y-8">
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Concentric Rotating Tech Rings */}
              <div className="absolute inset-0 border border-blue-550/10 dark:border-blue-500/10 border-t-blue-600/30 dark:border-t-blue-500/30 animate-[spin_12s_linear_infinite]" />
              <div className="absolute inset-4 border border-indigo-555/10 dark:border-indigo-500/10 border-b-indigo-600/30 dark:border-b-indigo-500/30 animate-[spin_8s_linear_infinite_reverse]" />

              {/* Central Glowing Shield Icon */}
              <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shadow-2xl dark:shadow-none relative z-10 animate-pulse transition-colors">
                <Icon iconName="FaShieldHalved" size={40} className="text-blue-600 dark:text-blue-505" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-450 font-mono transition-colors">
                Operations Console
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white transition-colors">
                Traffic Management Unit
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto transition-colors">
                Authorized access to live incident dispatching, operator shift scheduling, and road violation compliance registers.
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors duration-300">
            <span>© {new Date().getFullYear()} e-Reklamo Portal</span>
            <span>Console V2.4.0</span>
          </div>
        </div>

        {/* ─── RIGHT PANEL: LOGIN VIEW ─── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center items-center px-6 py-12 relative z-15 bg-bg-dark transition-colors duration-300">

          {/* Subtle Ambient Glow for Form */}
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]" />
          </div>

          {/* Form Card */}
          <div className="w-full max-w-[360px] relative z-10 flex flex-col gap-6">

            {/* Header Block (Logo & Greeting) */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl border border-blue-550/20 dark:border-blue-500/10 bg-white dark:bg-blue-500/10 flex items-center justify-center shadow-inner transition-colors">
                <Icon iconName="FaShieldHalved" size={24} className="text-blue-600 dark:text-blue-500 transition-colors" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
                  e-<span className="text-amber-500 dark:text-amber-400">Reklamo</span>
                </h1>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
                  Sign in to operations
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                label="Username"
                iconName="FaUser"
                type="text"
                name="username"
                placeholder="Enter your username"
                value={username}
                autoComplete="username"
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username)
                    setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                error={errors.username}
                fullWidth
                required
              />

              <PasswordInputField
                label="Password"
                name="password"
                placeholder="Enter your password"
                iconName="FaLock"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                fullWidth
                required
                autoComplete="current-password"
              />

              <div className="flex justify-end mt-0.5">
                <Link
                  to="#"
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                  id="forgot-password-link"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || lockoutSeconds > 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all mt-1 shadow-md hover:scale-[1.01] active:scale-95 duration-200"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  lockoutSeconds > 0 ? `Try again in ${lockoutSeconds}s` : "Sign In"
                )}
              </button>
            </form>

            {/* Request access footer */}
            <div className="flex flex-col items-center gap-4 text-center mt-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Don't have an account?{" "}
                <Link
                  to="#"
                  id="register-link"
                  className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-bold"
                >
                  Request Access
                </Link>
              </p>

              <div className="w-16 h-px bg-slate-200 dark:bg-white/5" />

              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-300 dark:text-white/10">
                Authorized Access Only
              </span>
            </div>

          </div>

        </div>

      </div>

      <ToastProvider />
    </>
  );
};

export default Login;
