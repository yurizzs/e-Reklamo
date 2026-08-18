import React, { useId, useState } from "react";
import * as FaIcons from "react-icons/fa6";
import Icon from "../icon";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name?: string;
  error?: string;
  iconName?: keyof typeof FaIcons;
  fullWidth?: boolean;
  autoComplete?: string;
}

export const PasswordInputField = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      label,
      name,
      error,
      iconName = "FaLock",
      fullWidth = false,
      autoComplete = "off",
      className = "",
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

    const baseInputStyles = `
      w-full bg-white dark:bg-black/30 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition shadow-sm
    `;

    return (
      <div className={`${fullWidth ? "w-full" : "w-72"} flex flex-col gap-1.5`}>
        {/* LABEL */}
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
          >
            {label}
            {required && <span className="text-danger text-xs">*</span>}
          </label>
        )}

        {/* FIELD */}
        <div className="relative flex items-center group">
          {/* LEFT ICON */}
          {iconName && (
            <div
              className={`
                absolute left-4 transition-colors duration-200
                text-text-muted
                group-focus-within:text-primary
                ${error ? "text-danger" : ""}
              `}
            >
              <Icon iconName={iconName} size={18} />
            </div>
          )}

          {/* INPUT */}
          <input
            id={id}
            ref={ref}
            name={name}
            type={showPassword ? "text" : "password"}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`
              peer ${baseInputStyles}
              ${iconName ? "pl-11" : ""}
              pr-11
              ${
                error
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : ""
              }
              ${className}
            `}
            {...props}
          />

          {/* TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`
              absolute right-4 transition-colors duration-200
              text-text-muted
              hover:text-primary
              focus:outline-none
              ${error ? "text-danger" : ""}
            `}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon iconName={showPassword ? "FaEyeSlash" : "FaEye"} size={16} />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <span className="text-[12px] text-red-400 mt-0.5">{error}</span>
        )}
      </div>
    );
  },
);
