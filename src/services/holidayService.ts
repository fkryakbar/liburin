import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HolidaysDatabase } from '../scraper';
import { getGMT8Date, formatDateISO } from '../utils/date';

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
    const today = formatDateISO(getGMT8Date(0));
    const result = this.checkDate(today);

    if (result.is_holiday) {
      return result;
    }

    const nextHoliday = this.getNextHoliday(today);
    return {
      ...result,
      countdown_days: nextHoliday ? this.daysBetween(today, nextHoliday.date) : null
    };
  }

  public static checkTomorrow() {
    const tomorrow = formatDateISO(getGMT8Date(1));
    return this.checkDate(tomorrow);
  }

  public static getThisMonth() {
    const today = getGMT8Date(0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    return this.queryHolidays(currentMonth, currentYear);
  }

  public static validateQueryParams(month?: number, year?: number): string | null {
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12 || !Number.isInteger(month))) {
      return 'Parameter "month" harus berupa bilangan bulat antara 1 dan 12.';
    }
    if (year !== undefined && (isNaN(year) || year < 1900 || year > 2100 || !Number.isInteger(year))) {
      return 'Parameter "year" harus berupa bilangan bulat antara 1900 dan 2100.';
    }
    return null;
  }

  public static queryHolidays(month?: number, year?: number) {
    const db = this.getDatabase();

    if (month === undefined && year === undefined) {
      const today = getGMT8Date(0);
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

  public static getUpcoming(limit: number = 5) {
    const today = formatDateISO(getGMT8Date(0));
    const db = this.getDatabase();

    return db.data
      .filter(h => h.date > today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  }

  public static getMeta() {
    const db = this.getDatabase();
    return {
      last_updated: db.last_updated,
      total: db.data.length
    };
  }

  private static getNextHoliday(todayISO: string) {
    const db = this.getDatabase();
    return db.data
      .filter(h => h.date > todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }

  private static daysBetween(fromISO: string, toISO: string): number {
    const from = new Date(fromISO + 'T00:00:00+08:00');
    const to = new Date(toISO + 'T00:00:00+08:00');
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }
}
