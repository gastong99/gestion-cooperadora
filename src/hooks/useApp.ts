import { useState, useEffect, useCallback } from 'react';
import type { Grupo, Alumno, Pago, ConfiguracionMonto, Familia } from '../types';
import type { ToastItem, ToastTipo, ModalConfirmConfig } from '../utils/validaciones';

export type Vista =
  | 'dashboard'
  | 'grupos'
  | 'alumnos'
  | 'familias'
  | 'planilla'
  | 'reportes'
  | 'configuracion';

export const useApp = () => {
  const [vistaActual,       setVistaActual]      = useState<Vista>('dashboard');
  const [grupos,            setGrupos]           = useState<Grupo[]>([]);
  const [alumnos,           setAlumnos]          = useState<Alumno[]>([]);
  const [pagos,             setPagos]            = useState<Pago[]>([]);
  const [montos,            setMontos]           = useState<ConfiguracionMonto[]>([]);
  const [familias,          setFamilias]         = useState<Familia[]>([]);
  const [gruposInactivos,   setGruposInactivos]  = useState<Grupo[]>([]);
  const [alumnosInactivos,  setAlumnosInactivos] = useState<Alumno[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [editandoMontos,    setEditandoMontos]   = useState(false);
  const [generandoPDF,      setGenerandoPDF]     = useState<number | null>(null);
  const [toasts,            setToasts]           = useState<ToastItem[]>([]);
  const [modalConfig,       setModalConfig]      = useState<ModalConfirmConfig | null>(null);

  // Año seleccionado — arranca en el año actual, se puede cambiar
  const anioActual = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toast = useCallback((mensaje: string, tipo: ToastTipo = 'exito') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const quitarToast = (id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  // ── Modal de confirmación ──────────────────────────────────────────────────
  const confirmar = (config: ModalConfirmConfig) => setModalConfig(config);
  const cerrarModal = () => setModalConfig(null);

  // ── Carga de pagos por año ─────────────────────────────────────────────────
  const cargarPagos = useCallback(async () => {
    try {
      const pagosData = await window.electronAPI.getPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    }
  }, []);

  // ── Carga completa de datos ────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const [
        gruposData,
        alumnosData,
        pagosData,
        montosData,
        giData,
        aiData,
        familiasData,
      ] = await Promise.all([
        window.electronAPI.getGrupos(),
        window.electronAPI.getAlumnos(),
        window.electronAPI.getPagos(),
        window.electronAPI.getMontos(anioSeleccionado),
        window.electronAPI.getGruposInactivos(),
        window.electronAPI.getAlumnosInactivos(),
        window.electronAPI.getFamilias(),
      ]);
      setGrupos(gruposData);
      setAlumnos(alumnosData);
      setPagos(pagosData);
      setMontos(montosData);
      setGruposInactivos(giData);
      setAlumnosInactivos(aiData);
      setFamilias(familiasData);
      if (gruposData.length > 0 && !grupoSeleccionado) {
        setGrupoSeleccionado(gruposData[0].id);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anioSeleccionado]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Helpers de pagos ───────────────────────────────────────────────────────
  const getPago = (alumnoId: number, mes: string, anio?: number): Pago | undefined =>
    pagos.find(
      p => p.alumno_id === alumnoId && p.mes === mes && p.anio === (anio ?? anioSeleccionado)
    );

  const getMontoPorMes = (mes: string): number =>
    montos.find(m => m.mes === mes)?.monto ?? 5000;

  const togglePago = async (alumnoId: number, mes: string) => {
    const pagoExistente = getPago(alumnoId, mes);

    if (pagoExistente) {
      confirmar({
        titulo: `Desmarcar pago de ${mes}`,
        mensaje: `El comprobante PDF ya fue generado. Esta acción eliminará el registro del pago pero no borrará el archivo PDF.`,
        labelConfirmar: 'Desmarcar',
        onConfirmar: async () => {
          try {
            await window.electronAPI.deletePago(pagoExistente.id);
            // Actualización local — sin recargar, sin perder scroll
            setPagos(prev => prev.filter(p => p.id !== pagoExistente.id));
            toast('Pago desmarcado correctamente');
          } catch (error) {
            console.error('Error al desmarcar pago:', error);
            toast('Error al desmarcar el pago', 'error');
          }
        },
      });
    } else {
      try {
        const montoMes  = getMontoPorMes(mes);
        const nuevoPago = await window.electronAPI.createPago({
          alumno_id: alumnoId, mes, anio: anioSeleccionado, monto: montoMes,
        });
        // Actualización local — sin recargar, sin perder scroll
        setPagos(prev => [...prev, nuevoPago]);
        setGenerandoPDF(alumnoId);
        const pdfResult = await window.electronAPI.generarComprobante(nuevoPago.id);
        setGenerandoPDF(null);
        if (pdfResult && pdfResult.ok === false) {
          console.warn('PDF no generado:', pdfResult.error);
          toast(`Pago registrado. No se pudo generar el PDF: ${pdfResult.error ?? 'Error desconocido'}`, 'info');
        } else {
          toast(`Pago de ${mes} registrado y comprobante generado`);
        }
      } catch (error) {
        setGenerandoPDF(null);
        console.error('Error en togglePago:', error);
        toast('Error al registrar el pago', 'error');
      }
    }
  };

  // ── Estadísticas para el dashboard ────────────────────────────────────────
  const calcularEstadisticas = () => {
    const totalAlumnos    = alumnos.filter(a => a.activo === 1).length;
    const mesActual       = new Date().toLocaleString('es-AR', { month: 'long' });
    const mesCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
    const pagosMesActual  = pagos.filter(
      p => p.mes === mesCapitalizado && p.anio === anioSeleccionado
    ).length;
    const totalRecaudado  = pagos
      .filter(p => p.anio === anioSeleccionado)
      .reduce((sum, p) => sum + p.monto, 0);
    const alumnosConDeuda = alumnos.filter(a => {
      if (a.activo !== 1) return false;
      return !pagos.some(
        p => p.alumno_id === a.id && p.mes === mesCapitalizado && p.anio === anioSeleccionado
      );
    }).length;
    return { totalAlumnos, pagosMesActual, mesCapitalizado, totalRecaudado, alumnosConDeuda };
  };

  return {
    // Navegación
    vistaActual, setVistaActual,
    // Estado
    grupos,           setGrupos,
    alumnos,          setAlumnos,
    pagos,            setPagos,
    montos,           setMontos,
    familias,         setFamilias,
    gruposInactivos,  setGruposInactivos,
    alumnosInactivos, setAlumnosInactivos,
    grupoSeleccionado,
    editandoMontos,   setEditandoMontos,
    generandoPDF,
    // Año
    anioActual,
    anioSeleccionado, setAnioSeleccionado,
    // Toasts
    toasts, toast, quitarToast,
    // Modal
    modalConfig, confirmar, cerrarModal,
    // Helpers
    cargarDatos,
    cargarPagos,
    getPago,
    getMontoPorMes,
    togglePago,
    calcularEstadisticas,
  };
};

export type AppContext = ReturnType<typeof useApp>;