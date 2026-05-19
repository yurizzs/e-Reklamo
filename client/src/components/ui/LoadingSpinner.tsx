import React from "react";

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
    sm: "w-5 h-5",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xlg: "w-24 h-24",
  };

  const currentSizeClass = size === "custom" ? customSize : sizeClasses[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className={`relative ${currentSizeClass} flex items-center justify-center`}>
        
        {/* Outer Tech Ring (Dashed/Scanning) */}
        <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
        <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        
        {/* Middle Tech Ring (Counter-rotating) */}
        <div className="absolute inset-2 border border-green-500/20 rounded-full border-b-green-500 animate-[spin_3s_linear_infinite_reverse]" />
        
        {/* Inner Pulsing Core (The "Techy" Heart) */}
        <div className="w-1/4 h-1/4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.9)]" />
        
        {/* Extra Decorative Bits */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/5 animate-pulse" />
      </div>

      {text && (
        <div className="flex flex-col items-center gap-2">
           <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.5em] text-emerald-400 animate-pulse font-mono">
            {text}
          </span>
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-12 h-px bg-emerald-500/20" />
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping [animation-delay:0.5s]" />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B14]">
        {/* Techy Grid or Glow Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/5 rounded-full blur-[100px] animate-pulse [animation-delay:1.2s]" />
        
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;