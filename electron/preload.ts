import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  // ===== GRUPOS =====
  getGrupos:               ()                                        => ipcRenderer.invoke('get-grupos'),
  getGruposInactivos:      ()                                        => ipcRenderer.invoke('get-grupos-inactivos'),
  createGrupo:             (nombre: string)                          => ipcRenderer.invoke('create-grupo', nombre),
  updateGrupo:             (id: number, nombre: string)              => ipcRenderer.invoke('update-grupo', id, nombre),
  deleteGrupo:             (id: number)                              => ipcRenderer.invoke('delete-grupo', id),
  reactivarGrupo:          (id: number)                              => ipcRenderer.invoke('reactivar-grupo', id),
  eliminarGrupoDefinitivo: (id: number)                              => ipcRenderer.invoke('eliminar-grupo-definitivo', id),

  // ===== FAMILIAS =====
  getFamilias:               ()                           => ipcRenderer.invoke('get-familias'),
  createFamilia:             (nombre: string)             => ipcRenderer.invoke('create-familia', nombre),
  updateFamilia:             (id: number, nombre: string) => ipcRenderer.invoke('update-familia', id, nombre),
  deleteFamilia:             (id: number)                 => ipcRenderer.invoke('delete-familia', id),
  eliminarFamiliaDefinitivo: (id: number)                 => ipcRenderer.invoke('eliminar-familia-definitivo', id),

  // ===== ALUMNOS =====
  getAlumnos:               ()                      => ipcRenderer.invoke('get-alumnos'),
  getAlumnosInactivos:      ()                      => ipcRenderer.invoke('get-alumnos-inactivos'),
  getAlumnosByGrupo:        (grupoId: number)       => ipcRenderer.invoke('get-alumnos-by-grupo', grupoId),
  createAlumno:             (data: any)             => ipcRenderer.invoke('create-alumno', data),
  updateAlumno:             (id: number, data: any) => ipcRenderer.invoke('update-alumno', id, data),
  deleteAlumno:             (id: number)            => ipcRenderer.invoke('delete-alumno', id),
  reactivarAlumno:          (id: number)            => ipcRenderer.invoke('reactivar-alumno', id),
  eliminarAlumnoDefinitivo: (id: number)            => ipcRenderer.invoke('eliminar-alumno-definitivo', id),

  // ===== PAGOS =====
  getPagos:         ()                 => ipcRenderer.invoke('get-pagos'),
  getPagosByAlumno: (alumnoId: number) => ipcRenderer.invoke('get-pagos-by-alumno', alumnoId),
  createPago:       (data: any)        => ipcRenderer.invoke('create-pago', data),
  deletePago:       (id: number)       => ipcRenderer.invoke('delete-pago', id),
  marcarEnviado:    (id: number)       => ipcRenderer.invoke('marcar-enviado', id),

  // ===== CONFIGURACIÓN DE MONTOS =====
  getMontos:   (anio: number)                             => ipcRenderer.invoke('get-montos', anio),
  updateMonto: (mes: string, anio: number, monto: number) => ipcRenderer.invoke('update-monto', mes, anio, monto),

  // ===== CONFIGURACIÓN GENERAL =====
  getConfig: (clave: string)                => ipcRenderer.invoke('get-config', clave),
  setConfig: (clave: string, valor: string) => ipcRenderer.invoke('set-config', clave, valor),

  // ===== PDFs =====
  generarComprobante:       (pagoId: number)              => ipcRenderer.invoke('generar-comprobante', pagoId),
  abrirCarpetaComprobantes: (anio?: number, mes?: string) => ipcRenderer.invoke('abrir-carpeta-comprobantes', anio, mes),
  abrirCarpetaPago:         (grupoNombre: string, anio: number, mes: string) => ipcRenderer.invoke('abrir-carpeta-pago', grupoNombre, anio, mes),

  // ===== WHATSAPP =====
  abrirWhatsApp: (telefono: string) => ipcRenderer.invoke('abrir-whatsapp', telefono),

});