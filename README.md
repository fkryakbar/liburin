# Liburin - API Hari Libur & Cuti Nasional Indonesia 🇮🇩

**Liburin** adalah antarmuka pemrograman aplikasi (API) *open-source* modern dan super akurat yang menyajikan data resmi mengenai Hari Libur Nasional dan Cuti Bersama di Indonesia. 

Dibangun di atas *runtime* **Bun** yang secepat kilat, sistem ini dirancang beroperasi tanpa database eksternal (*maintenance-free*) dengan memanfaatkan pembaruan data otomatis setiap minggu melalui penelusuran web (*web scraping*) ke situs referensi resmi.

---

## ✨ Fitur Unggulan

- ⚡ **Kinerja Kilat Bun**: Memanfaatkan `Bun.serve()` berkinerja tinggi untuk memberikan waktu respons instan dalam hitungan milidetik tanpa *overhead* server yang berat.
- 🤖 **Pembaruan Otomatis Mingguan**: Terintegrasi penuh dengan alur kerja **GitHub Actions** yang berjalan secara mandiri setiap minggu untuk mengekstrak data terbaru dari `kalenderku.id` dan menyimpannya secara otomatis ke dalam repositori.
- ⏰ **Presisi Waktu Lokal (GMT+8)**: Menggunakan acuan waktu standar lokal Indonesia untuk menjamin akurasi mutlak pergantian hari pada *endpoint* dinamis (seperti `/api/today` dan `/api/tomorrow`), terlepas dari pengaturan zona waktu server *hosting* (UTC).
- 🎨 **Antarmuka Sandbox Interaktif**: Dilengkapi halaman dokumentasi berdesain *Sleek Dark Mode Glassmorphism* berbasis **Tailwind CSS** yang menyediakan *Live API Sandbox* untuk pengujian *request* secara seketika.

---

## 🚀 Dokumentasi Endpoints

Seluruh respons API disajikan dalam format **JSON** dengan *header* CORS terbuka (`Access-Control-Allow-Origin: *`) sehingga dapat diakses secara langsung dari aplikasi sisi klien mana pun.

### 1. Cek Libur Hari Ini
```http
GET /api/today
```
**Respons Sukses (Contoh saat libur):**
```json
{
  "is_holiday": true,
  "name": "Tahun Baru Masehi 2026",
  "type": "Libur Nasional",
  "date": "2026-01-01"
}
```

### 2. Cek Libur Besok
```http
GET /api/tomorrow
```
Mengecek status hari libur untuk keesokan harinya menggunakan perhitungan batas tanggal waktu lokal Indonesia.

### 3. Daftar Libur Bulan Ini
```http
GET /api/this-month
```
Mengembalikan *array* seluruh objek hari libur dan cuti bersama yang jatuh pada bulan berjalan.

### 4. Daftar Libur Kustom (Filter Parameter)
```http
GET /api?month={int}&year={int}
```
Mendukung penyaringan data secara spesifik:
- `month`: Angka bulan (1 untuk Januari, 12 untuk Desember).
- `year`: Tahun empat digit (Contoh: `2026`). Jika parameter tahun atau bulan dihilangkan, API akan menggunakan tahun berjalan secara otomatis.

### 5. Metadata Kesegaran Data
```http
GET /api/meta
```
Mengembalikan *timestamp* pembaruan terakhir beserta total entri yang terdaftar di dalam database lokal.

---

## 🛠️ Pengembangan Lokal (*Local Development*)

### Prasyarat
Pastikan Anda telah menginstal **Bun** di sistem Anda.

### Langkah-langkah Instalasi

1. **Klon Repositori**
   ```bash
   git clone https://github.com/fkryakbar/liburin.git
   cd liburin
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   # atau
   bun install
   ```

3. **Kompilasi Berkas CSS Tailwind**
   ```bash
   bun run build:css
   ```

4. **Jalankan Scraper (Untuk mengisi database awal)**
   ```bash
   bun run scrape
   ```

5. **Jalankan Server Lokal**
   ```bash
   bun run dev
   # Server akan berjalan di http://localhost:3000
   ```

---

## 📄 Lisensi dan Sumber Data

- **Lisensi**: Proyek ini didistribusikan di bawah lisensi *open-source* MIT.
- **Sumber Data**: Perhitungan penanggalan libur bersumber dari rilis acuan penanggalan nasional via [kalenderku.id](https://kalenderku.id).
