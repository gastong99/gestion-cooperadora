import { Check, X, AlertTriangle } from 'lucide-react';
import type { ToastItem } from '../../utils/validaciones';

interface Props {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const ToastContainer = ({ toasts, onRemove }: Props) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto
          transition-all duration-300 min-w-[280px] max-w-[380px]
          ${toast.tipo === 'exito' ? 'bg-green-600 text-white'
            : toast.tipo === 'error' ? 'bg-red-600 text-white'
            : 'bg-gray-800 text-white'}`}
      >
        {toast.tipo === 'exito' && <Check className="w-4 h-4 flex-shrink-0" />}
        {toast.tipo === 'error' && <X className="w-4 h-4 flex-shrink-0" />}
        {toast.tipo === 'info'  && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
        <span className="flex-1">{toast.mensaje}</span>
        <button onClick={() => onRemove(toast.id)} className="opacity-70 hover:opacity-100 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

export default ToastContainer;