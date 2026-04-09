import { AlertTriangle } from 'lucide-react';
import type { ModalConfirmConfig } from '../../utils/validaciones';

interface Props {
  config: ModalConfirmConfig;
  onCancelar: () => void;
}

const ModalConfirm = ({ config, onCancelar }: Props) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onCancelar} />
    <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-10">
      <div className="flex items-start gap-4 mb-5">
        <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{config.titulo}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{config.mensaje}</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancelar}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => { config.onConfirmar(); onCancelar(); }}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {config.labelConfirmar ?? 'Confirmar'}
        </button>
      </div>
    </div>
  </div>
);

export default ModalConfirm;