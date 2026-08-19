import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFamily();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-[#3525cd] shrink-0" />,
        };

        const borderMap = {
          success: 'border-emerald-200 bg-white/95',
          warning: 'border-amber-200 bg-white/95',
          error: 'border-rose-200 bg-white/95',
          info: 'border-indigo-200 bg-white/95',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border backdrop-blur-md flex items-start justify-between gap-3 animate-in slide-in-from-top-3 duration-200 ${
              borderMap[toast.type]
            }`}
          >
            <div className="flex items-start gap-2.5">
              {iconMap[toast.type]}
              <div>
                <p className="font-heading font-bold text-xs text-slate-900 leading-tight">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{toast.description}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
