import type { Grupo, Alumno, Pago, ConfiguracionMonto, Familia } from './types';

declare global {
  interface Window {
    electronAPI: {
      // Grupos
      getGrupos:               ()                             => Promise<Grupo[]>;
      getGruposInactivos:      ()                             => Promise<Grupo[]>;
      createGrupo:             (nombre: string)               => Promise<Grupo>;
      updateGrupo:             (id: number, nombre: string)   => Promise<Grupo>;
      deleteGrupo:             (id: number)                   => Promise<{ success: boolean }>;
      reactivarGrupo:          (id: number)                   => Promise<{ success: boolean }>;
      eliminarGrupoDefinitivo: (id: number)                   => Promise<{ success: boolean }>;

      // Familias
      getFamilias:               ()                           => Promise<Familia[]>;
      createFamilia:             (nombre: string)             => Promise<Familia>;
      updateFamilia:             (id: number, nombre: string) => Promise<Familia>;
      deleteFamilia:             (id: number)                 => Promise<{ success: boolean }>;
      eliminarFamiliaDefinitivo: (id: number)                 => Promise<{ success: boolean }>;

      // Alumnos
      getAlumnos:               ()                        => Promise<Alumno[]>;
      getAlumnosInactivos:      ()                        => Promise<Alumno[]>;
      getAlumnosByGrupo:        (grupoId: number)         => Promise<Alumno[]>;
      createAlumno:             (data: any)               => Promise<Alumno>;
      updateAlumno:             (id: number, data: any)   => Promise<Alumno>;
      deleteAlumno:             (id: number)              => Promise<{ success: boolean }>;
      reactivarAlumno:          (id: number)              => Promise<{ success: boolean }>;
      eliminarAlumnoDefinitivo: (id: number)              => Promise<{ success: boolean }>;

      // Pagos
      getPagos:         ()                 => Promise<Pago[]>;
      getPagosByAlumno: (alumnoId: number) => Promise<Pago[]>;
      createPago:       (data: any)        => Promise<Pago>;
      deletePago:       (id: number)       => Promise<{ success: boolean }>;
      marcarEnviado:    (id: number)       => Promise<{ success: boolean }>;

      // Configuración de montos
      getMontos:   (anio: number)                             => Promise<ConfiguracionMonto[]>;
      updateMonto: (mes: string, anio: number, monto: number) => Promise<ConfiguracionMonto>;

      // Configuración general
      getConfig: (clave: string)                => Promise<string | null>;
      setConfig: (clave: string, valor: string) => Promise<{ clave: string; valor: string }>;

      // PDFs
      generarComprobante:       (pagoId: number)              => Promise<{ ok: boolean; ruta?: string; error?: string }>;
      abrirCarpetaComprobantes: (anio?: number, mes?: string)                    => Promise<{ ok: boolean }>;
      abrirCarpetaPago:         (grupoNombre: string, anio: number, mes: string) => Promise<{ ok: boolean; error?: string }>;

      // WhatsApp
      abrirWhatsApp: (telefono: string) => Promise<{ ok: boolean; error?: string }>;
    };
  }
}