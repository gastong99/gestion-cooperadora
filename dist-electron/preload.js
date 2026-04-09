"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // ===== GRUPOS =====
  getGrupos: () => electron.ipcRenderer.invoke("get-grupos"),
  getGruposInactivos: () => electron.ipcRenderer.invoke("get-grupos-inactivos"),
  createGrupo: (nombre) => electron.ipcRenderer.invoke("create-grupo", nombre),
  updateGrupo: (id, nombre) => electron.ipcRenderer.invoke("update-grupo", id, nombre),
  deleteGrupo: (id) => electron.ipcRenderer.invoke("delete-grupo", id),
  reactivarGrupo: (id) => electron.ipcRenderer.invoke("reactivar-grupo", id),
  eliminarGrupoDefinitivo: (id) => electron.ipcRenderer.invoke("eliminar-grupo-definitivo", id),
  // ===== FAMILIAS =====
  getFamilias: () => electron.ipcRenderer.invoke("get-familias"),
  createFamilia: (nombre) => electron.ipcRenderer.invoke("create-familia", nombre),
  updateFamilia: (id, nombre) => electron.ipcRenderer.invoke("update-familia", id, nombre),
  deleteFamilia: (id) => electron.ipcRenderer.invoke("delete-familia", id),
  eliminarFamiliaDefinitivo: (id) => electron.ipcRenderer.invoke("eliminar-familia-definitivo", id),
  // ===== ALUMNOS =====
  getAlumnos: () => electron.ipcRenderer.invoke("get-alumnos"),
  getAlumnosInactivos: () => electron.ipcRenderer.invoke("get-alumnos-inactivos"),
  getAlumnosByGrupo: (grupoId) => electron.ipcRenderer.invoke("get-alumnos-by-grupo", grupoId),
  createAlumno: (data) => electron.ipcRenderer.invoke("create-alumno", data),
  updateAlumno: (id, data) => electron.ipcRenderer.invoke("update-alumno", id, data),
  deleteAlumno: (id) => electron.ipcRenderer.invoke("delete-alumno", id),
  reactivarAlumno: (id) => electron.ipcRenderer.invoke("reactivar-alumno", id),
  eliminarAlumnoDefinitivo: (id) => electron.ipcRenderer.invoke("eliminar-alumno-definitivo", id),
  // ===== PAGOS =====
  getPagos: () => electron.ipcRenderer.invoke("get-pagos"),
  getPagosByAlumno: (alumnoId) => electron.ipcRenderer.invoke("get-pagos-by-alumno", alumnoId),
  createPago: (data) => electron.ipcRenderer.invoke("create-pago", data),
  deletePago: (id) => electron.ipcRenderer.invoke("delete-pago", id),
  marcarEnviado: (id) => electron.ipcRenderer.invoke("marcar-enviado", id),
  // ===== CONFIGURACIÓN DE MONTOS =====
  getMontos: (anio) => electron.ipcRenderer.invoke("get-montos", anio),
  updateMonto: (mes, anio, monto) => electron.ipcRenderer.invoke("update-monto", mes, anio, monto),
  // ===== CONFIGURACIÓN GENERAL =====
  getConfig: (clave) => electron.ipcRenderer.invoke("get-config", clave),
  setConfig: (clave, valor) => electron.ipcRenderer.invoke("set-config", clave, valor),
  // ===== PDFs =====
  generarComprobante: (pagoId) => electron.ipcRenderer.invoke("generar-comprobante", pagoId),
  abrirCarpetaComprobantes: (anio, mes) => electron.ipcRenderer.invoke("abrir-carpeta-comprobantes", anio, mes),
  abrirCarpetaPago: (grupoNombre, anio, mes) => electron.ipcRenderer.invoke("abrir-carpeta-pago", grupoNombre, anio, mes),
  // ===== WHATSAPP =====
  abrirWhatsApp: (telefono) => electron.ipcRenderer.invoke("abrir-whatsapp", telefono)
});
