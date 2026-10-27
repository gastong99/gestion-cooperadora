import { useState, useEffect } from 'react';
import { Edit2, Check, FolderOpen } from 'lucide-react';
import { MESES } from '../types';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext,
  | 'montos'
  | 'anioSeleccionado'
  | 'editandoMontos'
  | 'setEditandoMontos'
  | 'cargarDatos'
  | 'toast'
>;

const Configuracion = ({
  montos,
  anioSeleccionado,
  editandoMontos,
  setEditandoMontos,
  cargarDatos,
  toast,
}: Props) => {
  const [montosEditables, setMontosEditables] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const obj: { [key: string]: number } = {};
    montos.forEach(m => { obj[m.mes] = m.monto; });
    setMontosEditables(obj);
  }, [montos]);

  const guardarMontos = async () => {
    try {
      for (const mes of MESES) {
        if (montosEditables[mes] !== undefined) {
          await window.electronAPI.updateMonto(mes, anioSeleccionado, montosEditables[mes]);
        }
      }
      await cargarDatos();
      setEditandoMontos(false);
      toast('Montos actualizados correctamente');
    } catch (error) {
      console.error('Error al guardar montos:', error);
      toast('Error al guardar los montos', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700">
            Monto de Cuota por Mes — Año {anioSeleccionado}
          </h2>
          {!editandoMontos ? (
            <button
              onClick={() => setEditandoMontos(true)}
              className="flex items-center gap-2 bg-[#34477f] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a6b] text-sm"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          ) : (
            <button
              onClick={guardarMontos}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              <Check className="w-4 h-4" /> Guardar cambios
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Se aplica automáticamente al marcar pagos en la planilla.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MESES.map(mes => (
            <div key={mes} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">{mes}</label>
              {editandoMontos ? (
                <input
                  type="number"
                  value={montosEditables[mes] || 0}
                  onChange={e =>
                    setMontosEditables({ ...montosEditables, [mes]: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f]"
                  min="0"
                  step="100"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-800">
                  ${montosEditables[mes]?.toLocaleString('es-AR') || '0'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Carpeta de Comprobantes</h2>
        <p className="text-sm text-gray-500 mb-4">
          Los PDFs se guardan en{' '}
          <code className="bg-gray-100 px-1 rounded">Comprobantes/[Categoría]/[Año]/[Mes]/</code>
        </p>
        <button
          onClick={() => window.electronAPI.abrirCarpetaComprobantes()}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          <FolderOpen className="w-5 h-5" /> Abrir carpeta de comprobantes
        </button>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Importante:</strong> Los cambios en los montos solo afectan a los nuevos pagos.
          Los pagos ya registrados mantienen el monto original.
        </p>
      </div>
    </div>
  );
};

export default Configuracion;