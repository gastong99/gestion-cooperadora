const Database = require('better-sqlite3');
import path from 'path';
import { app } from 'electron';
import { createTables } from './schema';

let db: any | null = null;

export const initDatabase = () => {
  try {
    // Ruta donde se guardará la base de datos
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'cooperadora.db');
    
    console.log('📁 Ruta de la base de datos:', dbPath);
    
    // Crear/abrir la base de datos
    db = new Database(dbPath);
    
    // Habilitar foreign keys
    db.pragma('foreign_keys = ON');
    
    // Crear las tablas
    createTables(db);
    
    console.log('✅ Base de datos conectada correctamente');
    
    return db;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

export const getDatabase = (): any => {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llamá a initDatabase() primero.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    console.log('🔒 Base de datos cerrada');
  }
};