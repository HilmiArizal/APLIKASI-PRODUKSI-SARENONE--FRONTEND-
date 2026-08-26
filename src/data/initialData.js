export const DEFAULT_USERS = [
  {
    id: 'u1',
    username: 'admin',
    email: 'admin@sarenone.com',
    pass: 'admin',
    name: 'Super Admin Saren One',
    role: 'ADMIN',
    status: 'VERIFIED',
    provider: 'local',
    createdAt: '2026-07-20 08:00'
  },
  {
    id: 'u_admin_produk',
    username: 'admin_produk',
    email: 'admin_produk@sarenone.com',
    pass: 'Adminproduk@123',
    name: 'Super Admin Produk',
    role: 'ADMIN_PRODUK',
    status: 'VERIFIED',
    provider: 'local',
    createdAt: '2026-07-30 00:00'
  }
];

export const INITIAL_KATEGORI_PRODUK = [
  { id: 'kat_1', nama: 'SAREN ONE', deskripsi: 'Daging olahan makanan beku' },
  { id: 'kat_2', nama: 'EAT GOW', deskripsi: 'Daging olahan makanan beku' },
  { id: 'kat_3', nama: 'BEULEUM', deskripsi: 'Daging olahan makanan beku' }
];
export const INITIAL_KATEGORI_BAHAN = [];
export const INITIAL_BAHAN_BAKU = [];
export const INITIAL_PRODUK = [];
export const INITIAL_RESEP = {};
export const INITIAL_AUDIT_LOG = [];
export const INITIAL_RIWAYAT_PRODUKSI = [];

// Definisi Resmi Stok Akhir Juli (Stok Awal per 1 Agustus 2026)
export const STOCK_AWAL_JULI = {
  BB1: 62.7,
  BB2: 0,
  BB3: 20.785,
  BB4: 0,
  BB5: 37.23,
  BB6: 168.435,
  BB7: 39,
  BB8: 0,
  BB9: 51.7,
  BB10: 0,
  BB11: 37.915,
  BB12: 13.127,
  BB13: 65.415,
  BB14: 10.301,
  BB15: 11.642,
  BB16: 0,
  BB17: 10.788,
  BB18: 7.208,
  BB19: 11.398,
  BB20: 40.325,
  BB21: 24.375,
  BB22: 45.997,
  BB23: 6.395,
  BB24: 10.22,
  BB25: 2.375,
  BB26: 0,
  BB27: 272,
  BB28: 98,
  BB29: 70,
  BB30: 1020,
  BB31: 1761,
  BB32: 4266,
  BB33: 1115,
  BB34: 1838,
  BB35: 5345,
  BB36: 11383,
  BB37: 1.205,
  BB38: 0.412,
  BB39: 0.485,
  BB40: 0.142,
  BB41: 0,
  BB42: 0,
  BB43: 0,
  BB44: 77.335,
  BB45: 0,
  BB46: 0,
  BB47: 4.0,
  BB48: 48.07,
  BB49: 0.552,
  BB50: 3191,
  BB51: 0,
  BB52: 0,
  BB53: 0,
  BB54: 115.57,
  BB55: 3.575,
  BB56: 9.22
};

// Master Initial Unit Price Dictionary (H. AWAL per SKU BB1..BB56)
export const HARGA_AWAL_JULI = {
  BB1: 46000,
  BB2: 63000,
  BB3: 24000,
  BB4: 29000,
  BB5: 15000,
  BB6: 55500,
  BB7: 40000,
  BB8: 1167,
  BB9: 11970,
  BB10: 12000,
  BB11: 13000,
  BB12: 6500,
  BB13: 26500,
  BB14: 83000,
  BB15: 63500,
  BB16: 145299,
  BB17: 241980,
  BB18: 182040,
  BB19: 113538,
  BB20: 58830,
  BB21: 61000,
  BB22: 154630,
  BB23: 74500,
  BB24: 33118,
  BB25: 43623,
  BB26: 0,
  BB27: 33802,
  BB28: 50619,
  BB29: 45988,
  BB30: 500,
  BB31: 1050,
  BB32: 800,
  BB33: 850,
  BB34: 1050,
  BB35: 500,
  BB36: 75,
  BB37: 52500,
  BB38: 240000,
  BB39: 119000,
  BB40: 110000,
  BB41: 0,
  BB42: 0,
  BB43: 0,
  BB44: 61000,
  BB45: 0,
  BB46: 0,
  BB47: 299700,
  BB48: 143500,
  BB49: 115000,
  BB50: 900,
  BB51: 335000,
  BB52: 86000,
  BB53: 42000,
  BB54: 23903,
  BB55: 8000,
  BB56: 68250
};

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function getSkuSortIndex(skuStr) {
  if (!skuStr) return 999999;
  const match = String(skuStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 999999;
}

export function getThreeMonthCutoffDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().substring(0, 10);
}

