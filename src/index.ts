import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import { HolidayService } from './services/holidayService';

const PORT = process.env.PORT || 3000;

console.log(`Menjalankan server API Libur Nasional di port ${PORT}...`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // --- ROUTER API ---
    if (pathname.startsWith('/api')) {
      if (pathname === '/api/today' || pathname === '/api/today/') {
        const data = HolidayService.checkToday();
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      if (pathname === '/api/tomorrow' || pathname === '/api/tomorrow/') {
        const data = HolidayService.checkTomorrow();
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      if (pathname === '/api/this-month' || pathname === '/api/this-month/') {
        const data = HolidayService.getThisMonth();
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      if (pathname === '/api/upcoming' || pathname === '/api/upcoming/') {
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 5;
        const data = HolidayService.getUpcoming(limit);
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      if (pathname === '/api/meta' || pathname === '/api/meta/') {
        const data = HolidayService.getMeta();
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      if (pathname === '/api' || pathname === '/api/') {
        const monthParam = url.searchParams.get('month');
        const yearParam = url.searchParams.get('year');

        const month = monthParam ? parseInt(monthParam, 10) : undefined;
        const year = yearParam ? parseInt(yearParam, 10) : undefined;

        const validationError = HolidayService.validateQueryParams(month, year);
        if (validationError) {
          return new Response(JSON.stringify({ error: validationError }, null, 2), {
            status: 400,
            headers: corsHeaders
          });
        }

        const data = HolidayService.queryHolidays(month, year);
        return new Response(JSON.stringify(data, null, 2), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Endpoint API tidak ditemukan' }, null, 2), {
        status: 404,
        headers: corsHeaders
      });
    }

    // --- SERVER BERKAS STATIS (LANDING PAGE) ---
    let safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = resolve(__dirname, '../public', safePath.slice(1));

    try {
      const stat = statSync(filePath);
      if (stat.isFile()) {
        const file = Bun.file(filePath);
        let contentType = 'text/plain';
        if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
        else if (filePath.endsWith('.css')) contentType = 'text/css; charset=utf-8';
        else if (filePath.endsWith('.js')) contentType = 'application/javascript; charset=utf-8';
        else if (filePath.endsWith('.json')) contentType = 'application/json; charset=utf-8';
        else if (filePath.endsWith('.ico')) contentType = 'image/x-icon';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';

        return new Response(file, {
          headers: { 'Content-Type': contentType }
        });
      }
    } catch (err) {
      // File statis tidak ditemukan
    }

    return new Response('Halaman tidak ditemukan (404)', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});
