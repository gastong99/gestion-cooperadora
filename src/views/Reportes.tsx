import { Users } from 'lucide-react';
import { MESES } from '../types';
import type { AppContext } from '../hooks/useApp';

type Props = Pick<AppContext, 'grupos' | 'alumnos' | 'pagos' | 'anioSeleccionado'>;

const Reportes = ({ grupos, alumnos, pagos, anioSeleccionado }: Props) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-800">
      Reportes
      {' '}
      <span className="text-xl font-normal text-gray-400">{anioSeleccionado}</span>
    </h1>

    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Balance Mensual {anioSeleccionado}</h2>
      <div className="grid grid-cols-3 gap-4">
        {MESES.map(mes => {
          const pagosMes = pagos.filter(p => p.mes === mes && p.anio === anioSeleccionado);
          const totalMes = pagosMes.reduce((sum, p) => sum + p.monto, 0);
          const bonifs   = pagosMes.filter(p => p.bonificado === 1).length;
          return (
            <div key={mes} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{mes}</p>
              <p className="text-2xl font-bold text-gray-800">${totalMes.toLocaleString('es-AR')}</p>
              <p className="text-xs text-gray-500">{pagosMes.length} pagos</p>
              {bonifs > 0 && (
                <p className="text-xs text-pink-500 mt-0.5 flex items-center gap-1">
                  <Users className="w-3 h-3 text-pink-500" />
                  {bonifs} bonificado{bonifs > 1 ? 's' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-[#34477f]">Alumnos con deuda</h2>
      {grupos.map(grupo => {
        const alumnosGrupo = alumnos.filter(a => a.grupo_id === grupo.id && a.activo === 1);
        const deudores = alumnosGrupo.filter(
          a => pagos.filter(p => p.alumno_id === a.id && p.anio === anioSeleccionado).length < 9
        );
        return (
          <div key={grupo.id} className="mb-4 last:mb-0">
            <h3 className="font-medium text-gray-700 mb-2">{grupo.nombre}</h3>
            {deudores.length > 0 ? (
              <ul className="space-y-1 ml-4">
                {deudores.map(alumno => {
                  const mesesPagados = pagos.filter(
                    p => p.alumno_id === alumno.id && p.anio === anioSeleccionado
                  ).length;
                  return (
                    <li key={alumno.id} className="text-sm text-gray-600">
                      • {alumno.nombre_completo} — {mesesPagados}/9 meses pagados
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-green-600 ml-4">✓ Todos al día</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default Reportes;