import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getGMT8Timestamp } from './utils/date';

export interface HolidayItem {
  is_holiday: boolean;
  name: string;
  type: string; // e.g. "Libur Nasional", "Cuti Bersama"
  date: string; // YYYY-MM-DD
}

export interface HolidaysDatabase {
  last_updated: string;
  data: HolidayItem[];
}

function parseIndonesianDate(dateStr: string, year: number): string | null {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const monthName = parts[1].toLowerCase();
  const months: { [key: string]: string } = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };
  const month = months[monthName];
  if (!month || isNaN(day)) return null;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${month}-${dayStr}`;
}

async function scrapeYear(year: number): Promise<HolidayItem[]> {
  const url = `https://kalenderku.id/${year}`;
  console.log(`Mengambil data untuk tahun ${year} dari ${url}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Gagal mengambil halaman untuk tahun ${year}: HTTP ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: HolidayItem[] = [];
    
    // Cari semua elemen list libur
    $('li').each((_, el) => {
      const $el = $(el);
      const srText = $el.find('span.sr-only').text().trim();
      
      let dateStr = '';
      let name = '';
      let type = '';
      
      // Metode 1: Parsing dari sr-only jika formatnya lengkap (Contoh: "Kamis 1 Januari - Tahun Baru Masehi 2026 - Libur Nasional")
      if (srText && srText.includes(' - ')) {
        const parts = srText.split(' - ');
        if (parts.length >= 3) {
          // Bagian pertama biasanya "Hari Tanggal Bulan" (Contoh: "Kamis 1 Januari")
          const dateParts = parts[0].trim().split(' ');
          if (dateParts.length >= 3) {
            dateStr = `${dateParts[1]} ${dateParts[2]}`; // "1 Januari"
          } else if (dateParts.length === 2) {
            dateStr = parts[0].trim();
          }
          name = parts[1].trim();
          type = parts[2].trim();
        }
      }
      
      // Metode 2: Fallback presisi mengambil dari elemen-elemen visual jika Metode 1 kurang tepat
      if (!dateStr || !name) {
        // Ambil teks tanggal dari span dengan font-medium
        const visualDateSpan = $el.find('span.font-medium').text().trim();
        if (visualDateSpan) {
          dateStr = visualDateSpan;
        }
        
        // Ambil nama libur dari span.truncate
        const truncateSpan = $el.find('span.truncate').text().trim();
        if (truncateSpan) {
          name = truncateSpan;
        }
        
        // Cek jenis libur/cuti dari kelas bg-holiday atau bg-cuti
        if ($el.find('.bg-holiday').length > 0) {
          type = type || 'Libur Nasional';
        } else if ($el.find('.bg-cuti').length > 0) {
          type = type || 'Cuti Bersama';
        } else {
          // Coba cari span teks terakhir
          const spans = $el.find('span').toArray();
          const lastSpanText = $(spans[spans.length - 1]).text().trim();
          if (lastSpanText.toLowerCase().includes('cuti')) {
            type = type || 'Cuti Bersama';
          } else {
            type = type || 'Libur Nasional';
          }
        }
      }
      
      if (dateStr && name) {
        const isoDate = parseIndonesianDate(dateStr, year);
        if (isoDate) {
          results.push({
            is_holiday: true,
            name: name,
            type: type || 'Libur Nasional',
            date: isoDate
          });
        }
      }
    });
    
    console.log(`Berhasil mengekstrak ${results.length} hari libur/cuti untuk tahun ${year}.`);
    return results;
  } catch (error) {
    console.error(`Terjadi kesalahan saat melakukan scraping tahun ${year}:`, error);
    return [];
  }
}

async function main() {
  console.log('=== Memulai Scraping Libur Nasional Indonesia ===');
  
  // Ambil tahun saat ini berdasarkan waktu lokal Indonesia (GMT+8)
  const now = new Date();
  const gmt8Ms = now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000);
  const currentYear = new Date(gmt8Ms).getFullYear();
  
  // Tahun yang diambil: tahun sekarang dan 3 tahun sebelumnya
  const targetYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  let allHolidays: HolidayItem[] = [];
  
  for (const year of targetYears) {
    const items = await scrapeYear(year);
    allHolidays = allHolidays.concat(items);
    // Beri jeda sedikit antar-request agar sopan terhadap server target
    await new Promise(res => setTimeout(res, 1000));
  }
  
  // Urutkan data berdasarkan tanggal dari yang terlama ke terbaru
  allHolidays.sort((a, b) => a.date.localeCompare(b.date));
  
  // Validasi: Jika hasil kosong, JANGAN ditimpa dan lemparkan error agar proses Actions bernilai gagal
  if (allHolidays.length === 0) {
    console.error('KESALAHAN KRITIS: Hasil scraping kosong. Berkas lama tidak akan ditimpa.');
    process.exit(1);
  }
  
  const outputDir = resolve(__dirname, '../data');
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  
  const outputPath = resolve(outputDir, 'holidays.json');
  const database: HolidaysDatabase = {
    last_updated: getGMT8Timestamp(),
    data: allHolidays
  };
  
  await writeFile(outputPath, JSON.stringify(database, null, 2), 'utf-8');
  console.log(`=== Scraping Selesai. Total ${allHolidays.length} data tersimpan ke ${outputPath} pada ${database.last_updated} ===`);
}

main().catch(err => {
  console.error('Terjadi *unhandled error* pada scraper:', err);
  process.exit(1);
});
