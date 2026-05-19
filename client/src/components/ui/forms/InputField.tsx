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
      w-full bg-emerald-500/[0.07] border border-emerald-500/35 rounded-lg pl-9 pr-3 py-2 text-sm text-emerald-100 placeholder-emerald-200/20 outline-none focus:border-emerald-400 focus:bg-emerald-500/[0.11] focus:ring-2 focus:ring-emerald-500/10 transition
    `;

    return (
      <div className={`${fullWidth ? "w-full" : "w-72"} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"
          >
            {label}
            {required && <span className="text-danger text-xs">*</span>}
          </label>
        )}

        <div className="relative flex items-center group">
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

          <input
            id={id}
            ref={ref}
            name={name}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`
              peer ${baseInputStyles}
              ${iconName ? "pl-11" : ""}
              ${
                error
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : ""
              }
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <span className="text-[12px] text-red-400 mt-0.5">{error}</span>
        )}
      </div>
    );
  },
);
