# 🚀 IPFlow Connect — Cara Menjalankan di Localhost

## Struktur Folder

```
ipflow-integrated/
├── src/                    ← Frontend React (sudah terintegrasi dengan API)
├── backend/
│   ├── server.js           ← Backend Express.js
│   ├── package.json
│   └── setup_database.sql  ← Script MySQL
├── vite.config.ts
└── package.json
```

---

## Langkah 1 — Setup Database MySQL

**Via terminal:**
```bash
mysql -u root -p < backend/setup_database.sql
```

**Via phpMyAdmin / MySQL Workbench:**
- Copy isi file `backend/setup_database.sql` → paste → execute

---

## Langkah 2 — Edit Password MySQL

Buka `backend/server.js`, ubah bagian ini:
```js
const DB_CONFIG = {
  user: "root",      // ← MySQL username Anda
  password: "",      // ← MySQL password Anda
  ...
};
```

---

## Langkah 3 — Jalankan Backend (Terminal 1)

```bash
cd backend
npm install
npm start
```

Sukses jika muncul:
```
✅ Berhasil terhubung ke MySQL
🚀 IPFlow Backend berjalan di http://localhost:3001
```

---

## Langkah 4 — Jalankan Frontend (Terminal 2)

```bash
npm install
npm run dev
```

Buka browser: **http://localhost:5173**

---

## ✅ Fitur CRUD

| Halaman       | Lihat | Tambah | Hapus |
|---------------|:-----:|:------:|:-----:|
| Dashboard     | ✅    | —      | —     |
| Customers     | ✅    | ✅     | ✅    |
| Subnets       | ✅    | ✅     | ✅    |
| IP Addresses  | ✅    | ✅     | ✅    |

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---|---|
| Data tidak muncul / kosong | Pastikan backend (`npm start`) sudah berjalan dulu |
| "Gagal terhubung ke MySQL" | Cek MySQL aktif, username & password di `server.js` |
| Port 5173 sudah terpakai | Edit `vite.config.ts` ubah `port: 5173` ke port lain |
| Error saat `npm install` | Pastikan Node.js versi 18+ terinstall |
