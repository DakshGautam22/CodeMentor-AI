import React from "react";
import { useUiStore } from "../../store/uiStore";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const Toast: React.FC = () => {
  const { toastMessage, toastType, hideToast } = useUiStore();

  if (!toastMessage) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const bgMap = {
    success: "border-emerald-500/30 bg-emerald-950/20",
    error: "border-rose-500/30 bg-rose-950/20",
    info: "border-blue-500/30 bg-blue-950/20"
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in-up">
      <div
        className={`glass-panel border flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-sm ${bgMap[toastType]}`}
      >
        <div className="flex-shrink-0">{iconMap[toastType]}</div>
        <p className="text-sm font-medium text-slate-200 pr-4">{toastMessage}</p>
        <button
          onClick={hideToast}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-white/5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
