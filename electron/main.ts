import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import path from 'path';
import { initDatabase, getDatabase, closeDatabase } from './database/db';
import { generarComprobantePDF, abrirCarpetaComprobantes } from './pdf/generator';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Elimina el menú nativo (File / Edit / View / Window / Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Pagos Cooperadora',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/assets/icon.png'),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // Zoom con Ctrl + scroll y Ctrl + teclas (+, -, 0)
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.type === 'keyDown') {
      if (input.key === '=' || input.key === '+') {
        const current = mainWindow!.webContents.getZoomFactor();
        mainWindow!.webContents.setZoomFactor(Math.min(current + 0.1, 3));
      }
      if (input.key === '-') {
        const current = mainWindow!.webContents.getZoomFactor();
        mainWindow!.webContents.setZoomFactor(Math.max(current - 0.1, 0.3));
      }
      if (input.key === '0') {
        mainWindow!.webContents.setZoomFactor(1);
      }
    }
  });

  mainWindow.webContents.on('zoom-changed', (_event, direction) => {
    const current = mainWindow!.webContents.getZoomFactor();
    if (direction === 'in') {
      mainWindow!.webContents.setZoomFactor(Math.min(current + 0.1, 3));
    } else {
      mainWindow!.webContents.setZoomFactor(Math.max(current - 0.1, 0.3));
    }
  });
};

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});

// ========== IPC HANDLERS ==========

