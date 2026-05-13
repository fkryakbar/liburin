document.addEventListener('DOMContentLoaded', () => {
  const endpointSelect = document.getElementById('endpoint-select');
  const customParamsDiv = document.getElementById('custom-params');
  const paramMonth = document.getElementById('param-month');
  const paramYear = document.getElementById('param-year');
  const activeUrlCode = document.getElementById('active-url');
  const responseOutput = document.getElementById('response-output');
  const responseStatus = document.getElementById('response-status');
  const statusUpdateEl = document.getElementById('status-update');
  const sandboxForm = document.getElementById('sandbox-form');

  // URL dasar server saat ini
  const getBaseUrl = () => {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  };

  // Fungsi untuk memperbarui tampilan URL aktif
  const updateActiveUrl = () => {
    const base = getBaseUrl();
    const endpoint = endpointSelect.value;
    
    let fullUrl = `${base}${endpoint}`;
    
    if (endpoint === '/api') {
      const params = new URLSearchParams();
      if (paramMonth.value) params.append('month', paramMonth.value);
      if (paramYear.value) params.append('year', paramYear.value);
      
      const queryString = params.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
    activeUrlCode.textContent = fullUrl;
    return fullUrl;
  };

  // Tampilkan atau sembunyikan parameter kustom
  const handleEndpointChange = () => {
    if (endpointSelect.value === '/api') {
      customParamsDiv.style.display = 'grid';
      customParamsDiv.style.opacity = '1';
    } else {
      customParamsDiv.style.display = 'none';
      customParamsDiv.style.opacity = '0';
    }
    updateActiveUrl();
  };

  endpointSelect.addEventListener('change', handleEndpointChange);
  paramMonth.addEventListener('input', updateActiveUrl);
  paramYear.addEventListener('input', updateActiveUrl);

  // Inisialisasi status awal
  handleEndpointChange();

  // Pengiriman form / Request Sandbox API
  sandboxForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const targetUrl = updateActiveUrl();
    responseOutput.textContent = 'Mengirim permintaan...';
    responseStatus.textContent = 'Memuat';
    responseStatus.className = 'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400';

    try {
      // Gunakan path relatif atau absolut untuk request lokal
      const urlObj = new URL(targetUrl);
      const relativePath = urlObj.pathname + urlObj.search;

      const res = await fetch(relativePath);
      const status = res.status;
      
      responseStatus.textContent = `HTTP ${status}`;
      if (status >= 200 && status < 300) {
        responseStatus.className = 'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400';
      } else {
        responseStatus.className = 'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-red-500/10 text-red-400';
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        responseOutput.textContent = JSON.stringify(data, null, 2);
      } else {
        const text = await res.text();
        responseOutput.textContent = text;
      }
    } catch (err) {
      responseStatus.textContent = 'ERROR';
      responseStatus.className = 'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-red-500/10 text-red-400';
      responseOutput.textContent = `Gagal terhubung ke API lokal:\n${err.message}`;
    }
  });

  // Fungsi untuk memformat tanggal ISO ke format bahasa Indonesia yang mudah dibaca
  const formatReadableDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(date);
    } catch (e) {
      return isoString;
    }
  };

  // Ambil metadata API saat halaman dimuat
  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/meta');
      if (res.ok) {
        const meta = await res.json();
        if (meta && meta.last_updated) {
          const readableDate = formatReadableDate(meta.last_updated);
          statusUpdateEl.innerHTML = `Pembaruan Terakhir: <strong class="text-white">${readableDate}</strong> &bull; <span class="text-holiday font-bold">${meta.total} Hari Libur/Cuti</span>`;
        }
      } else {
        statusUpdateEl.textContent = 'Database belum terisi (Jalankan scraper)';
      }
    } catch (err) {
      statusUpdateEl.textContent = 'Gagal memuat status database';
    }
  };

  fetchMetadata();
  
  // Lakukan satu kali request default ke /api/today untuk mengisi output di awal
  setTimeout(() => {
    sandboxForm.dispatchEvent(new Event('submit'));
  }, 300);
});
