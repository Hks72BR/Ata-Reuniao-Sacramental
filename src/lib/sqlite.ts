import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { SacramentalRecord } from '@/types';

class SQLiteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isNative: boolean;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.isNative = Capacitor.isNativePlatform();
  }

  async init(): Promise<void> {
    if (!this.isNative) return;

    try {
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection('AtaSacramentalDB', false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection('AtaSacramentalDB', false);
      } else {
        this.db = await this.sqlite.createConnection('AtaSacramentalDB', false, 'no-encryption', 1, false);
      }

      await this.db.open();

      const schema = `
        CREATE TABLE IF NOT EXISTS sacramentalRecords (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_date ON sacramentalRecords (date);
        CREATE INDEX IF NOT EXISTS idx_status ON sacramentalRecords (status);
      `;

      await this.db.execute(schema);
    } catch (err) {
      console.error('SQLite init error:', err);
    }
  }

  async saveRecord(record: SacramentalRecord): Promise<void> {
    if (!this.db) return;

    const query = `
      INSERT OR REPLACE INTO sacramentalRecords (id, date, status, createdAt, updatedAt, data)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [
      record.id,
      record.date,
      record.status,
      record.createdAt,
      record.updatedAt,
      JSON.stringify(record)
    ];

    await this.db.run(query, values);
  }

  async getAllRecords(): Promise<SacramentalRecord[]> {
    if (!this.db) return [];

    const query = 'SELECT data FROM sacramentalRecords ORDER BY date DESC;';
    const res = await this.db.query(query);
    
    return (res.values || []).map(row => JSON.parse(row.data));
  }

  async getRecord(id: string): Promise<SacramentalRecord | null> {
    if (!this.db) return null;

    const query = 'SELECT data FROM sacramentalRecords WHERE id = ?;';
    const res = await this.db.query(query, [id]);

    if (res.values && res.values.length > 0) {
      return JSON.parse(res.values[0].data);
    }
    return null;
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.db) return;

    const query = 'DELETE FROM sacramentalRecords WHERE id = ?;';
    await this.db.run(query, [id]);
  }
}

export const sqliteService = new SQLiteService();
