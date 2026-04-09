export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export const validarNombre = (valor: string): string | undefined => {
  const limpio = valor.trim();
  if (!limpio) return 'El nombre es obligatorio';
  if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+(\s+[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)+$/.test(limpio))
    return 'Ingresá apellido y nombre, solo letras (ej: García Juan)';
  return undefined;
};

export const validarTelefono = (valor: string): string | undefined => {
  const limpio = valor.trim();
  if (!limpio) return 'El teléfono es obligatorio';
  if (!/^\d+$/.test(limpio)) return 'Solo se permiten números';
  if (limpio.length < 7) return 'El teléfono debe tener al menos 7 dígitos';
  return undefined;
};

export const validarNombreGrupo = (valor: string): string | undefined => {
  const limpio = valor.trim();
  if (!limpio) return 'El nombre del grupo es obligatorio';
  if (limpio.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(limpio)) return 'Solo se permiten letras y espacios';
  return undefined;
};

// Tipos compartidos para UI
export type ToastTipo = 'exito' | 'error' | 'info';

export interface ToastItem {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
}

export interface ModalConfirmConfig {
  titulo: string;
  mensaje: string;
  labelConfirmar?: string;
  onConfirmar: () => void;
}

// Clases CSS reutilizables
export const inputCls = (error?: string) =>
  `px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f] w-full text-sm ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;

export const selectCls = (error?: string, sinValor?: boolean) =>
  `px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34477f] w-full text-sm ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  } ${sinValor ? 'text-gray-400' : 'text-gray-900'}`;