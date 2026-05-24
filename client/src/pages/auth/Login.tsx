import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastProvider } from "../../components/ui/index";
import {
  InputField,
  PasswordInputField,
} from "../../components/ui/forms/index";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import { PATHS } from "../../routes/path";
// import Background from "../../assets/tmu.jpg";
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
        // Validation errors — map to form fields
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
      <div className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-[#040c07] px-4 py-10">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Corner brackets */}
        <span className="absolute top-4 left-4 w-14 h-14 border-t border-l border-emerald-500/30 rounded-tl pointer-events-none" />
        <span className="absolute top-4 right-4 w-14 h-14 border-t border-r border-emerald-500/30 rounded-tr pointer-events-none" />
        <span className="absolute bottom-4 left-4 w-14 h-14 border-b border-l border-emerald-500/30 rounded-bl pointer-events-none" />
        <span className="absolute bottom-4 right-4 w-14 h-14 border-b border-r border-emerald-500/30 rounded-br pointer-events-none" />

        {/* Card */}
        <div className="relative overflow-hidden z-10 w-full max-w-sm bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-7 py-8 flex flex-col items-center gap-5">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] flex items-center justify-center">
              <svg className="w-7 h-7 fill-emerald-500" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.5h7c-.47 4.07-3.07 7.67-7 8.8v-8.8H5V6.3l7-3.11v8.31z" />
              </svg>
            </div>

            <div className="text-center flex flex-col gap-0.5">
              <h1 className="text-[26px] font-bold tracking-tight text-white leading-tight">
                e-<span className="text-emerald-400">Reklamo</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400/55">
                Traffic Management Unit
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/85">
              System Online
            </span>
          </div>

          <div className="w-full h-px bg-emerald-500/10" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Username */}
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

            {/* Password */}
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
            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                to="#"
                className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/60 hover:text-emerald-400 transition-colors"
                id="forgot-password-link"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-[#022c1a] font-bold text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors mt-1"
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

          {/* Request access */}
          <p className="text-[11px] text-emerald-200/30 text-center">
            Don't have an account?{" "}
            <Link
              to="#"
              id="register-link"
              className="text-emerald-400 cursor-pointer hover:underline"
            >
              Sign Up
            </Link>
          </p>

          {/* Footer */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500/15">
            © {new Date().getFullYear()} e-Reklamo • V2.4.0
          </p>
        </div>
      </div>

      <ToastProvider />
    </>
  );
};

export default Login;
