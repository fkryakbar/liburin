import { HolidayService } from '../src/services/holidayService';

export default function handler(req: any, res: any) {
  // Mengizinkan akses lintas asal (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const data = HolidayService.checkToday();
  return res.status(200).json(data);
}
