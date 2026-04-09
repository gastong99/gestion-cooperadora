export const MESES = [
  'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre'
] as const;

export type Mes = typeof MESES[number];

export interface Grupo {
  id: number;
  nombre: string;
  activo: number;
  fecha_creacion?: string;
}

export interface Familia {
  id: number;
  nombre: string;
  activo: number;
  fecha_creacion?: string;
}

export interface Alumno {
  id: number;
  nombre_completo: string;
  telefono?: string;
  grupo_id: number;
  familia_id?: number | null;
  activo: number;
  fecha_creacion?: string;
  // Campos JOIN
  grupo_nombre?: string;
  familia_nombre?: string;
}

export interface Pago {
  id: number;
  alumno_id: number;
  mes: string;
  anio: number;
  monto: number;
  bonificado: number;
  fecha_pago: string;
  numero_comprobante: number;
  ruta_pdf?: string;
  enviado: number;
  // Campos JOIN
  alumno_nombre?: string;
  grupo_id?: number;
}

export interface ConfiguracionMonto {
  id: number;
  mes: string;
  anio: number;
  monto: number;
}