export const createTables = (db: any) => {

  // ── Tablas ───────────────────────────────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS familias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_montos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes TEXT NOT NULL,
      anio INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha_modificacion TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mes, anio)
    )
  `);

  db.exec(`
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);

  // ── Migraciones para BD existente ────────────────────────────────────────

  const columnas = (tabla: string): string[] =>
    (db.prepare(`PRAGMA table_info(${tabla})`).all() as { name: string }[]).map(c => c.name);

  // alumnos → agregar familia_id si no existe
  if (!columnas('alumnos').includes('familia_id')) {
    db.exec(`ALTER TABLE alumnos ADD COLUMN familia_id INTEGER REFERENCES familias(id)`);
    console.log('✅ Migración: columna familia_id agregada a alumnos');
  }

  // pagos → agregar bonificado si no existe
  if (!columnas('pagos').includes('bonificado')) {
    db.exec(`ALTER TABLE pagos ADD COLUMN bonificado INTEGER DEFAULT 0`);
    console.log('✅ Migración: columna bonificado agregada a pagos');
  }

  // ── Datos iniciales ──────────────────────────────────────────────────────

  const config = db.prepare('SELECT COUNT(*) as count FROM configuracion').get() as { count: number };
  if (config.count === 0) {
    const insert = db.prepare('INSERT INTO configuracion (clave, valor) VALUES (?, ?)');
    insert.run('nombre_instituto', 'Cooperadora Danzas');
    insert.run('ultimo_numero_comprobante', '1000');
    insert.run('anio_actual', '2026');
    insert.run('ruta_comprobantes', 'Comprobantes');
  }

  const checkMonto = db.prepare('SELECT COUNT(*) as count FROM configuracion_montos WHERE anio = 2026').get() as { count: number };
  if (checkMonto.count === 0) {
    const meses = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'];
    const insertMonto = db.prepare('INSERT INTO configuracion_montos (mes, anio, monto) VALUES (?, ?, ?)');
    meses.forEach(mes => insertMonto.run(mes, 2026, 5000));
  }

  // ── Grupos por defecto (solo si la tabla está vacía) ────────────────────
  const checkGrupos = db.prepare('SELECT COUNT(*) as count FROM grupos').get() as { count: number };
  if (checkGrupos.count === 0) {
    const insertGrupo = db.prepare('INSERT INTO grupos (nombre) VALUES (?)');
    insertGrupo.run('Pre infantil');
    insertGrupo.run('Infantil');
    insertGrupo.run('Pre juvenil');
    insertGrupo.run('Adultos iniciales');
    insertGrupo.run('Adultos intermedios');
    insertGrupo.run('Adultos avanzados');
    console.log('✅ Grupos por defecto insertados');
  }

  console.log('✅ Base de datos inicializada correctamente');
};