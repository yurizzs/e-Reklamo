import React, { useId } from "react";
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

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      error,
      iconName,
      fullWidth = false,
      autoComplete = "auto",
      className = "",
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const id = useId(); // React hook that generates a unique, stable ID string for your component.

    const baseInputStyles = `
      w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-xs
    `;

    return (
      <div className={`${fullWidth ? "w-full" : "w-72"} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
          >
            {label}
            {required && <span className="text-red-500 text-xs">*</span>}
          </label>
        )}

        <div className="relative flex items-center group">
          {iconName && (
            <div
              className={`
              absolute left-3.5 transition-colors duration-200
              text-slate-400 dark:text-slate-500
              group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400
              ${error ? "text-red-500" : ""}
            `}
            >
              <Icon iconName={iconName} size={16} />
            </div>
          )}

          <input
            id={id}
            ref={ref}
            name={name}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`
              peer ${baseInputStyles}
              ${iconName ? "pl-10" : ""}
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : ""
              }
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <span className="text-[12px] text-red-500 dark:text-red-400 mt-0.5">{error}</span>
        )}
      </div>
    );
  },
);
