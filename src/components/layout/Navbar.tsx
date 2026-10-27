import { Settings, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Vista } from '../../hooks/useApp';

interface Props {
  vistaActual: string;
  setVistaActual: (v: Vista) => void;
  anioSeleccionado: number;
  setAnioSeleccionado: (anio: number) => void;
  anioActual: number;
}

const NAV_ITEMS: { id: Vista; label: string }[] = [
  { id: 'dashboard',     label: 'Panel Principal' },
  { id: 'grupos',        label: 'Grupos' },
  { id: 'alumnos',       label: 'Alumnos' },
  { id: 'familias',      label: 'Familias' },
  { id: 'planilla',      label: 'Planilla' },
  { id: 'reportes',      label: 'Reportes' },
  { id: 'configuracion', label: 'Configuración' },
];

const ANIO_MINIMO = 2025;

const Navbar = ({ vistaActual, setVistaActual, anioSeleccionado, setAnioSeleccionado, anioActual }: Props) => (
  <nav className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center h-24">

        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <img
            src="assets/logo.png"
            alt="Logo"
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-gray-800">Gestión de Cooperadora</span>
            <span className="text-xs text-gray-500">Esc. Municipal de Danzas Folklóricas San Fco.</span>

            {/* Selector de año */}
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => setAnioSeleccionado(anioSeleccionado - 1)}
                disabled={anioSeleccionado <= ANIO_MINIMO}
                className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Año anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>

              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                anioSeleccionado === anioActual
                  ? 'text-[#34477f]'
                  : 'text-amber-600 bg-amber-50 border border-amber-200'
              }`}>
                {anioSeleccionado}
              </span>

              <button
                onClick={() => setAnioSeleccionado(anioSeleccionado + 1)}
                disabled={anioSeleccionado >= anioActual}
                className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Año siguiente"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              {anioSeleccionado !== anioActual && (
                <button
                  onClick={() => setAnioSeleccionado(anioActual)}
                  className="text-xs text-amber-600 hover:text-amber-700 underline ml-1"
                  title="Volver al año actual"
                >
                  Volver a {anioActual}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex gap-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setVistaActual(id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                vistaActual === id
                  ? 'bg-[#e8ecf5] text-[#34477f] font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {id === 'configuracion' ? (
                <span className="flex items-center gap-1">
                  <Settings className="w-4 h-4" /> {label}
                </span>
              ) : id === 'familias' ? (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-pink-500" /> {label}
                </span>
              ) : (
                label
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  </nav>
);

export default Navbar;