const setupIpcHandlers = () => {
  const db = getDatabase();

  // ===== GRUPOS =====

  ipcMain.handle('get-grupos', () =>
    db.prepare('SELECT * FROM grupos WHERE activo = 1 ORDER BY nombre').all()
  );

  ipcMain.handle('get-grupos-inactivos', () =>
    db.prepare('SELECT * FROM grupos WHERE activo = 0 ORDER BY nombre').all()
  );

  ipcMain.handle('create-grupo', (_event, nombre: string) => {
    const result = db.prepare('INSERT INTO grupos (nombre) VALUES (?)').run(nombre);
    return { id: result.lastInsertRowid, nombre, activo: 1 };
  });

  ipcMain.handle('update-grupo', (_event, id: number, nombre: string) => {
    db.prepare('UPDATE grupos SET nombre = ? WHERE id = ?').run(nombre, id);
    return { id, nombre };
  });

  ipcMain.handle('delete-grupo', (_event, id: number) => {
    db.prepare('UPDATE grupos SET activo = 0 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('reactivar-grupo', (_event, id: number) => {
    db.prepare('UPDATE grupos SET activo = 1 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('eliminar-grupo-definitivo', (_event, id: number) => {
    db.prepare('DELETE FROM grupos WHERE id = ?').run(id);
    return { success: true };
  });

  // ===== FAMILIAS =====

  ipcMain.handle('get-familias', () =>
    db.prepare('SELECT * FROM familias WHERE activo = 1 ORDER BY nombre').all()
  );

  ipcMain.handle('create-familia', (_event, nombre: string) => {
    const result = db.prepare('INSERT INTO familias (nombre) VALUES (?)').run(nombre);
    return { id: result.lastInsertRowid, nombre, activo: 1 };
  });

  ipcMain.handle('update-familia', (_event, id: number, nombre: string) => {
    db.prepare('UPDATE familias SET nombre = ? WHERE id = ?').run(nombre, id);
    return { id, nombre };
  });

  ipcMain.handle('delete-familia', (_event, id: number) => {
    db.prepare('UPDATE alumnos SET familia_id = NULL WHERE familia_id = ?').run(id);
    db.prepare('UPDATE familias SET activo = 0 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('eliminar-familia-definitivo', (_event, id: number) => {
    db.prepare('UPDATE alumnos SET familia_id = NULL WHERE familia_id = ?').run(id);
    db.prepare('DELETE FROM familias WHERE id = ?').run(id);
    return { success: true };
  });

  // ===== ALUMNOS =====

  ipcMain.handle('get-alumnos', () =>
    db.prepare(`
      SELECT a.*, g.nombre as grupo_nombre, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.activo = 1
      ORDER BY g.nombre, a.nombre_completo
    `).all()
  );

  ipcMain.handle('get-alumnos-inactivos', () =>
    db.prepare(`
      SELECT a.*, g.nombre as grupo_nombre, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.activo = 0
      ORDER BY a.nombre_completo
    `).all()
  );

  ipcMain.handle('get-alumnos-by-grupo', (_event, grupoId: number) =>
    db.prepare(`
      SELECT a.*, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.grupo_id = ? AND a.activo = 1
      ORDER BY a.nombre_completo
    `).all(grupoId)
  );

  ipcMain.handle('create-alumno', (_event, data: any) => {
    const result = db.prepare(
      'INSERT INTO alumnos (nombre_completo, telefono, grupo_id, familia_id) VALUES (?, ?, ?, ?)'
    ).run(data.nombre_completo, data.telefono || null, data.grupo_id, data.familia_id || null);
    return { id: result.lastInsertRowid, ...data, activo: 1 };
  });

  ipcMain.handle('update-alumno', (_event, id: number, data: any) => {
    db.prepare(
      'UPDATE alumnos SET nombre_completo = ?, telefono = ?, grupo_id = ?, familia_id = ? WHERE id = ?'
    ).run(data.nombre_completo, data.telefono || null, data.grupo_id, data.familia_id || null, id);
    return { id, ...data };
  });

  ipcMain.handle('delete-alumno', (_event, id: number) => {
    db.prepare('UPDATE alumnos SET activo = 0 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('reactivar-alumno', (_event, id: number) => {
    db.prepare('UPDATE alumnos SET activo = 1 WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('eliminar-alumno-definitivo', (_event, id: number) => {
    db.prepare('DELETE FROM pagos WHERE alumno_id = ?').run(id);
    db.prepare('DELETE FROM alumnos WHERE id = ?').run(id);
    return { success: true };
  });

  // ===== PAGOS =====

  ipcMain.handle('get-pagos', () =>
    db.prepare(`
      SELECT p.*, a.nombre_completo as alumno_nombre, a.grupo_id
      FROM pagos p
      LEFT JOIN alumnos a ON p.alumno_id = a.id
      ORDER BY p.fecha_pago DESC
    `).all()
  );

  ipcMain.handle('get-pagos-by-alumno', (_event, alumnoId: number) =>
    db.prepare('SELECT * FROM pagos WHERE alumno_id = ? ORDER BY anio, mes').all(alumnoId)
  );

  ipcMain.handle('create-pago', (_event, data: any) => {
    // ── Lógica de bonificación familiar ─────────────────────────────────
    let bonificado = 0;
    let montoFinal = data.monto;

    const alumno = db.prepare(
      'SELECT familia_id FROM alumnos WHERE id = ?'
    ).get(data.alumno_id) as { familia_id: number | null } | undefined;

    if (alumno?.familia_id) {
      const hermanos = db.prepare(`
        SELECT id FROM alumnos
        WHERE familia_id = ? AND id != ? AND activo = 1
      `).all(alumno.familia_id, data.alumno_id) as { id: number }[];

      if (hermanos.length > 0) {
        const pagosFamiliaEsteMes = db.prepare(`
          SELECT COUNT(*) as count FROM pagos
          WHERE alumno_id IN (${hermanos.map(() => '?').join(',')})
            AND mes = ? AND anio = ? AND bonificado = 0
        `).get(
          ...hermanos.map(h => h.id),
          data.mes,
          data.anio
        ) as { count: number } | undefined;

        if ((pagosFamiliaEsteMes?.count ?? 0) >= 2) {
          bonificado = 1;
          montoFinal = 0;
        }
      }
    }

    // ── Número de comprobante ────────────────────────────────────────────
    const config = db.prepare(
      'SELECT valor FROM configuracion WHERE clave = ?'
    ).get('ultimo_numero_comprobante') as { valor: string };
    const nuevoNumero = parseInt(config.valor) + 1;
    db.prepare(
      'UPDATE configuracion SET valor = ? WHERE clave = ?'
    ).run(nuevoNumero.toString(), 'ultimo_numero_comprobante');

    const result = db.prepare(`
      INSERT INTO pagos (alumno_id, mes, anio, monto, bonificado, numero_comprobante)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.alumno_id, data.mes, data.anio, montoFinal, bonificado, nuevoNumero);

    return {
      id: result.lastInsertRowid,
      ...data,
      monto: montoFinal,
      bonificado,
      numero_comprobante: nuevoNumero,
      fecha_pago: new Date().toISOString(),
    };
  });

  ipcMain.handle('delete-pago', (_event, id: number) => {
    db.prepare('DELETE FROM pagos WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('marcar-enviado', (_event, id: number) => {
    db.prepare('UPDATE pagos SET enviado = 1 WHERE id = ?').run(id);
    return { success: true };
  });

  // ===== CONFIGURACIÓN DE MONTOS =====

  ipcMain.handle('get-montos', (_event, anio: number) =>
    db.prepare('SELECT * FROM configuracion_montos WHERE anio = ? ORDER BY mes').all(anio)
  );

  ipcMain.handle('update-monto', (_event, mes: string, anio: number, monto: number) => {
    db.prepare(`
      INSERT INTO configuracion_montos (mes, anio, monto)
      VALUES (?, ?, ?)
      ON CONFLICT(mes, anio) DO UPDATE SET monto = ?, fecha_modificacion = CURRENT_TIMESTAMP
    `).run(mes, anio, monto, monto);
    return { mes, anio, monto };
  });

  // ===== CONFIGURACIÓN GENERAL =====

  ipcMain.handle('get-config', (_event, clave: string) => {
    const result = db.prepare(
      'SELECT valor FROM configuracion WHERE clave = ?'
    ).get(clave) as { valor: string } | undefined;
    return result?.valor ?? null;
  });

  ipcMain.handle('set-config', (_event, clave: string, valor: string) => {
    db.prepare(`
      INSERT INTO configuracion (clave, valor)
      VALUES (?, ?)
      ON CONFLICT(clave) DO UPDATE SET valor = ?
    `).run(clave, valor, valor);
    return { clave, valor };
  });

  // ===== PDFs =====

  ipcMain.handle('generar-comprobante', async (_event, pagoId: number) => {
    try {
      const pago = db.prepare(`
        SELECT
          p.id,
          p.numero_comprobante,
          p.mes,
          p.anio,
          p.monto,
          p.bonificado,
          p.fecha_pago,
          a.nombre_completo as alumno_nombre,
          g.nombre as grupo_nombre
        FROM pagos p
        JOIN alumnos a ON p.alumno_id = a.id
        JOIN grupos g ON a.grupo_id = g.id
        WHERE p.id = ?
      `).get(pagoId) as {
        id: number;
        numero_comprobante: number;
        mes: string;
        anio: number;
        monto: number;
        bonificado: number;
        fecha_pago: string;
        alumno_nombre: string;
        grupo_nombre: string;
      } | undefined;

      if (!pago) {
        return { ok: false, error: `No se encontró el pago con id ${pagoId}` };
      }

      const fecha = new Date(pago.fecha_pago);
      const fechaFormateada = fecha.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });

      const rutaArchivo = await generarComprobantePDF({
        numeroComprobante: pago.numero_comprobante,
        nombreAlumno: pago.alumno_nombre,
        grupo: `Folklore - ${pago.grupo_nombre}`,
        grupoNombre: pago.grupo_nombre,
        mes: pago.mes,
        anio: pago.anio,
        monto: pago.monto,
        bonificado: pago.bonificado === 1,
        fechaPago: fechaFormateada,
      });

      return { ok: true, ruta: rutaArchivo };

    } catch (error: any) {
      console.error('Error generando comprobante PDF:', error);
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('abrir-carpeta-comprobantes', (_event, anio?: number, mes?: string) => {
    try {
      abrirCarpetaComprobantes(anio, mes);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  // ===== WHATSAPP =====

  ipcMain.handle('abrir-whatsapp', (_event, telefono: string) => {
    try {
      const limpio = telefono.replace(/[\s\-().]/g, '').replace(/^0/, '');
      const url = `https://wa.me/549${limpio}`;
      shell.openExternal(url);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  });

  // ===== ABRIR CARPETA DE PAGO ESPECÍFICO =====

  ipcMain.handle('abrir-carpeta-pago', async (_event, grupoNombre: string, anio: number, mes: string) => {
    try {
      const base = app.isPackaged
        ? path.dirname(app.getPath('exe'))
        : process.cwd();

      const sanitizar = (nombre: string) =>
        nombre
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9 _-]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50);

      const carpeta = path.join(base, 'Comprobantes', sanitizar(grupoNombre), String(anio), mes);
      console.log('📂 Abriendo carpeta:', carpeta);
      fs.mkdirSync(carpeta, { recursive: true });
      const resultado = await shell.openPath(carpeta);
      if (resultado) {
        console.error('Error al abrir carpeta:', resultado);
        return { ok: false, error: resultado };
      }
      return { ok: true };
    } catch (error: any) {
      console.error('Error en abrir-carpeta-pago:', error);
      return { ok: false, error: error.message };
    }
  });
};