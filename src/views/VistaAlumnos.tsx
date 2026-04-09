import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, RotateCcw, Users } from 'lucide-react';
import CampoError from '../components/ui/CampoError';
import FiltrosBusqueda from '../components/ui/FiltrosBusqueda';
import { validarNombre, validarTelefono, normalizar, inputCls, selectCls } from '../utils/validaciones';
import type { Alumno } from '../types';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext,
  | 'grupos'
  | 'gruposInactivos'
  | 'alumnos'
  | 'setAlumnos'
  | 'alumnosInactivos'
  | 'setAlumnosInactivos'
  | 'familias'
  | 'pagos'
  | 'anioActual'
  | 'toast'
  | 'confirmar'
  | 'cargarDatos'
>;

type FormData = {
  nombre_completo: string;
  telefono: string;
  grupo_id: number;
  familia_id: number | null;
};

type Errores = {
  nombre?: string;
  telefono?: string;
  grupo?: string;
};

const FORM_VACIO: FormData = {
  nombre_completo: '',
  telefono: '',
  grupo_id: 0,
  familia_id: null,
};

const VistaAlumnos = ({
  grupos,
  gruposInactivos,
  alumnos,
  setAlumnos,
  alumnosInactivos,
  setAlumnosInactivos,
  familias,
  pagos,
  anioActual,
  toast,
  confirmar,
  cargarDatos,
}: Props) => {
  const [mostrarForm, setMostrarForm]             = useState(false);
  const [formData, setFormData]                   = useState<FormData>(FORM_VACIO);
  const [erroresForm, setErroresForm]             = useState<Errores>({});
  const [editandoId, setEditandoId]               = useState<number | null>(null);
  const [editandoData, setEditandoData]           = useState<FormData>({ ...FORM_VACIO });
  const [erroresEdicion, setErroresEdicion]       = useState<Errores>({});
  const [mostrarInactivos, setMostrarInactivos]   = useState(false);
  const [filtroGrupo, setFiltroGrupo]             = useState<number | 'todos'>('todos');
  const [busqueda, setBusqueda]                   = useState('');
  const [letraSeleccionada, setLetraSeleccionada] = useState<string | null>(null);

  const letrasConAlumnos = new Set(
    alumnos.filter(a => a.activo === 1).map(a => normalizar(a.nombre_completo)[0]).filter(Boolean)
  );

  const alumnosFiltrados = alumnos.filter(a => {
    if (a.activo !== 1) return false;
    if (filtroGrupo !== 'todos' && a.grupo_id !== filtroGrupo) return false;
    if (busqueda.trim()) return normalizar(a.nombre_completo).includes(normalizar(busqueda));
    if (letraSeleccionada) return normalizar(a.nombre_completo).startsWith(letraSeleccionada);
    return true;
  });

  const validarForm = (data: FormData): Errores => {
    const e: Errores = {};
    const errNombre = validarNombre(data.nombre_completo);
    if (errNombre) e.nombre = errNombre;
    const errTel = validarTelefono(data.telefono);
    if (errTel) e.telefono = errTel;
    if (!data.grupo_id) e.grupo = 'Seleccioná una categoría';
    return e;
  };

  const crearAlumno = async () => {
    const errores = validarForm(formData);
    if (Object.keys(errores).length > 0) { setErroresForm(errores); return; }
    try {
      await window.electronAPI.createAlumno(formData);
      setFormData(FORM_VACIO);
      setErroresForm({});
      setMostrarForm(false);
      await cargarDatos();
      toast('Alumno creado correctamente');
    } catch (error) {
      console.error(error);
      toast('Error al crear el alumno', 'error');
    }
  };

  const iniciarEdicion = (alumno: Alumno) => {
    setEditandoId(alumno.id);
    setErroresEdicion({});
    setEditandoData({
      nombre_completo: alumno.nombre_completo,
      telefono: alumno.telefono || '',
      grupo_id: alumno.grupo_id,
      familia_id: alumno.familia_id ?? null,
    });
  };

  const guardarEdicion = async () => {
    const errores = validarForm(editandoData);
    if (Object.keys(errores).length > 0) { setErroresEdicion(errores); return; }
    if (editandoId === null) return;
    try {
      await window.electronAPI.updateAlumno(editandoId, editandoData);
      await cargarDatos();
      setEditandoId(null);
      toast('Alumno actualizado correctamente');
    } catch (error) {
      console.error(error);
      toast('Error al guardar los cambios', 'error');
    }
  };

  const desactivarAlumno = (id: number) => {
    confirmar({
      titulo: 'Desactivar alumno',
      mensaje: '¿Desactivar este alumno? Podrás reactivarlo desde "Inactivos".',
      labelConfirmar: 'Desactivar',
      onConfirmar: async () => {
        try {
          await window.electronAPI.deleteAlumno(id);
          const a = alumnos.find(x => x.id === id);
          setAlumnos(prev => prev.filter(x => x.id !== id));
          if (a) setAlumnosInactivos(prev => [...prev, { ...a, activo: 0 }]);
          toast('Alumno desactivado');
        } catch (error) {
          console.error(error);
          toast('Error al desactivar el alumno', 'error');
        }
      },
    });
  };

  const reactivarAlumno = async (id: number) => {
    try {
      await window.electronAPI.reactivarAlumno(id);
      await cargarDatos();
      setAlumnosInactivos(prev => prev.filter(x => x.id !== id));
      toast('Alumno reactivado correctamente');
    } catch (error) {
      console.error(error);
      toast('Error al reactivar el alumno', 'error');
    }
  };

  const eliminarDefinitivo = (id: number) => {
    confirmar({
      titulo: 'Eliminar alumno definitivamente',
      mensaje: '¿Eliminar definitivamente este alumno? Se eliminarán también sus pagos. Esta acción no se puede deshacer.',
      labelConfirmar: 'Eliminar',
      onConfirmar: async () => {
        try {
          await window.electronAPI.eliminarAlumnoDefinitivo(id);
          setAlumnosInactivos(prev => prev.filter(x => x.id !== id));
          toast('Alumno eliminado');
        } catch (error) {
          console.error(error);
          toast('Error al eliminar el alumno', 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Alumnos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              mostrarInactivos
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" /> Inactivos ({alumnosInactivos.length})
          </button>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setErroresForm({}); setFormData(FORM_VACIO); }}
            className="flex items-center gap-2 bg-[#34477f] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a6b]"
          >
            <Plus className="w-5 h-5" /> Nuevo Alumno
          </button>
        </div>
      </div>

      {mostrarForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Alumno</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={e => { setFormData({ ...formData, nombre_completo: e.target.value }); setErroresForm(p => ({ ...p, nombre: undefined })); }}
                placeholder="Apellido y nombre *"
                className={inputCls(erroresForm.nombre)}
                autoFocus
              />
              <CampoError error={erroresForm.nombre} />
            </div>
            <div>
              <input
                type="text"
                value={formData.telefono}
                onChange={e => { setFormData({ ...formData, telefono: e.target.value }); setErroresForm(p => ({ ...p, telefono: undefined })); }}
                placeholder="Teléfono (solo números) *"
                className={inputCls(erroresForm.telefono)}
              />
              <CampoError error={erroresForm.telefono} />
            </div>
            <div>
              <select
                value={formData.grupo_id || ''}
                onChange={e => { setFormData({ ...formData, grupo_id: Number(e.target.value) }); setErroresForm(p => ({ ...p, grupo: undefined })); }}
                className={selectCls(erroresForm.grupo, !formData.grupo_id)}
              >
                <option value="" disabled>-- Seleccione categoría --</option>
                {grupos.map(g => <option key={g.id} value={g.id} className="text-gray-900">{g.nombre}</option>)}
              </select>
              <CampoError error={erroresForm.grupo} />
            </div>
            <div>
              <select
                value={formData.familia_id ?? ''}
                onChange={e => setFormData({ ...formData, familia_id: e.target.value ? Number(e.target.value) : null })}
                className={selectCls(undefined, !formData.familia_id)}
              >
                <option value="">-- Sin grupo familiar --</option>
                {familias.map(f => <option key={f.id} value={f.id} className="text-gray-900">{f.nombre}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">* Campos obligatorios</p>
          <div className="flex gap-2">
            <button onClick={crearAlumno} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Guardar</button>
            <button onClick={() => { setMostrarForm(false); setErroresForm({}); }} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtro por categoría */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Categoría:</span>
        <button
          onClick={() => setFiltroGrupo('todos')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filtroGrupo === 'todos' ? 'bg-[#34477f] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {grupos.map(g => (
          <button
            key={g.id}
            onClick={() => setFiltroGrupo(g.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroGrupo === g.id ? 'bg-[#34477f] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {g.nombre}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <FiltrosBusqueda
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          letraSeleccionada={letraSeleccionada}
          setLetraSeleccionada={setLetraSeleccionada}
          letrasConAlumnos={letrasConAlumnos}
        />
      </div>

      {(busqueda || letraSeleccionada) && (
        <p className="text-sm text-gray-500">
          {alumnosFiltrados.length} resultado{alumnosFiltrados.length !== 1 ? 's' : ''} encontrado{alumnosFiltrados.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Tabla de alumnos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Grupo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Familia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pagos {anioActual}</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alumnosFiltrados.map(alumno => {
              const grupo        = grupos.find(g => g.id === alumno.grupo_id);
              const cantPagos    = pagos.filter(p => p.alumno_id === alumno.id && p.anio === anioActual).length;
              const estaEditando = editandoId === alumno.id;

              return (
                <tr key={alumno.id} className={`hover:bg-gray-50 ${estaEditando ? 'bg-[#f0f3fa]' : ''}`}>
                  {estaEditando ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editandoData.nombre_completo}
                          onChange={e => { setEditandoData({ ...editandoData, nombre_completo: e.target.value }); setErroresEdicion(p => ({ ...p, nombre: undefined })); }}
                          className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-[#34477f] text-sm ${erroresEdicion.nombre ? 'border-red-400 bg-red-50' : 'border-[#34477f]'}`}
                          autoFocus
                        />
                        <CampoError error={erroresEdicion.nombre} />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editandoData.grupo_id || ''}
                          onChange={e => { setEditandoData({ ...editandoData, grupo_id: Number(e.target.value) }); setErroresEdicion(p => ({ ...p, grupo: undefined })); }}
                          className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-[#34477f] text-sm ${erroresEdicion.grupo ? 'border-red-400 bg-red-50' : 'border-[#34477f]'}`}
                        >
                          <option value="" disabled>-- Seleccione categoría --</option>
                          {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                        </select>
                        <CampoError error={erroresEdicion.grupo} />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editandoData.telefono}
                          onChange={e => { setEditandoData({ ...editandoData, telefono: e.target.value }); setErroresEdicion(p => ({ ...p, telefono: undefined })); }}
                          className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-[#34477f] text-sm ${erroresEdicion.telefono ? 'border-red-400 bg-red-50' : 'border-[#34477f]'}`}
                        />
                        <CampoError error={erroresEdicion.telefono} />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editandoData.familia_id ?? ''}
                          onChange={e => setEditandoData({ ...editandoData, familia_id: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-1.5 border border-[#34477f] rounded focus:outline-none focus:ring-1 focus:ring-[#34477f] text-sm"
                        >
                          <option value="">-- Sin grupo familiar --</option>
                          {familias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">—</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={guardarEdicion} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                            <Check className="w-3.5 h-3.5" /> Guardar
                          </button>
                          <button onClick={() => setEditandoId(null)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400">
                            <X className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium">{alumno.nombre_completo}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{grupo?.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{alumno.telefono || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {alumno.familia_nombre
                          ? <span className="flex items-center gap-1 text-pink-500"><Users className="w-3 h-3 text-pink-500" />{alumno.familia_nombre}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {cantPagos}/9 meses
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => iniciarEdicion(alumno)} className="p-1.5 text-gray-400 hover:text-[#34477f] rounded" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => desactivarAlumno(alumno.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Desactivar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {alumnosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                  {busqueda || letraSeleccionada
                    ? 'No se encontraron alumnos con ese criterio de búsqueda.'
                    : 'No hay alumnos para mostrar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Panel inactivos */}
      {mostrarInactivos && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Alumnos inactivos
          </h3>
          {alumnosInactivos.length === 0 ? (
            <p className="text-sm text-amber-700">No hay alumnos inactivos.</p>
          ) : (
            <div className="space-y-2">
              {alumnosInactivos.map(alumno => {
                const grupo = [...grupos, ...gruposInactivos].find(g => g.id === alumno.grupo_id);
                return (
                  <div key={alumno.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-amber-200">
                    <div>
                      <span className="text-gray-500 line-through text-sm">{alumno.nombre_completo}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        ({grupo ? grupo.nombre : 'grupo eliminado'})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => reactivarAlumno(alumno.id)} className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200">
                        <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                      </button>
                      <button onClick={() => eliminarDefinitivo(alumno.id)} className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VistaAlumnos;