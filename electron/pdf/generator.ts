import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface ComprobanteData {
  numeroComprobante: number;
  nombreAlumno: string;
  grupo: string;       // Display final: "Folklore - Infantil"
  grupoNombre: string; // Nombre de la categoría: "Infantil", "Pre juvenil", etc.
  mes: string;
  anio: number;
  monto: number;
  bonificado: boolean;
  fechaPago: string;
}

function getCarpetaBase(): string {
  const base = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : process.cwd();
  return path.join(base, 'Comprobantes');
}

function sanitizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

export function getRutaComprobante(data: ComprobanteData): string {
  // Estructura: Comprobantes/[Categoría]/[Año]/[Mes]/[Alumno]_[Mes]_N[00001].pdf
  const categoria = sanitizarNombre(data.grupoNombre);
  const carpeta   = path.join(getCarpetaBase(), categoria, String(data.anio), data.mes);
  const nombre    = sanitizarNombre(data.nombreAlumno);
  const numStr    = String(data.numeroComprobante).padStart(5, '0');
  const archivo   = `${nombre}_${data.mes}_N${numStr}.pdf`;
  return path.join(carpeta, archivo);
}

export async function generarComprobantePDF(data: ComprobanteData): Promise<string> {
  const rutaCompleta = getRutaComprobante(data);
  const carpeta = path.dirname(rutaCompleta);
  fs.mkdirSync(carpeta, { recursive: true });

  const { jsPDF } = require('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6',
  });

  const W = 105;
  const H = 148;
  const M = 7;
  const ANCHO = W - M * 2;

  const AZUL_PRIN = [52, 71, 127]   as [number, number, number];
  const AZUL_OSC  = [40, 55, 100]   as [number, number, number];
  const AZUL_CLAR = [208, 215, 235] as [number, number, number];
  const AZUL_TEXT = [170, 185, 220] as [number, number, number];

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...AZUL_PRIN);
  doc.rect(0, 0, W, 26, 'F');
  doc.setFillColor(...AZUL_OSC);
  doc.rect(0, 19, W, 7, 'F');

  const logoPath = app.isPackaged
    ? path.join(process.resourcesPath, 'public', 'assets', 'logo.png')
    : path.join(process.cwd(), 'public', 'assets', 'logo.png');
  const logoExiste = fs.existsSync(logoPath);
  if (logoExiste) {
    const logoData = fs.readFileSync(logoPath).toString('base64');
    doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', M, 2, 14, 14);
  }

  const TX = logoExiste ? M + 16 : M;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('COOPERADORA', TX, 9);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...AZUL_TEXT);
  doc.text('Esc. Municipal de Danzas Folklóricas San Fco.', TX, 15);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('COMPROBANTE DE PAGO', M, 23);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...AZUL_TEXT);
  doc.text(`Fecha: ${data.fechaPago}`, W - M, 23, { align: 'right' });

  // ── Campos ──────────────────────────────────────────────────────────────
  let y = 35;
  const ROW_H = 12;

  const dibujarCampo = (label: string, valor: string, fondo: boolean) => {
    if (fondo) {
      doc.setFillColor(...AZUL_CLAR);
      doc.roundedRect(M, y - 3.5, ANCHO, ROW_H, 1.5, 1.5, 'F');
    }
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...AZUL_PRIN);
    doc.text(label, M + 2, y + 0.5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 30, 60);
    doc.text(valor, M + 2, y + 7);
    y += ROW_H + 2;
  };

  dibujarCampo('ALUMNO / ALUMNA', data.nombreAlumno, true);
  dibujarCampo('GRUPO',           data.grupo,         false);
  dibujarCampo('MES PAGADO',      `${data.mes} ${data.anio}`, true);

  // ── Bloque monto (o bonificado) ──────────────────────────────────────────
  y += 2;

  if (data.bonificado) {
    const VERDE_CLAR = [187, 247, 208] as [number, number, number];
    doc.setFillColor(22, 163, 74);
    doc.roundedRect(M, y, ANCHO, 22, 2, 2, 'F');
    doc.setTextColor(...VERDE_CLAR);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('BONIFICACIÓN FAMILIAR', W / 2, y + 7, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SIN COSTO', W / 2, y + 17, { align: 'center' });
  } else {
    doc.setFillColor(...AZUL_PRIN);
    doc.roundedRect(M, y, ANCHO, 22, 2, 2, 'F');
    doc.setTextColor(...AZUL_TEXT);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('MONTO ABONADO', W / 2, y + 7, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${data.monto.toLocaleString('es-AR')}`, W / 2, y + 17, { align: 'center' });
  }

  y += 28;

  // ── Separador ───────────────────────────────────────────────────────────
  doc.setDrawColor(...AZUL_CLAR);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  // ── Nota ────────────────────────────────────────────────────────────────
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140, 160, 190);
  doc.text('Este comprobante certifica el pago realizado.', W / 2, y, { align: 'center' });

  y += 8;

  // ── Pie ──────────────────────────────────────────────────────────────────
  doc.setFillColor(240, 245, 252);
  doc.rect(0, y, W, 8, 'F');
  doc.setFontSize(5.5);
  doc.setTextColor(150, 170, 200);
  const ahora = new Date();
  doc.text(
    `Generado el ${ahora.toLocaleDateString('es-AR')} a las ${ahora.toLocaleTimeString('es-AR')}`,
    W / 2, y + 5, { align: 'center' }
  );

  const buffer = Buffer.from(doc.output('arraybuffer') as ArrayBuffer);
  fs.writeFileSync(rutaCompleta, buffer);

  return rutaCompleta;
}

export function abrirCarpetaComprobantes(anio?: number, mes?: string): void {
  let carpeta = getCarpetaBase();
  if (anio) carpeta = path.join(carpeta, String(anio));
  if (mes)  carpeta = path.join(carpeta, mes);
  fs.mkdirSync(carpeta, { recursive: true });

  const { shell } = require('electron');
  shell.openPath(carpeta);
}