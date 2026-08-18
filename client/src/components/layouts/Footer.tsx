import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="p-4 bg-transparent border-t border-slate-200 dark:border-white/5 mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-center text-text-muted text-xs font-semibold">
        <span>© {new Date().getFullYear()} | e-Reklamo.</span>
      </div>
    </footer>
  );
};

export default Footer;