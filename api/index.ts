import { HolidayService } from '../src/services/holidayService';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Penguraian parameter kustom dari req.query bawaan Vercel Serverless
  const query = req.query || {};
  const monthParam = query.month;
  const yearParam = query.year;

  const month = monthParam ? parseInt(monthParam as string, 10) : undefined;
  const year = yearParam ? parseInt(yearParam as string, 10) : undefined;

  const data = HolidayService.queryHolidays(month, year);
  return res.status(200).json(data);
}
