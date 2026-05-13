import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HolidaysDatabase } from '../scraper';

export class HolidayService {
  private static getDatabase(): HolidaysDatabase {
    const dbPath = resolve(__dirname, '../../data/holidays.json');
    if (!existsSync(dbPath)) {
      return { last_updated: 'Belum dilakukan scraping', data: [] };
    }
    try {
      const content = readFileSync(dbPath, 'utf-8');
      return JSON.parse(content) as HolidaysDatabase;
    } catch (err) {
      console.error('Gagal membaca database holidays.json:', err);
      return { last_updated: 'Error membaca data', data: [] };
    }
  }

  /**
   * Mengembalikan Date object lokal acuan GMT+8 (Waktu Indonesia Tengah / acuan standar)
   * Menjamin perhitungan pergantian hari tetap presisi meskipun server di-host di zona waktu UTC
   */
  public static getGMT8Date(offsetDays: number = 0): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // GMT+8 adalah +8 jam = 8 * 3600000 ms
    const targetMs = utc + (8 * 3600000) + (offsetDays * 86400000);
    return new Date(targetMs);
  }

  public static formatDateISO(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  public static checkDate(targetDateISO: string) {
    const db = this.getDatabase();
    const found = db.data.find(h => h.date === targetDateISO);
    if (found) {
      return {
        is_holiday: true,
        name: found.name,
        type: found.type,
        date: targetDateISO
      };
    }
    return {
      is_holiday: false,
      name: null,
      type: null,
      date: targetDateISO
    };
  }

  public static checkToday() {
    const today = this.getGMT8Date(0);
    return this.checkDate(this.formatDateISO(today));
  }

  public static checkTomorrow() {
    const tomorrow = this.getGMT8Date(1);
    return this.checkDate(this.formatDateISO(tomorrow));
  }

  public static getThisMonth() {
    const today = this.getGMT8Date(0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    return this.queryHolidays(currentMonth, currentYear);
  }

  public static queryHolidays(month?: number, year?: number) {
    const db = this.getDatabase();
    
    // Jika tidak ada parameter bulan dan tahun, gunakan tahun berjalan sebagai default
    if (month === undefined && year === undefined) {
      const today = this.getGMT8Date(0);
      year = today.getFullYear();
    }

    return db.data.filter(h => {
      const parts = h.date.split('-');
      if (parts.length < 3) return false;
      const hYear = parseInt(parts[0], 10);
      const hMonth = parseInt(parts[1], 10);
      
      if (year !== undefined && isNaN(year) === false && hYear !== year) return false;
      if (month !== undefined && isNaN(month) === false && hMonth !== month) return false;
      return true;
    });
  }

  public static getMeta() {
    const db = this.getDatabase();
    return {
      last_updated: db.last_updated,
      total: db.data.length
    };
  }
}
