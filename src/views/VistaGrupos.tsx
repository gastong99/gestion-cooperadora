import { useState } from 'react';
import { Plus, Edit2, Check, X } from 'lucide-react';
import CampoError from '../components/ui/CampoError';
import { validarNombreGrupo, inputCls } from '../utils/validaciones';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext, 'grupos' | 'setGrupos' | 'alumnos' | 'toast'>;

const VistaGrupos = ({ grupos, setGrupos, alumnos, toast }: Props) => {
  const [mostrarForm, setMostrarForm]       = useState(false);
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [errorNuevo, setErrorNuevo]         = useState<string | undefined>();
  const [editandoId, setEditandoId]         = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [errorEdicion, setErrorEdicion]     = useState<string | undefined>();

  const crearGrupo = async () => {
    const err = validarNombreGrupo(nuevoNombre);
    if (err) { setErrorNuevo(err); return; }
    try {
      const grupo = await window.electronAPI.createGrupo(nuevoNombre.trim());
      setGrupos(prev => [...prev, grupo]);
      setNuevoNombre('');
      setErrorNuevo(undefined);
      setMostrarForm(false);
      toast(`Grupo "${grupo.nombre}" creado correctamente`);
    } catch (error) {
      console.error(error);
      toast('Error al crear el grupo', 'error');
    }
  };

  const iniciarEdicion = (grupo: { id: number; nombre: string }) => {
    setEditandoId(grupo.id);
    setEditandoNombre(grupo.nombre);
    setErrorEdicion(undefined);
  };

  const guardarEdicion = async () => {
    const err = validarNombreGrupo(editandoNombre);
    if (err) { setErrorEdicion(err); return; }
    if (editandoId === null) return;
    try {
      await window.electronAPI.updateGrupo(editandoId, editandoNombre.trim());
      setGrupos(prev =>
        prev.map(g => g.id === editandoId ? { ...g, nombre: editandoNombre.trim() } : g)
      );
      setEditandoId(null);
      toast('Nombre del grupo actualizado correctamente');
    } catch (error) {
      console.error(error);
      toast('Error al actualizar el grupo', 'error');
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setErrorEdicion(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Grupos</h1>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setNuevoNombre(''); setErrorNuevo(undefined); }}
          className="flex items-center gap-2 bg-[#34477f] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a6b]"
        >
          <Plus className="w-5 h-5" /> Nuevo Grupo
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Grupo</h3>
          <div className="flex gap-3 items-start">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={nuevoNombre}
                onChange={e => { setNuevoNombre(e.target.value); setErrorNuevo(undefined); }}
                onKeyDown={e => e.key === 'Enter' && crearGrupo()}
                placeholder="Nombre del grupo (ej: Adultos avanzados)"
                className={inputCls(errorNuevo)}
                autoFocus
              />
              <CampoError error={errorNuevo} />
            </div>
            <button onClick={crearGrupo} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">
              Guardar
            </button>
            <button
              onClick={() => { setMostrarForm(false); setErrorNuevo(undefined); }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-[#34477f]">Folklore</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {grupos.map(grupo => {
          const cant = alumnos.filter(a => a.grupo_id === grupo.id && a.activo === 1).length;
          const estaEditando = editandoId === grupo.id;

          return (
            <div
              key={grupo.id}
              className={`bg-white p-5 rounded-lg border ${estaEditando ? 'border-[#34477f] shadow-sm' : 'border-gray-200'}`}
            >
              {estaEditando ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editandoNombre}
                    onChange={e => { setEditandoNombre(e.target.value); setErrorEdicion(undefined); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') guardarEdicion();
                      if (e.key === 'Escape') cancelarEdicion();
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f] text-sm font-semibold ${
                      errorEdicion ? 'border-red-400 bg-red-50' : 'border-[#34477f]'
                    }`}
                    autoFocus
                  />
                  <CampoError error={errorEdicion} />
                  <div className="flex gap-2">
                    <button onClick={guardarEdicion} className="flex items-center gap-1 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">
                      <Check className="w-3.5 h-3.5" /> Guardar
                    </button>
                    <button onClick={cancelarEdicion} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-400">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{grupo.nombre}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cant} alumno{cant !== 1 ? 's' : ''} activo{cant !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => iniciarEdicion(grupo)}
                    className="p-1.5 text-gray-400 hover:text-[#34477f] rounded transition-colors"
                    title="Editar nombre del grupo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>ℹ️ Nota:</strong> Los grupos no se pueden eliminar desde aquí para evitar perder el
        historial de alumnos y pagos asociados. Si un grupo ya no se usa, desactivá los alumnos
        asignados desde la vista Alumnos.
      </div>
    </div>
  );
};

export default VistaGrupos;