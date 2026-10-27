import { useApp } from './hooks/useApp';
import Navbar from './components/layout/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import ModalConfirm from './components/ui/ModalConfirm';
import Dashboard from './views/Dashboard';
import VistaGrupos from './views/VistaGrupos';
import VistaAlumnos from './views/VistaAlumnos';
import VistaFamilias from './views/VistaFamilias';
import Planilla from './views/Planilla';
import Reportes from './views/Reportes';
import Configuracion from './views/Configuracion';

const App = () => {
  const ctx = useApp();

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer toasts={ctx.toasts} onRemove={ctx.quitarToast} />
      {ctx.modalConfig && (
        <ModalConfirm config={ctx.modalConfig} onCancelar={ctx.cerrarModal} />
      )}

      <Navbar
        vistaActual={ctx.vistaActual}
        setVistaActual={ctx.setVistaActual}
        anioSeleccionado={ctx.anioSeleccionado}
        setAnioSeleccionado={ctx.setAnioSeleccionado}
        anioActual={ctx.anioActual}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {ctx.vistaActual === 'dashboard'     && <Dashboard     grupos={ctx.grupos} alumnos={ctx.alumnos} pagos={ctx.pagos} anioSeleccionado={ctx.anioSeleccionado} calcularEstadisticas={ctx.calcularEstadisticas} />}
        {ctx.vistaActual === 'grupos'        && <VistaGrupos   grupos={ctx.grupos} setGrupos={ctx.setGrupos} alumnos={ctx.alumnos} toast={ctx.toast} />}
        {ctx.vistaActual === 'alumnos'       && <VistaAlumnos  grupos={ctx.grupos} gruposInactivos={ctx.gruposInactivos} alumnos={ctx.alumnos} setAlumnos={ctx.setAlumnos} alumnosInactivos={ctx.alumnosInactivos} setAlumnosInactivos={ctx.setAlumnosInactivos} familias={ctx.familias} pagos={ctx.pagos} anioSeleccionado={ctx.anioSeleccionado} toast={ctx.toast} confirmar={ctx.confirmar} cargarDatos={ctx.cargarDatos} />}
        {ctx.vistaActual === 'familias'      && <VistaFamilias familias={ctx.familias} setFamilias={ctx.setFamilias} alumnos={ctx.alumnos} grupos={ctx.grupos} toast={ctx.toast} confirmar={ctx.confirmar} cargarDatos={ctx.cargarDatos} />}
        {ctx.vistaActual === 'planilla'      && <Planilla      grupos={ctx.grupos} alumnos={ctx.alumnos} familias={ctx.familias} anioSeleccionado={ctx.anioSeleccionado} generandoPDF={ctx.generandoPDF} getPago={ctx.getPago} getMontoPorMes={ctx.getMontoPorMes} togglePago={ctx.togglePago} />}
        {ctx.vistaActual === 'reportes'      && <Reportes      grupos={ctx.grupos} alumnos={ctx.alumnos} pagos={ctx.pagos} anioSeleccionado={ctx.anioSeleccionado} />}
        {ctx.vistaActual === 'configuracion' && <Configuracion montos={ctx.montos} anioSeleccionado={ctx.anioSeleccionado} editandoMontos={ctx.editandoMontos} setEditandoMontos={ctx.setEditandoMontos} cargarDatos={ctx.cargarDatos} toast={ctx.toast} />}
      </main>
    </div>
  );
};

export default App;