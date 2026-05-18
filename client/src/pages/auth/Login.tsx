import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ToastProvider } from "../../components/ui/index";
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
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

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
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ username, password });
      notify.success("Logged in successfully!");
      navigate(PATHS.APP.DASHBOARD, { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<{
        message?: string;
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
      } else {
        notify.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f0a] text-emerald-100 overflow-hidden relative">
        {/* ─── BACKGROUND EFFECTS ─── */}
        <div className="absolute inset-0">
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-size-50px_50px" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-emerald-500/20 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-emerald-500/20 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-emerald-500/20 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-emerald-500/20 rounded-br-3xl" />

          {/* Subtle glow effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-[120px]" />
        </div>

        {/* ─── LOGIN CARD ─── */}
        <div className="relative z-10 w-full max-w-md mx-4">
          {/* Card container with border effect */}
          <div className="relative bg-[#0d120d]/80 border border-emerald-500/20 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
            {/* Corner decorations on card */}
            <div className="absolute -top-px -left-px w-8 h-8 border-l-2 border-t-2 border-emerald-500/40 rounded-tl-3xl" />
            <div className="absolute -top-px -right-px w-8 h-8 border-r-2 border-t-2 border-emerald-500/40 rounded-tr-3xl" />
            <div className="absolute -bottom-px -left-px w-8 h-8 border-l-2 border-b-2 border-emerald-500/40 rounded-bl-3xl" />
            <div className="absolute -bottom-px -right-px w-8 h-8 border-r-2 border-b-2 border-emerald-500/40 rounded-br-3xl" />

            <div className="space-y-8">
              {/* ─── LOGO & BRANDING ─── */}
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Shield Logo */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500 scale-110" />
                  <div className="relative bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-5 transition-transform duration-300 group-hover:scale-105">
                    <svg
                      className="w-12 h-12 fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-4xl font-black tracking-tight">
                    <span className="text-emerald-400 italic">e-</span>
                    <span className="text-emerald-300">Reklamo</span>
                  </h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-500/70">
                    Traffic Management Unit
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 px-6 py-2 border border-emerald-500/30 rounded-full bg-emerald-900/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                    System Online
                  </span>
                </div>
              </div>

              {/* ─── LOGIN FORM ─── */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                id="login-form"
              >
                <InputField
                  label="Username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  iconName="FaUser"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username)
                      setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  error={errors.username}
                  fullWidth
                  required
                  autoComplete="username"
                  className="bg-[#0a0f0a]/60 border-emerald-500/20 focus:border-emerald-500/50 text-emerald-100 placeholder:text-emerald-700"
                />

                <PasswordInputField
                  label="Password"
                  name="password"
                  placeholder="Enter your password"
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
                  className="bg-[#0a0f0a]/60 border-emerald-500/20 focus:border-emerald-500/50 text-emerald-100 placeholder:text-emerald-700"
                />

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <Link
                    to="#"
                    className="text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                    id="forgot-password-link"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  loadingText="Signing In..."
                  iconName="FaRightToBracket"
                  size="lg"
                  id="login-submit-btn"
                  className="bg-transparent border-2 border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-400 text-emerald-300 font-bold uppercase tracking-wider transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-emerald-400/50 rounded" />
                    Sign In
                  </span>
                </Button>
              </form>

              {/* ─── DIVIDER ─── */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-500/10"></div>
                </div>
              </div>

              {/* ─── REQUEST ACCESS ─── */}
              <p className="text-center text-sm text-emerald-600">
                Don't have an account?{" "}
                <Link
                  to="#"
                  className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline underline-offset-4 transition-colors duration-200"
                >
                  Request Access
                </Link>
              </p>
            </div>
          </div>

          {/* ─── FOOTER ─── */}
          <p className="text-center text-[10px] text-emerald-700 mt-6 font-medium uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} E-Reklamo • V2.4.0
          </p>
        </div>
      </div>

      <ToastProvider />
    </>
  );
};

export default Login;
