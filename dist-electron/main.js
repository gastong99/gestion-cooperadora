"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const createTables = (db2) => {
  db2.exec(`
    CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db2.exec(`
    CREATE TABLE IF NOT EXISTS familias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db2.exec(`
    CREATE TABLE IF NOT EXISTS alumnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_completo TEXT NOT NULL,
      telefono TEXT,
      grupo_id INTEGER NOT NULL,
      familia_id INTEGER,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grupo_id) REFERENCES grupos(id),
      FOREIGN KEY (familia_id) REFERENCES familias(id)
    )
  `);
  db2.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_montos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha_modificacion TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mes, anio)
    )
  `);
  db2.exec(`
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id INTEGER NOT NULL,
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      monto REAL NOT NULL,
      bonificado INTEGER DEFAULT 0,
      fecha_pago TEXT DEFAULT CURRENT_TIMESTAMP,
      numero_comprobante INTEGER NOT NULL UNIQUE,
      ruta_pdf TEXT,
      enviado INTEGER DEFAULT 0,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
      UNIQUE(alumno_id, mes, anio)
    )
  `);
  db2.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);
  const columnas = (tabla) => db2.prepare(`PRAGMA table_info(${tabla})`).all().map((c) => c.name);
  if (!columnas("alumnos").includes("familia_id")) {
    db2.exec(`ALTER TABLE alumnos ADD COLUMN familia_id INTEGER REFERENCES familias(id)`);
    console.log("✅ Migración: columna familia_id agregada a alumnos");
  }
  if (!columnas("pagos").includes("bonificado")) {
    db2.exec(`ALTER TABLE pagos ADD COLUMN bonificado INTEGER DEFAULT 0`);
    console.log("✅ Migración: columna bonificado agregada a pagos");
  }
  const config = db2.prepare("SELECT COUNT(*) as count FROM configuracion").get();
  if (config.count === 0) {
    const insert = db2.prepare("INSERT INTO configuracion (clave, valor) VALUES (?, ?)");
    insert.run("nombre_instituto", "Cooperadora Danzas");
    insert.run("ultimo_numero_comprobante", "1000");
    insert.run("anio_actual", "2026");
    insert.run("ruta_comprobantes", "Comprobantes");
  }
  const checkMonto = db2.prepare("SELECT COUNT(*) as count FROM configuracion_montos WHERE anio = 2026").get();
  if (checkMonto.count === 0) {
    const meses = ["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];
    const insertMonto = db2.prepare("INSERT INTO configuracion_montos (mes, anio, monto) VALUES (?, ?, ?)");
    meses.forEach((mes) => insertMonto.run(mes, 2026, 5e3));
  }
  const checkGrupos = db2.prepare("SELECT COUNT(*) as count FROM grupos").get();
  if (checkGrupos.count === 0) {
    const insertGrupo = db2.prepare("INSERT INTO grupos (nombre) VALUES (?)");
    insertGrupo.run("Pre infantil");
    insertGrupo.run("Infantil");
    insertGrupo.run("Pre juvenil");
    insertGrupo.run("Adultos iniciales");
    insertGrupo.run("Adultos intermedios");
    insertGrupo.run("Adultos avanzados");
    console.log("✅ Grupos por defecto insertados");
  }
  console.log("✅ Base de datos inicializada correctamente");
};
const Database = require("better-sqlite3");
let db = null;
const initDatabase = () => {
  try {
    const userDataPath = electron.app.getPath("userData");
    const dbPath = path.join(userDataPath, "cooperadora.db");
    console.log("📁 Ruta de la base de datos:", dbPath);
    db = new Database(dbPath);
    db.pragma("foreign_keys = ON");
    createTables(db);
    console.log("✅ Base de datos conectada correctamente");
    return db;
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
    throw error;
  }
};
const getDatabase = () => {
  if (!db) {
    throw new Error("Base de datos no inicializada. Llamá a initDatabase() primero.");
  }
  return db;
};
const closeDatabase = () => {
  if (db) {
    db.close();
    console.log("🔒 Base de datos cerrada");
  }
};
function getCarpetaBase() {
  const base = electron.app.isPackaged ? path__namespace.dirname(electron.app.getPath("exe")) : process.cwd();
  return path__namespace.join(base, "Comprobantes");
}
function sanitizarNombre(nombre) {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").substring(0, 50);
}
function getRutaComprobante(data) {
  const categoria = sanitizarNombre(data.grupoNombre);
  const carpeta = path__namespace.join(getCarpetaBase(), categoria, String(data.anio), data.mes);
  const nombre = sanitizarNombre(data.nombreAlumno);
  const numStr = String(data.numeroComprobante).padStart(5, "0");
  const archivo = `${nombre}_${data.mes}_N${numStr}.pdf`;
  return path__namespace.join(carpeta, archivo);
}
async function generarComprobantePDF(data) {
  const rutaCompleta = getRutaComprobante(data);
  const carpeta = path__namespace.dirname(rutaCompleta);
  fs__namespace.mkdirSync(carpeta, { recursive: true });
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6"
  });
  const W = 105;
  const M = 7;
  const ANCHO = W - M * 2;
  const AZUL_PRIN = [52, 71, 127];
  const AZUL_OSC = [40, 55, 100];
  const AZUL_CLAR = [208, 215, 235];
  const AZUL_TEXT = [170, 185, 220];
  doc.setFillColor(...AZUL_PRIN);
  doc.rect(0, 0, W, 26, "F");
  doc.setFillColor(...AZUL_OSC);
  doc.rect(0, 19, W, 7, "F");
  const logoPath = electron.app.isPackaged ? path__namespace.join(process.resourcesPath, "public", "assets", "logo.png") : path__namespace.join(process.cwd(), "public", "assets", "logo.png");
  const logoExiste = fs__namespace.existsSync(logoPath);
  if (logoExiste) {
    const logoData = fs__namespace.readFileSync(logoPath).toString("base64");
    doc.addImage(`data:image/png;base64,${logoData}`, "PNG", M, 2, 14, 14);
  }
  const TX = logoExiste ? M + 16 : M;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text("COOPERADORA", TX, 9);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...AZUL_TEXT);
  doc.text("Esc. Municipal de Danzas Folklóricas San Fco.", TX, 15);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("COMPROBANTE DE PAGO", M, 23);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...AZUL_TEXT);
  doc.text(`Fecha: ${data.fechaPago}`, W - M, 23, { align: "right" });
  let y = 35;
  const ROW_H = 12;
  const dibujarCampo = (label, valor, fondo) => {
    if (fondo) {
      doc.setFillColor(...AZUL_CLAR);
      doc.roundedRect(M, y - 3.5, ANCHO, ROW_H, 1.5, 1.5, "F");
    }
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...AZUL_PRIN);
    doc.text(label, M + 2, y + 0.5);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 60);
    doc.text(valor, M + 2, y + 7);
    y += ROW_H + 2;
  };
  dibujarCampo("ALUMNO / ALUMNA", data.nombreAlumno, true);
  dibujarCampo("GRUPO", data.grupo, false);
  dibujarCampo("MES PAGADO", `${data.mes} ${data.anio}`, true);
  y += 2;
  if (data.bonificado) {
    const VERDE_CLAR = [187, 247, 208];
    doc.setFillColor(22, 163, 74);
    doc.roundedRect(M, y, ANCHO, 22, 2, 2, "F");
    doc.setTextColor(...VERDE_CLAR);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("BONIFICACIÓN FAMILIAR", W / 2, y + 7, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SIN COSTO", W / 2, y + 17, { align: "center" });
  } else {
    doc.setFillColor(...AZUL_PRIN);
    doc.roundedRect(M, y, ANCHO, 22, 2, 2, "F");
    doc.setTextColor(...AZUL_TEXT);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("MONTO ABONADO", W / 2, y + 7, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`$${data.monto.toLocaleString("es-AR")}`, W / 2, y + 17, { align: "center" });
  }
  y += 28;
  doc.setDrawColor(...AZUL_CLAR);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(140, 160, 190);
  doc.text("Este comprobante certifica el pago realizado.", W / 2, y, { align: "center" });
  y += 8;
  doc.setFillColor(240, 245, 252);
  doc.rect(0, y, W, 8, "F");
  doc.setFontSize(5.5);
  doc.setTextColor(150, 170, 200);
  const ahora = /* @__PURE__ */ new Date();
  doc.text(
    `Generado el ${ahora.toLocaleDateString("es-AR")} a las ${ahora.toLocaleTimeString("es-AR")}`,
    W / 2,
    y + 5,
    { align: "center" }
  );
  const buffer = Buffer.from(doc.output("arraybuffer"));
  fs__namespace.writeFileSync(rutaCompleta, buffer);
  return rutaCompleta;
}
function abrirCarpetaComprobantes(anio, mes) {
  let carpeta = getCarpetaBase();
  if (anio) carpeta = path__namespace.join(carpeta, String(anio));
  if (mes) carpeta = path__namespace.join(carpeta, mes);
  fs__namespace.mkdirSync(carpeta, { recursive: true });
  const { shell } = require("electron");
  shell.openPath(carpeta);
}
let mainWindow = null;
const createWindow = () => {
  electron.Menu.setApplicationMenu(null);
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    title: "Pagos Cooperadora",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, "../public/assets/icon.png")
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.control && input.type === "keyDown") {
      if (input.key === "=" || input.key === "+") {
        const current = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3));
      }
      if (input.key === "-") {
        const current = mainWindow.webContents.getZoomFactor();
        mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.3));
      }
      if (input.key === "0") {
        mainWindow.webContents.setZoomFactor(1);
      }
    }
  });
  mainWindow.webContents.on("zoom-changed", (_event, direction) => {
    const current = mainWindow.webContents.getZoomFactor();
    if (direction === "in") {
      mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3));
    } else {
      mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.3));
    }
  });
};
electron.app.whenReady().then(() => {
  initDatabase();
  createWindow();
  setupIpcHandlers();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  closeDatabase();
  if (process.platform !== "darwin") electron.app.quit();
});
const setupIpcHandlers = () => {
  const db2 = getDatabase();
  electron.ipcMain.handle(
    "get-grupos",
    () => db2.prepare("SELECT * FROM grupos WHERE activo = 1 ORDER BY nombre").all()
  );
  electron.ipcMain.handle(
    "get-grupos-inactivos",
    () => db2.prepare("SELECT * FROM grupos WHERE activo = 0 ORDER BY nombre").all()
  );
  electron.ipcMain.handle("create-grupo", (_event, nombre) => {
    const result = db2.prepare("INSERT INTO grupos (nombre) VALUES (?)").run(nombre);
    return { id: result.lastInsertRowid, nombre, activo: 1 };
  });
  electron.ipcMain.handle("update-grupo", (_event, id, nombre) => {
    db2.prepare("UPDATE grupos SET nombre = ? WHERE id = ?").run(nombre, id);
    return { id, nombre };
  });
  electron.ipcMain.handle("delete-grupo", (_event, id) => {
    db2.prepare("UPDATE grupos SET activo = 0 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("reactivar-grupo", (_event, id) => {
    db2.prepare("UPDATE grupos SET activo = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("eliminar-grupo-definitivo", (_event, id) => {
    db2.prepare("DELETE FROM grupos WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle(
    "get-familias",
    () => db2.prepare("SELECT * FROM familias WHERE activo = 1 ORDER BY nombre").all()
  );
  electron.ipcMain.handle("create-familia", (_event, nombre) => {
    const result = db2.prepare("INSERT INTO familias (nombre) VALUES (?)").run(nombre);
    return { id: result.lastInsertRowid, nombre, activo: 1 };
  });
  electron.ipcMain.handle("update-familia", (_event, id, nombre) => {
    db2.prepare("UPDATE familias SET nombre = ? WHERE id = ?").run(nombre, id);
    return { id, nombre };
  });
  electron.ipcMain.handle("delete-familia", (_event, id) => {
    db2.prepare("UPDATE alumnos SET familia_id = NULL WHERE familia_id = ?").run(id);
    db2.prepare("UPDATE familias SET activo = 0 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("eliminar-familia-definitivo", (_event, id) => {
    db2.prepare("UPDATE alumnos SET familia_id = NULL WHERE familia_id = ?").run(id);
    db2.prepare("DELETE FROM familias WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle(
    "get-alumnos",
    () => db2.prepare(`
      SELECT a.*, g.nombre as grupo_nombre, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.activo = 1
      ORDER BY g.nombre, a.nombre_completo
    `).all()
  );
  electron.ipcMain.handle(
    "get-alumnos-inactivos",
    () => db2.prepare(`
      SELECT a.*, g.nombre as grupo_nombre, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.activo = 0
      ORDER BY a.nombre_completo
    `).all()
  );
  electron.ipcMain.handle(
    "get-alumnos-by-grupo",
    (_event, grupoId) => db2.prepare(`
      SELECT a.*, f.nombre as familia_nombre
      FROM alumnos a
      LEFT JOIN familias f ON a.familia_id = f.id
      WHERE a.grupo_id = ? AND a.activo = 1
      ORDER BY a.nombre_completo
    `).all(grupoId)
  );
  electron.ipcMain.handle("create-alumno", (_event, data) => {
    const result = db2.prepare(
      "INSERT INTO alumnos (nombre_completo, telefono, grupo_id, familia_id) VALUES (?, ?, ?, ?)"
    ).run(data.nombre_completo, data.telefono || null, data.grupo_id, data.familia_id || null);
    return { id: result.lastInsertRowid, ...data, activo: 1 };
  });
  electron.ipcMain.handle("update-alumno", (_event, id, data) => {
    db2.prepare(
      "UPDATE alumnos SET nombre_completo = ?, telefono = ?, grupo_id = ?, familia_id = ? WHERE id = ?"
    ).run(data.nombre_completo, data.telefono || null, data.grupo_id, data.familia_id || null, id);
    return { id, ...data };
  });
  electron.ipcMain.handle("delete-alumno", (_event, id) => {
    db2.prepare("UPDATE alumnos SET activo = 0 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("reactivar-alumno", (_event, id) => {
    db2.prepare("UPDATE alumnos SET activo = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("eliminar-alumno-definitivo", (_event, id) => {
    db2.prepare("DELETE FROM pagos WHERE alumno_id = ?").run(id);
    db2.prepare("DELETE FROM alumnos WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle(
    "get-pagos",
    () => db2.prepare(`
      SELECT p.*, a.nombre_completo as alumno_nombre, a.grupo_id
      FROM pagos p
      LEFT JOIN alumnos a ON p.alumno_id = a.id
      ORDER BY p.fecha_pago DESC
    `).all()
  );
  electron.ipcMain.handle(
    "get-pagos-by-alumno",
    (_event, alumnoId) => db2.prepare("SELECT * FROM pagos WHERE alumno_id = ? ORDER BY anio, mes").all(alumnoId)
  );
  electron.ipcMain.handle("create-pago", (_event, data) => {
    let bonificado = 0;
    let montoFinal = data.monto;
    const alumno = db2.prepare(
      "SELECT familia_id FROM alumnos WHERE id = ?"
    ).get(data.alumno_id);
    if (alumno == null ? void 0 : alumno.familia_id) {
      const hermanos = db2.prepare(`
        SELECT id FROM alumnos
        WHERE familia_id = ? AND id != ? AND activo = 1
      `).all(alumno.familia_id, data.alumno_id);
      if (hermanos.length > 0) {
        const pagosFamiliaEsteMes = db2.prepare(`
          SELECT COUNT(*) as count FROM pagos
          WHERE alumno_id IN (${hermanos.map(() => "?").join(",")})
            AND mes = ? AND anio = ? AND bonificado = 0
        `).get(
          ...hermanos.map((h) => h.id),
          data.mes,
          data.anio
        );
        if (((pagosFamiliaEsteMes == null ? void 0 : pagosFamiliaEsteMes.count) ?? 0) >= 2) {
          bonificado = 1;
          montoFinal = 0;
        }
      }
    }
    const config = db2.prepare(
      "SELECT valor FROM configuracion WHERE clave = ?"
    ).get("ultimo_numero_comprobante");
    const nuevoNumero = parseInt(config.valor) + 1;
    db2.prepare(
      "UPDATE configuracion SET valor = ? WHERE clave = ?"
    ).run(nuevoNumero.toString(), "ultimo_numero_comprobante");
    const result = db2.prepare(`
      INSERT INTO pagos (alumno_id, mes, anio, monto, bonificado, numero_comprobante)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.alumno_id, data.mes, data.anio, montoFinal, bonificado, nuevoNumero);
    return {
      id: result.lastInsertRowid,
      ...data,
      monto: montoFinal,
      bonificado,
      numero_comprobante: nuevoNumero,
      fecha_pago: (/* @__PURE__ */ new Date()).toISOString()
    };
  });
  electron.ipcMain.handle("delete-pago", (_event, id) => {
    db2.prepare("DELETE FROM pagos WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle("marcar-enviado", (_event, id) => {
    db2.prepare("UPDATE pagos SET enviado = 1 WHERE id = ?").run(id);
    return { success: true };
  });
  electron.ipcMain.handle(
    "get-montos",
    (_event, anio) => db2.prepare("SELECT * FROM configuracion_montos WHERE anio = ? ORDER BY mes").all(anio)
  );
  electron.ipcMain.handle("update-monto", (_event, mes, anio, monto) => {
    db2.prepare(`
      INSERT INTO configuracion_montos (mes, anio, monto)
      VALUES (?, ?, ?)
      ON CONFLICT(mes, anio) DO UPDATE SET monto = ?, fecha_modificacion = CURRENT_TIMESTAMP
    `).run(mes, anio, monto, monto);
    return { mes, anio, monto };
  });
  electron.ipcMain.handle("get-config", (_event, clave) => {
    const result = db2.prepare(
      "SELECT valor FROM configuracion WHERE clave = ?"
    ).get(clave);
    return (result == null ? void 0 : result.valor) ?? null;
  });
  electron.ipcMain.handle("set-config", (_event, clave, valor) => {
    db2.prepare(`
      INSERT INTO configuracion (clave, valor)
      VALUES (?, ?)
      ON CONFLICT(clave) DO UPDATE SET valor = ?
    `).run(clave, valor, valor);
    return { clave, valor };
  });
  electron.ipcMain.handle("generar-comprobante", async (_event, pagoId) => {
    try {
      const pago = db2.prepare(`
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
      `).get(pagoId);
      if (!pago) {
        return { ok: false, error: `No se encontró el pago con id ${pagoId}` };
      }
      const fecha = new Date(pago.fecha_pago);
      const fechaFormateada = fecha.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
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
        fechaPago: fechaFormateada
      });
      return { ok: true, ruta: rutaArchivo };
    } catch (error) {
      console.error("Error generando comprobante PDF:", error);
      return { ok: false, error: error.message };
    }
  });
  electron.ipcMain.handle("abrir-carpeta-comprobantes", (_event, anio, mes) => {
    try {
      abrirCarpetaComprobantes(anio, mes);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });
  electron.ipcMain.handle("abrir-whatsapp", (_event, telefono) => {
    try {
      const limpio = telefono.replace(/[\s\-().]/g, "").replace(/^0/, "");
      const url = `https://wa.me/549${limpio}`;
      electron.shell.openExternal(url);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });
  electron.ipcMain.handle("abrir-carpeta-pago", async (_event, grupoNombre, anio, mes) => {
    try {
      const base = electron.app.isPackaged ? path.dirname(electron.app.getPath("exe")) : process.cwd();
      const sanitizar = (nombre) => nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").substring(0, 50);
      const carpeta = path.join(base, "Comprobantes", sanitizar(grupoNombre), String(anio), mes);
      console.log("📂 Abriendo carpeta:", carpeta);
      fs.mkdirSync(carpeta, { recursive: true });
      const resultado = await electron.shell.openPath(carpeta);
      if (resultado) {
        console.error("Error al abrir carpeta:", resultado);
        return { ok: false, error: resultado };
      }
      return { ok: true };
    } catch (error) {
      console.error("Error en abrir-carpeta-pago:", error);
      return { ok: false, error: error.message };
    }
  });
};
