import React from "react";
import Icon from "./icon";

type SpinnerSize = "sm" | "md" | "lg" | "xlg" | "custom";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  customSize?: string;
  color?: string;
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  customSize = "",
  text = "",
  className = "",
  fullScreen = false,
}) => {
  const sizeClasses: Record<Exclude<SpinnerSize, "custom">, string> = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xlg: "w-24 h-24",
  };

  const iconSizes: Record<Exclude<SpinnerSize, "custom">, number> = {
    sm: 12,
    md: 18,
    lg: 24,
    xlg: 36,
  };

  const currentSize = size === "custom" ? customSize : sizeClasses[size];
  const iconSize = size === "custom" ? 18 : iconSizes[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`relative ${currentSize} flex items-center justify-center`}>
        {/* Outer thin rotating spinner ring */}
        <div className="absolute inset-0 border-2 border-slate-200 dark:border-white/5 rounded-full" />
        <div className="absolute inset-0 border-t-2 border-r-2 border-blue-600 dark:border-blue-500 rounded-full animate-spin" />
        
        {/* Pulsing Branded Shield Logo Core */}
        <Icon 
          iconName="FaShieldHalved" 
          size={iconSize} 
          className="text-blue-600 dark:text-blue-500 animate-pulse relative z-10" 
        />
      </div>

      {text && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-slate-700 dark:text-slate-400 font-mono animate-pulse">
            {text}
          </span>
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
            <span className="w-12 h-px bg-slate-200 dark:bg-white/10" />
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping [animation-delay:0.5s]" />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark transition-colors duration-300">
        {/* Ambient Pulsing Glow Backdrop */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-[100px] animate-pulse [animation-delay:1.2s]" />

        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;