export function getThreeMonthCutoffLabel() {
  const cutoffStr = getThreeMonthCutoffDate();
  const parts = cutoffStr.split('-');
  if (parts.length < 3) return cutoffStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${day} ${monthNames[monthIdx] || ''} ${year}`;
}

export const SATUAN_MASTER_SKU = {
  BB1: 'kg',   BB2: 'kg',   BB3: 'kg',   BB4: 'kg',   BB5: 'kg',   BB6: 'kg',   BB7: 'kg',   BB8: 'kg',   BB9: 'kg',   BB10: 'kg',
  BB11: 'kg',  BB12: 'kg',  BB13: 'kg',  BB14: 'kg',  BB15: 'kg',  BB16: 'kg',  BB17: 'kg',  BB18: 'kg',  BB19: 'kg',  BB20: 'kg',
  BB21: 'kg',  BB22: 'kg',  BB23: 'kg',  BB24: 'kg',

  // Casing Sosis Devro (roll)
  BB25: 'roll', BB26: 'roll', BB27: 'roll', BB28: 'roll', BB29: 'roll',

  // Kantong Plastik Vacuum (pcs)
  BB30: 'pcs',  BB31: 'pcs',  BB32: 'pcs',  BB33: 'pcs',  BB34: 'pcs',

  // Sticker & Label (pcs)
  BB35: 'pcs',  BB36: 'pcs',

  // Keju & Additives
  BB37: 'kg',   BB38: 'kg',   BB39: 'kg',   BB40: 'kg',   BB41: 'kg',   BB42: 'kg',   BB43: 'kg',

  // Dus Box, Lakban & Kemasan
  BB44: 'pcs',  BB45: 'pcs',  BB46: 'roll', BB47: 'roll', BB48: 'pcs',  BB49: 'box',  BB50: 'pcs',
  BB51: 'pcs',  BB52: 'pcs',  BB53: 'roll', BB54: 'pcs',  BB55: 'pcs',  BB56: 'pcs',

  BB60: 'pcs',  BB61: 'pcs',
  'EML-ISP': 'kg', 'EML-TVP': 'kg'
};

export function getBahanSatuan(b) {
  if (!b) return 'kg';
  const bSku = String(b.sku || b.kode || '').trim().toUpperCase();
  const bNm = String(b.nama || '').trim().toLowerCase();

  // 1. Explicit property from material object (e.g. from user edit or imported Excel)
  if (b.satuan && String(b.satuan).trim().length > 0) {
    return String(b.satuan).trim();
  }

  // 2. localStorage backup from Excel import
  if (bSku) {
    const localSatuan = localStorage.getItem(`SATUAN_${bSku}`);
    if (localSatuan && localSatuan.trim().length > 0) {
      return localSatuan.trim();
    }
  }

  // 3. Fallback dictionary
  if (bSku && SATUAN_MASTER_SKU[bSku]) {
    return SATUAN_MASTER_SKU[bSku];
  }

  // 4. Name-based heuristics fallback
  if (bNm.includes('vacum') || bNm.includes('sticker') || bNm.includes('stiker') || bNm.includes('dus') || bNm.includes('box') || bNm.includes('label') || bNm.includes('pcs')) {
    return 'pcs';
  }
  if (bNm.includes('devro') || bNm.includes('casing') || bNm.includes('lakban') || bNm.includes('wrap') || bNm.includes('tali') || bNm.includes('roll')) {
    return 'roll';
  }
  if (bNm.includes('clip') || bNm.includes('kawat')) {
    return 'box';
  }

  return 'kg';
}

export const INITIAL_PRODUK_MASTER = [
  { id: 'P1', kode: 'P1', sku: 'P1', alias: 'RCS 250', brand: 'SAREN ONE', nama: 'Red Cocktail Sausage 250g', satuan: 'pack', harga: 20500 },
  { id: 'P2', kode: 'P2', sku: 'P2', alias: 'RCS 500', brand: 'SAREN ONE', nama: 'Red Cocktail Sausage 500g', satuan: 'pack', harga: 36500 },
  { id: 'P3', kode: 'P3', sku: 'P3', alias: 'RCS 900', brand: 'SAREN ONE', nama: 'Red Cocktail Sausage 900g', satuan: 'pack', harga: 62500 },
  { id: 'P4', kode: 'P4', sku: 'P4', alias: 'RCS 1000', brand: 'SAREN ONE', nama: 'Red Cocktail Sausage 1kg', satuan: 'pack', harga: 73000 },
  { id: 'P5', kode: 'P5', sku: 'P5', alias: 'FS 500', brand: 'SAREN ONE', nama: 'Frankfurter Sausage 500g', satuan: 'pack', harga: 36500 },
  { id: 'P6', kode: 'P6', sku: 'P6', alias: 'FS 900', brand: 'SAREN ONE', nama: 'Frankfurter Sausage 900g', satuan: 'pack', harga: 62500 },
  { id: 'P7', kode: 'P7', sku: 'P7', alias: 'FS 1000', brand: 'SAREN ONE', nama: 'Frankfurter Sausage 1kg', satuan: 'pack', harga: 73000 },
  { id: 'P8', kode: 'P8', sku: 'P8', alias: 'BS 500', brand: 'SAREN ONE', nama: 'Breakfast Sausage 500g', satuan: 'pack', harga: 36000 },
  { id: 'P9', kode: 'P9', sku: 'P9', alias: 'BS 900', brand: 'SAREN ONE', nama: 'Breakfast Sausage 900g', satuan: 'pack', harga: 62000 },
  { id: 'P10', kode: 'P10', sku: 'P10', alias: 'CCS 500', brand: 'SAREN ONE', nama: 'Cheese Cocktail Sausage 500g', satuan: 'pack', harga: 43000 },
  { id: 'P11', kode: 'P11', sku: 'P11', alias: 'CBS 500', brand: 'SAREN ONE', nama: 'Chicken Breakfast Sausage 500g', satuan: 'pack', harga: 34500 },
  { id: 'P12', kode: 'P12', sku: 'P12', alias: 'BWOS 500', brand: 'SAREN ONE', nama: 'Bratwurst Original Sausage (6)', satuan: 'pack', harga: 36000 },
  { id: 'P13', kode: 'P13', sku: 'P13', alias: 'BWRS 500', brand: 'SAREN ONE', nama: 'Bratwurst Rendang Sausage (6)', satuan: 'pack', harga: 36000 },
  { id: 'P14', kode: 'P14', sku: 'P14', alias: 'SCM 500', brand: 'EATGOW', nama: 'Sosis Cocktail Merah 500g', satuan: 'pack', harga: 33000 },
  { id: 'P15', kode: 'P15', sku: 'P15', alias: 'SCM 900', brand: 'EATGOW', nama: 'Sosis Cocktail Merah 900g', satuan: 'pack', harga: 57500 },
  { id: 'P16', kode: 'P16', sku: 'P16', alias: 'SCC 500', brand: 'EATGOW', nama: 'Sosis Cocktail Coklat 500g', satuan: 'pack', harga: 57000 },
  { id: 'P17', kode: 'P17', sku: 'P17', alias: 'SCC 900', brand: 'EATGOW', nama: 'Sosis Cocktail Coklat 900g', satuan: 'pack', harga: 57000 },
  { id: 'P18', kode: 'P18', sku: 'P18', alias: 'SJ 1000', brand: 'EATGOW', nama: 'Sosis Jumbo (12)', satuan: 'pack', harga: 60000 },
  { id: 'P19', kode: 'P19', sku: 'P19', alias: 'SK 300', brand: 'BEULEUM', nama: 'Sosis Kupas 300g', satuan: 'pack', harga: 20000 },
  { id: 'P20', kode: 'P20', sku: 'P20', alias: 'SBJ 500', brand: 'BEULEUM', nama: 'Sosis Bakar Jumbo (7)', satuan: 'pack', harga: 26000 },
  { id: 'P21', kode: 'P21', sku: 'P21', alias: 'SBM 500', brand: 'BEULEUM', nama: 'Sosis Bakar Mini (12)', satuan: 'pack', harga: 26000 },
  { id: 'P22', kode: 'P22', sku: 'P22', alias: 'OCS 500', brand: 'NR', nama: 'OCS 500g', satuan: 'pack', harga: 36000 },
  { id: 'P23', kode: 'P23', sku: 'P23', alias: 'OCS 1000', brand: 'NR', nama: 'OCS 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P24', kode: 'P24', sku: 'P24', alias: 'BCS 500', brand: 'NR', nama: 'BCS 500g', satuan: 'pack', harga: 36000 },
  { id: 'P25', kode: 'P25', sku: 'P25', alias: 'BCS 1000', brand: 'NR', nama: 'BCS 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P26', kode: 'P26', sku: 'P26', alias: 'OBS 500', brand: 'NR', nama: 'OBS 500g', satuan: 'pack', harga: 36000 },
  { id: 'P27', kode: 'P27', sku: 'P27', alias: 'OBS 1000', brand: 'NR', nama: 'OBS 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P28', kode: 'P28', sku: 'P28', alias: 'BMB 500', brand: 'NR', nama: 'BMB 500g', satuan: 'pack', harga: 41000 },
  { id: 'P29', kode: 'P29', sku: 'P29', alias: 'BMB 1000', brand: 'NR', nama: 'BMB 1kg', satuan: 'pack', harga: 82000 },
  { id: 'P30', kode: 'P30', sku: 'P30', alias: 'SCS 500', brand: 'NR', nama: 'SCS 500g', satuan: 'pack', harga: 46000 },
  { id: 'P31', kode: 'P31', sku: 'P31', alias: 'SCS 1000', brand: 'NR', nama: 'SCS 1kg', satuan: 'pack', harga: 92000 },
  { id: 'P32', kode: 'P32', sku: 'P32', alias: 'BW 1000', brand: 'NR', nama: 'BW 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P33', kode: 'P33', sku: 'P33', alias: 'BWC 1000', brand: 'NR', nama: 'BWC 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P34', kode: 'P34', sku: 'P34', alias: 'GW 1000', brand: 'NR', nama: 'GW 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P35', kode: 'P35', sku: 'P35', alias: 'BP 1000', brand: 'NR', nama: 'BP 1kg', satuan: 'pack', harga: 72000 },
  { id: 'P44', kode: 'P44', sku: 'P44', alias: 'CN 500', brand: 'SAREN ONE', nama: 'Chicken Nugget 500g', satuan: 'pack', harga: 26000 },
  { id: 'P45', kode: 'P45', sku: 'P45', alias: 'BWHM 500', brand: 'SAREN ONE', nama: 'Bratwurst Horeca Mini (11)', satuan: 'pack', harga: 25000 },
  { id: 'P46', kode: 'P46', sku: 'P46', alias: 'BWHM 1000', brand: 'SAREN ONE', nama: 'Bratwurst Horeca Mini (22)', satuan: 'pack', harga: 50000 },
  { id: 'P47', kode: 'P47', sku: 'P47', alias: 'RCH 500', brand: 'SAREN ONE', nama: 'Red Cocktail Horeca 500g', satuan: 'pack', harga: 33000 },
  { id: 'P48', kode: 'P48', sku: 'P48', alias: 'RCH 900', brand: 'SAREN ONE', nama: 'Red Cocktail Horeca 900g', satuan: 'pack', harga: 57500 }
];
