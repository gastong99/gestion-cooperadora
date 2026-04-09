import { Search, X } from 'lucide-react';
import { LETRAS } from '../../utils/validaciones';

interface Props {
  busqueda: string;
  setBusqueda: (v: string) => void;
  letraSeleccionada: string | null;
  setLetraSeleccionada: (v: string | null) => void;
  letrasConAlumnos: Set<string>;
}

const FiltrosBusqueda = ({
  busqueda,
  setBusqueda,
  letraSeleccionada,
  setLetraSeleccionada,
  letrasConAlumnos,
}: Props) => (
  <div className="space-y-3">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setLetraSeleccionada(null); }}
        placeholder="Buscar por nombre o apellido..."
        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f] text-sm"
      />
      {busqueda && (
        <button
          onClick={() => setBusqueda('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => { setLetraSeleccionada(null); setBusqueda(''); }}
        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
          letraSeleccionada === null && !busqueda
            ? 'bg-[#34477f] text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        Todos
      </button>
      {LETRAS.map(letra => {
        const tieneAlumnos = letrasConAlumnos.has(letra);
        const activa = letraSeleccionada === letra;
        return (
          <button
            key={letra}
            onClick={() => {
              if (!tieneAlumnos) return;
              setBusqueda('');
              setLetraSeleccionada(activa ? null : letra);
            }}
            className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
              activa
                ? 'bg-[#34477f] text-white'
                : tieneAlumnos
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-[#f0f3fa] hover:border-[#34477f]'
                : 'bg-gray-50 border border-gray-200 text-gray-300 cursor-default'
            }`}
          >
            {letra}
          </button>
        );
      })}
    </div>
  </div>
);

export default FiltrosBusqueda;