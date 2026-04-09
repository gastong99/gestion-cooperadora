import { useState } from 'react';
import { Plus, Edit2, Check, X, Users, Trash2 } from 'lucide-react';
import CampoError from '../components/ui/CampoError';
import { validarNombreGrupo, inputCls } from '../utils/validaciones';
import type { Familia } from '../types';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext,
  | 'familias'
  | 'setFamilias'
  | 'alumnos'
  | 'grupos'
  | 'toast'
  | 'confirmar'
  | 'cargarDatos'
>;

const VistaFamilias = ({
  familias,
  setFamilias,
  alumnos,
  grupos,
  toast,
  confirmar,
  cargarDatos,
}: Props) => {
  const [mostrarForm, setMostrarForm]       = useState(false);
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [errorNuevo, setErrorNuevo]         = useState<string | undefined>();
  const [editandoId, setEditandoId]         = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [errorEdicion, setErrorEdicion]     = useState<string | undefined>();

  const crearFamilia = async () => {
    const err = validarNombreGrupo(nuevoNombre);
    if (err) { setErrorNuevo(err); return; }
    try {
      const familia = await window.electronAPI.createFamilia(nuevoNombre.trim());
      setFamilias(prev => [...prev, familia]);
      setNuevoNombre('');
      setErrorNuevo(undefined);
      setMostrarForm(false);
      toast('Grupo familiar creado');
    } catch (error) {
      console.error(error);
      toast('Error al crear el grupo familiar', 'error');
    }
  };

  const iniciarEdicion = (f: Familia) => {
    setEditandoId(f.id);
    setEditandoNombre(f.nombre);
    setErrorEdicion(undefined);
  };

  const guardarEdicion = async () => {
    const err = validarNombreGrupo(editandoNombre);
    if (err) { setErrorEdicion(err); return; }
    if (editandoId === null) return;
    try {
      await window.electronAPI.updateFamilia(editandoId, editandoNombre.trim());
      setFamilias(prev =>
        prev.map(f => f.id === editandoId ? { ...f, nombre: editandoNombre.trim() } : f)
      );
      setEditandoId(null);
      toast('Grupo familiar actualizado');
    } catch (error) {
      console.error(error);
      toast('Error al actualizar el grupo familiar', 'error');
    }
  };

  const eliminarFamilia = (id: number) => {
    confirmar({
      titulo: 'Eliminar grupo familiar',
      mensaje: '¿Eliminar este grupo familiar? Los alumnos asignados quedarán sin familia.',
      labelConfirmar: 'Eliminar',
      onConfirmar: async () => {
        try {
          await window.electronAPI.eliminarFamiliaDefinitivo(id);
          setFamilias(prev => prev.filter(f => f.id !== id));
          await cargarDatos();
          toast('Grupo familiar eliminado');
        } catch (error) {
          console.error(error);
          toast('Error al eliminar el grupo familiar', 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Grupos Familiares</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 bg-[#34477f] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a6b]"
        >
          <Plus className="w-5 h-5" /> Nueva Familia
        </button>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-sm text-pink-800">
        <strong>💡 Descuento familiar:</strong> Si 3 o más miembros de una misma familia están
        inscriptos en Folklore, solo 2 pagan la cuota. El tercer pago (y siguientes) se marcan
        automáticamente como bonificados al registrar el pago.
      </div>

      {mostrarForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Grupo Familiar</h3>
          <div className="flex gap-3 items-start">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={nuevoNombre}
                onChange={e => { setNuevoNombre(e.target.value); setErrorNuevo(undefined); }}
                placeholder='Ej: "Familia González"'
                className={inputCls(errorNuevo)}
                onKeyDown={e => e.key === 'Enter' && crearFamilia()}
                autoFocus
              />
              <CampoError error={errorNuevo} />
            </div>
            <button onClick={crearFamilia} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Guardar
            </button>
            <button
              onClick={() => { setMostrarForm(false); setErrorNuevo(undefined); }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {familias.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
          No hay grupos familiares creados todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familias.map(familia => {
            const miembros = alumnos.filter(a => a.familia_id === familia.id && a.activo === 1);
            return (
              <div key={familia.id} className="bg-white p-5 rounded-lg border border-gray-200">
                {editandoId === familia.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editandoNombre}
                      onChange={e => { setEditandoNombre(e.target.value); setErrorEdicion(undefined); }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f] ${
                        errorEdicion ? 'border-red-400 bg-red-50' : 'border-[#34477f]'
                      }`}
                      onKeyDown={e => {
                        if (e.key === 'Enter') guardarEdicion();
                        if (e.key === 'Escape') setEditandoId(null);
                      }}
                      autoFocus
                    />
                    <CampoError error={errorEdicion} />
                    <div className="flex gap-2">
                      <button onClick={guardarEdicion} className="flex items-center gap-1 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">
                        <Check className="w-4 h-4" /> Guardar
                      </button>
                      <button onClick={() => setEditandoId(null)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-400">
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-gray-800">{familia.nombre}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => iniciarEdicion(familia)}
                          className="p-1.5 text-gray-400 hover:text-[#34477f] rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarFamilia(familia.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} activo{miembros.length !== 1 ? 's' : ''}
                    </p>
                    {miembros.length > 0 && (
                      <ul className="space-y-1">
                        {miembros.map(a => {
                          const grupo = grupos.find(g => g.id === a.grupo_id);
                          return (
                            <li key={a.id} className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-300 inline-block" />
                              {a.nombre_completo}{' '}
                              <span className="text-gray-400">({grupo?.nombre})</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {miembros.length >= 3 && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded px-3 py-1.5 text-xs text-green-700">
                        ✓ Descuento familiar activo
                      </div>
                    )}
                    {miembros.length === 2 && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5 text-xs text-yellow-700">
                        Falta 1 miembro para activar el descuento
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VistaFamilias;