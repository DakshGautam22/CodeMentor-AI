import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-6 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:bg-dark-850/60 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 active:scale-[0.98]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
