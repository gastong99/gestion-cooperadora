import { Users, TrendingUp, Check } from 'lucide-react';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext,
  | 'grupos'
  | 'alumnos'
  | 'pagos'
  | 'anioSeleccionado'
  | 'calcularEstadisticas'
>;

const Dashboard = ({ grupos, alumnos, pagos, anioSeleccionado, calcularEstadisticas }: Props) => {
  const stats = calcularEstadisticas();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Panel Principal
        {' '}
        <span className="text-xl font-normal text-gray-400">{anioSeleccionado}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#f0f3fa] p-6 rounded-lg border border-[#c0cae8]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#34477f] font-medium">Total Alumnos</p>
              <p className="text-3xl font-bold text-[#1a2440]">{stats.totalAlumnos}</p>
            </div>
            <Users className="w-12 h-12 text-[#6b82b8]" />
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${stats.pagosMesActual === 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stats.pagosMesActual === 0 ? 'text-amber-600' : 'text-green-600'}`}>
                Pagos {stats.mesCapitalizado}
              </p>
              <p className={`text-3xl font-bold ${stats.pagosMesActual === 0 ? 'text-amber-900' : 'text-green-900'}`}>
                {stats.pagosMesActual}
              </p>
            </div>
            <Check className={`w-12 h-12 ${stats.pagosMesActual === 0 ? 'text-amber-400' : 'text-green-400'}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${stats.alumnosConDeuda > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stats.alumnosConDeuda > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Alumnos con deuda
              </p>
              <p className={`text-3xl font-bold ${stats.alumnosConDeuda > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {stats.alumnosConDeuda}
              </p>
            </div>
            <Users className={`w-12 h-12 ${stats.alumnosConDeuda > 0 ? 'text-red-400' : 'text-green-400'}`} />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Recaudado {anioSeleccionado}</p>
              <p className="text-3xl font-bold text-purple-900">
                ${stats.totalRecaudado.toLocaleString('es-AR')}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-[#34477f]">Folklore — Resumen por categoría</h2>
        {grupos.map(grupo => {
          const alumnosGrupo = alumnos.filter(a => a.grupo_id === grupo.id && a.activo === 1);
          const pagosGrupo   = pagos.filter(p =>
            alumnosGrupo.some(a => a.id === p.alumno_id) && p.anio === anioSeleccionado
          );
          return (
            <div key={grupo.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="text-sm font-medium">{grupo.nombre}</span>
              <div className="flex gap-3">
                <span className="text-xs text-gray-500">{alumnosGrupo.length} alumnos</span>
                <span className="text-xs text-green-600 font-medium">{pagosGrupo.length} pagos</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;