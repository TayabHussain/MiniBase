import Database from 'better-sqlite3';
import { join } from 'path';
import bcrypt from 'bcryptjs';

export interface DatabaseSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    notnull: boolean;
    dflt_value: any;
    pk: boolean;
  }>;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

class MiniBaseDB {
  private db: Database.Database;

  constructor() {
    const dbPath = join(process.cwd(), 'database.sqlite');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize() {
    // Create admin_users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create app_users table (default user table for applications)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if none exists
    const adminExists = this.db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
    if (adminExists.count === 0) {
      const defaultPassword = 'admin123';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      this.db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hashedPassword);
      console.log('Default admin user created: admin / admin123');
    }
  }

  // Admin user methods
  getAdminUser(username: string): AdminUser | undefined {
    return this.db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as AdminUser | undefined;
  }

  createAdminUser(username: string, password: string): AdminUser {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = this.db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?) RETURNING *').get(username, hashedPassword) as AdminUser;
    return result;
  }

  // Schema introspection methods
  getTables(): string[] {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    return tables.map(t => t.name);
  }

  getTableSchema(tableName: string): DatabaseSchema | null {
    try {
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }>;

      if (columns.length === 0) return null;

      return {
        name: tableName,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          notnull: !!col.notnull,
          dflt_value: col.dflt_value,
          pk: !!col.pk
        }))
      };
    } catch (error) {
      console.error(`Error getting schema for table ${tableName}:`, error);
      return null;
    }
  }

  // Generic CRUD operations
  getAllFromTable(tableName: string, limit = 100, offset = 0): any[] {
    try {
      return this.db.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`).all(limit, offset);
    } catch (error) {
      console.error(`Error fetching from table ${tableName}:`, error);
      return [];
    }
  }

  getTableRowCount(tableName: string): number {
    try {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
      return result.count;
    } catch (error) {
      console.error(`Error counting rows in table ${tableName}:`, error);
      return 0;
    }
  }

  insertIntoTable(tableName: string, data: Record<string, any>): any {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data);

      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      return this.db.prepare(sql).get(...values);
    } catch (error) {
      console.error(`Error inserting into table ${tableName}:`, error);
      throw error;
    }
  }

  updateInTable(tableName: string, id: number, data: Record<string, any>): any {
    try {
      const columns = Object.keys(data);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = [...Object.values(data), id];

      const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ? RETURNING *`;
      return this.db.prepare(sql).get(...values);
    } catch (error) {
      console.error(`Error updating table ${tableName}:`, error);
      throw error;
    }
  }

  deleteFromTable(tableName: string, id: number): boolean {
    try {
      const result = this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting from table ${tableName}:`, error);
      return false;
    }
  }

  // Table management
  createTable(tableName: string, columns: Array<{ name: string; type: string; constraints?: string }>): boolean {
    try {
      const columnDefinitions = columns.map(col =>
        `${col.name} ${col.type}${col.constraints ? ' ' + col.constraints : ''}`
      ).join(', ');

      const sql = `CREATE TABLE ${tableName} (${columnDefinitions})`;
      this.db.exec(sql);
      return true;
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
      return false;
    }
  }

  dropTable(tableName: string): boolean {
    try {
      this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
      return true;
    } catch (error) {
      console.error(`Error dropping table ${tableName}:`, error);
      return false;
    }
  }

  // Execute raw SQL (for advanced operations)
  executeSQL(sql: string, params: any[] = []): any {
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return this.db.prepare(sql).all(...params);
      } else {
        return this.db.prepare(sql).run(...params);
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: MiniBaseDB | null = null;

export function getDB(): MiniBaseDB {
  if (!dbInstance) {
    dbInstance = new MiniBaseDB();
  }
  return dbInstance;
}

export default MiniBaseDB;