import React from 'react';
import Icon from '../icon';

type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'custom';

interface BaseProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  name?: string;
  size?: ComponentSize;
  customSize?: string;
  fullWidth?: boolean;
}

const getSizeClasses = (size: ComponentSize, customSize?: string) => {
  const sizes = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };
  return size === 'custom' && customSize ? customSize : (sizes[size as keyof typeof sizes] || sizes.md);
};

const getInnerSize = (size: ComponentSize) => {
  const icons = { sm: 14, md: 18, lg: 24 };
  return icons[size as keyof typeof icons] || 18;
};

export const Checkbox = ({ 
  label,
  name = "",
  size = 'md', 
  customSize, 
  className = '', 
  fullWidth = false,
  ...props 
}: BaseProps) => {
  const dimensionClass = getSizeClasses(size, customSize);
  const iconSize = getInnerSize(size);

  return (
    <label className={`${fullWidth ? 'w-full' : 'w-fit'} inline-flex items-center gap-3 
      cursor-pointer group ${className}`}>
      <div className="relative flex items-center justify-center">
        <input 
          type="checkbox"
          name={name}
          className={`peer appearance-none border-2 border-white/10 
            rounded-lg bg-black/40 checked:bg-primary/20 checked:border-primary group-hover:border-primary/50
            transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]
            ${dimensionClass}`} 
          {...props} 
        />
        <div className="absolute text-primary opacity-0 peer-checked:opacity-100 transition-all duration-300 pointer-events-none drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] scale-50 peer-checked:scale-100">
          <Icon iconName="FaCheck" size={iconSize} />
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 transition-colors font-mono">
        {label}
      </span>
    </label>
  );
};

export const Radio = ({ 
  label, 
  name, 
  size = 'sm', 
  customSize, 
  className = '', 
  fullWidth = false,
  ...props 
}: BaseProps) => {
  const dimensionClass = getSizeClasses(size, customSize);
  
  const dotSizes = {xs: 'w-2 h-2', sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-6 h-6' };
  const dotClass = size === 'custom' ? 'w-1/2 h-1/2' : (dotSizes[size as keyof typeof dotSizes] || dotSizes.sm);

  return (
    <label className={`${fullWidth ? 'w-full' : 'w-fit'} inline-flex items-center 
        gap-3 cursor-pointer group ${className}`}>
      <div className="relative flex items-center justify-center">
        <input 
          type="radio" 
          name={name} 
          className={`peer appearance-none border-2 border-white/10 rounded-full bg-black/40
            checked:border-primary transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.3)] ${dimensionClass}`} 
          {...props} 
        />
        <div className={` ${dotClass} bg-primary rounded-full absolute
          scale-0 peer-checked:scale-100 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.8)]`}
        />
      </div>
      <span className={`text-xs font-bold uppercase tracking-widest text-slate-500 
        group-hover:text-emerald-400 transition-colors font-mono`}>
        {label}
      </span>
    </label>
  );
};