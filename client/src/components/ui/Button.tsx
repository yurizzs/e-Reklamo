import React from 'react';
import * as FaIcons from 'react-icons/fa6';
import { Icon, LoadingSpinner } from "./index";

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  iconName?: keyof typeof FaIcons;
  iconPosition?: IconPosition;
  fullWidth?: boolean;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText = '',
    iconName,
    iconPosition = 'left',
    fullWidth = false,
    tooltip,
    tooltipPosition = 'top',
    className = '',
    disabled,
    ...props
  }, ref) => {

    const baseStyles = `group relative inline-flex items-center justify-center font-bold uppercase cursor-pointer
    tracking-tighter transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 
    disabled:cursor-not-allowed rounded-2xl gap-2 overflow-visible`;

    const variants = {
      primary: "bg-primary text-bg-dark hover:bg-primary/80 border border-border-muted shadow",
      secondary: "bg-secondary text-bg-dark hover:bg-secondary/80 border border-border-muted shadow",
      danger: "bg-danger text-bg-dark hover:bg-danger/80 border border-border-muted shadow",
      outline: "border-2 border-primary text-primary hover:bg-primary hover:text-bg-dark dark:hover:text-text shadow-sm",
      ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-text border border-transparent shadow-none",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm tracking-widest min-h-[36px]",
      md: "px-6 py-3 text-xs tracking-widest min-h-[48px]",
      lg: "px-10 py-4 text-sm tracking-widest min-h-[60px]",
    };

    const tooltipPositions = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const spinnerSizeMap: Record<ButtonSize, string> = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-8 h-8",
    };

    const widthStyle = fullWidth ? 'w-full' : '';
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Tooltip */}
        {tooltip && !disabled && (
          <span className={`absolute ${tooltipPositions[tooltipPosition]} z-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest
            bg-slate-900 text-white dark:bg-black dark:text-slate-200 border border-slate-800 dark:border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-none
            whitespace-nowrap`}>
            {tooltip}
          </span>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="inset-0 flex items-center justify-center bg-inherit z-10 rounded-2xl">
            <LoadingSpinner
              size="custom"
              customSize={spinnerSizeMap[size]}
              color="text-current"
              text={loadingText}
            />
          </div>
        )}

        {/* Content */}
        <div className={`${isLoading ? 'hidden' : 'flex'} items-center gap-2 transition-opacity duration-200`}>

          {iconPosition === 'left' && iconName && !isLoading && (
            <Icon
              iconName={iconName}
              size={size === 'sm' ? 14 : 18}
              className="text-current"
            />
          )}

          {children && <span>{children}</span>}

          {iconPosition === 'right' && iconName && !isLoading && (
            <Icon
              iconName={iconName}
              size={size === 'sm' ? 14 : 18}
              className="text-current"
            />
          )}
        </div>
      </button>
    );
  }
);

export default Button;