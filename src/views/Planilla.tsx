import { useState } from 'react';
import { FolderOpen, Check, Users, Archive } from 'lucide-react';
import { MESES } from '../types';
import FiltrosBusqueda from '../components/ui/FiltrosBusqueda';
import { normalizar } from '../utils/validaciones';
import type { Alumno } from '../types';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext,
  | 'grupos'
  | 'alumnos'
  | 'familias'
  | 'anioSeleccionado'
  | 'generandoPDF'
  | 'getPago'
  | 'getMontoPorMes'
  | 'togglePago'
>;

const Planilla = ({
  grupos,
  alumnos,
  familias,
  anioSeleccionado,
  generandoPDF,
  getPago,
  getMontoPorMes,
  togglePago,
}: Props) => {
  const [busqueda, setBusqueda]                   = useState('');
  const [letraSeleccionada, setLetraSeleccionada] = useState<string | null>(null);
  const [filtroGrupo, setFiltroGrupo]             = useState<number | 'todos'>('todos');

  const letrasConAlumnos = new Set(
    alumnos.filter(a => a.activo === 1).map(a => normalizar(a.nombre_completo)[0]).filter(Boolean)
  );

  const filtrarAlumnos = (lista: Alumno[]) => {
    if (busqueda.trim()) return lista.filter(a => normalizar(a.nombre_completo).includes(normalizar(busqueda)));
    if (letraSeleccionada) return lista.filter(a => normalizar(a.nombre_completo).startsWith(letraSeleccionada));
    return lista;
  };

  const gruposFiltrados = filtroGrupo === 'todos' ? grupos : grupos.filter(g => g.id === filtroGrupo);

  const totalFiltrados = gruposFiltrados.reduce((acc, g) => {
    return acc + filtrarAlumnos(alumnos.filter(a => a.grupo_id === g.id && a.activo === 1)).length;
  }, 0);

  const abrirCarpetaAnio = () => {
    window.electronAPI.abrirCarpetaComprobantes(anioSeleccionado);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Planilla de Pagos {anioSeleccionado}
        </h1>
        <div className="flex gap-2">
          {/* Botón carpeta del año — para archivar o mover los PDF */}
          <button
            onClick={abrirCarpetaAnio}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 text-sm font-medium"
            title={`Abrir carpeta de comprobantes ${anioSeleccionado}`}
          >
            <Archive className="w-4 h-4" />
            Carpeta {anioSeleccionado}
          </button>
          {/* Botón carpeta general */}
          <button
            onClick={() => window.electronAPI.abrirCarpetaComprobantes()}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
          >
            <FolderOpen className="w-4 h-4" /> Ver comprobantes
          </button>
        </div>
      </div>

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

      {/* Búsqueda y filtro por letra */}
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
          {totalFiltrados} alumno{totalFiltrados !== 1 ? 's' : ''} encontrado{totalFiltrados !== 1 ? 's' : ''}
        </p>
      )}

      {/* Tablas por grupo */}
      {gruposFiltrados.map(grupo => {
        const alumnosGrupo   = alumnos.filter(a => a.grupo_id === grupo.id && a.activo === 1);
        const alumnosMostrar = filtrarAlumnos(alumnosGrupo);

        if ((busqueda || letraSeleccionada) && alumnosMostrar.length === 0) return null;

        if (alumnosGrupo.length === 0) return (
          <div key={grupo.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-600 mb-1">{grupo.nombre}</h3>
            <p className="text-sm text-gray-400">No hay alumnos activos en este grupo.</p>
          </div>
        );

        return (
          <div key={grupo.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-[#f0f3fa] px-4 py-2 border-b border-[#c0cae8] flex items-center justify-between">
              <h3 className="font-semibold text-[#34477f]">{grupo.nombre}</h3>
              {(busqueda || letraSeleccionada) && (
                <span className="text-xs text-gray-400">{alumnosMostrar.length} de {alumnosGrupo.length}</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[200px]">
                      Alumno
                    </th>
                    {MESES.map(mes => (
                      <th key={mes} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 min-w-[72px]">
                        <div>{mes}</div>
                        <div className="text-xs font-normal text-gray-400">
                          ${getMontoPorMes(mes).toLocaleString('es-AR')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alumnosMostrar.map(alumno => {
                    const familia = alumno.familia_id
                      ? familias.find(f => f.id === alumno.familia_id)
                      : null;
                    return (
                      <tr key={alumno.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sticky left-0 bg-white">
                          <div className="text-sm font-medium">{alumno.nombre_completo}</div>
                          {familia && (
                            <div className="flex items-center gap-1 text-xs text-pink-500 mt-0.5">
                              <Users className="w-3 h-3 text-pink-500" /> {familia.nombre}
                            </div>
                          )}
                          {generandoPDF === alumno.id && (
                            <div className="text-xs text-purple-500 animate-pulse mt-0.5">
                              Generando PDF...
                            </div>
                          )}
                          {alumno.telefono && (
                            <button
                              onClick={() => window.electronAPI.abrirWhatsApp(alumno.telefono!)}
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                              title={`Abrir WhatsApp de ${alumno.nombre_completo}`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.528 5.855L.057 23.982l6.284-1.648A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.368l-.359-.214-3.728.977.995-3.638-.234-.373A9.818 9.818 0 1112 21.818z"/>
                              </svg>
                              WhatsApp
                            </button>
                          )}
                        </td>
                        {MESES.map(mes => {
                          const pago          = getPago(alumno.id, mes);
                          const pagado        = !!pago;
                          const bonificado    = pago?.bonificado === 1;
                          const estaGenerando = generandoPDF === alumno.id;
                          return (
                            <td key={mes} className="px-3 py-3 text-center">
                              <button
                                onClick={() => togglePago(alumno.id, mes)}
                                disabled={estaGenerando}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors mx-auto
                                  ${bonificado
                                    ? 'bg-green-200 text-green-700 hover:bg-green-300'
                                    : pagado
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                  ${estaGenerando ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={
                                  bonificado
                                    ? 'Bonificación familiar — click para desmarcar'
                                    : pagado
                                    ? 'Click para desmarcar'
                                    : 'Click para marcar y generar comprobante'
                                }
                              >
                                {bonificado
                                  ? <Users className="w-4 h-4 text-pink-500" />
                                  : pagado
                                  ? <Check className="w-5 h-5" />
                                  : '–'}
                              </button>
                              {pagado && (
                                <button
                                  onClick={() =>
                                    window.electronAPI.abrirCarpetaPago(grupo.nombre, anioSeleccionado, mes)
                                  }
                                  className="mt-1 text-xs text-[#34477f] hover:text-[#2a3a6b] hover:underline"
                                  title={`Abrir carpeta del comprobante de ${mes}`}
                                >
                                  Ver PDF
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-800">
          <strong>📄 Comprobantes automáticos:</strong> Al marcar un pago se genera el PDF en{' '}
          <code className="bg-purple-100 px-1 rounded">Comprobantes/[Categoría]/</code>
        </p>
      </div>
    </div>
  );
};

export default Planilla;