# 🔐 IPAM Pro - Full Version dengan Login & Edit Features

## 🚨 PENTING - Perubahan Besar dari Versi Sebelumnya

Versi ini adalah **UPGRADE BESAR** dengan fitur lengkap:

### ✨ Fitur Baru
1. **🔐 Sistem Login** - Hanya user terdaftar yang bisa akses
2. **👥 User Management** - Kelola user & hak akses
3. **✏️ Edit Button** - Edit data di Customers, Subnets, IP Addresses
4. **🔄 Field Update** - hostname → location, mac_address → link_metro_e

---

## 📦 Yang Sudah Termasuk

### Database (setup_database_v2.sql)
```sql
- Tabel `users` (id, username, password, full_name, email, role)
- Tabel `customers` (tidak berubah)
- Tabel `subnets` (tidak berubah)
- Tabel `ip_addresses` (field: location, link_metro_e)
```

### Backend (server.js)
```
+ POST /api/auth/login       - Login dengan username/password
+ POST /api/auth/logout      - Logout
+ GET  /api/auth/me          - Cek user login
+ GET  /api/users            - List semua user (admin only)
+ POST /api/users            - Tambah user baru (admin only)
+ PUT  /api/users/:id        - Edit user (admin only)  
+ DELETE /api/users/:id      - Hapus user (admin only)
```

### Frontend
```
+ LoginPage.tsx              - Halaman login
+ UsersPage.tsx              - Manajemen user (admin only)
+ ProtectedRoute.tsx         - Route guard
+ AuthContext.tsx            - State management login
+ EditCustomerDialog.tsx     - Dialog edit customer
+ EditSubnetDialog.tsx       - Dialog edit subnet
+ EditIPDialog.tsx           - Dialog edit IP address
```

---

## 🔧 Cara Install & Jalankan

### 1. Setup Database Baru
```bash
# DROP database lama jika ada
mysql -u root -p -e "DROP DATABASE IF EXISTS ipflow_db"

# Import database baru
mysql -u root -p < backend/setup_database_v2.sql
```

**CATATAN**: File SQL baru sudah include tabel `users` dengan 2 user default.

### 2. Install Dependencies Backend
```bash
cd backend
npm install
# Akan install: bcryptjs, jsonwebtoken, express, mysql2, cors
```

### 3. Edit Konfigurasi MySQL
Buka `backend/server.js`, ubah:
```js
const DB_CONFIG = {
  user: "root",          // ← MySQL user Anda
  password: "password",  // ← MySQL password Anda
  ...
};
```

### 4. Jalankan Backend
```bash
cd backend
npm start
```

### 5. Install Dependencies Frontend
```bash
# di root folder ipflow-final
npm install
```

### 6. Jalankan Frontend  
```bash
npm run dev
```

Buka: **http://localhost:5173**

---

## 👤 Login Credentials

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| user1    | admin123  | user  |

**Role:**
- `admin` → Akses penuh termasuk User Management
- `user` → Akses view & edit data (tidak bisa manage users)

---

## 📁 Struktur File Baru

```
ipflow-final/
├── backend/
│   ├── server.js                  ← Updated: Auth + Users endpoints
│   ├── setup_database_v2.sql      ← NEW: Include tabel users
│   └── package.json               ← Updated: +bcryptjs +jsonwebtoken
│
├── src/
│   ├── context/
│   │   └── AuthContext.tsx        ← NEW: Login state management
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx     ← NEW: Route guard
│   │   ├── EditCustomerDialog.tsx ← NEW: Edit customer
│   │   ├── EditSubnetDialog.tsx   ← NEW: Edit subnet
│   │   └── EditIPDialog.tsx       ← NEW: Edit IP address
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx          ← NEW: Halaman login
│   │   ├── UsersPage.tsx          ← NEW: User management
│   │   ├── CustomersPage.tsx      ← Updated: +Edit button
│   │   ├── SubnetsPage.tsx        ← Updated: +Edit button
│   │   └── IPAddressesPage.tsx    ← Updated: +Edit, location, link_metro_e
│   │
│   ├── types/
│   │   └── ipam.ts                ← Updated: +User type, field changes
│   │
│   ├── lib/
│   │   └── api.ts                 ← Updated: +auth & users endpoints
│   │
│   └── App.tsx                    ← Updated: Login routes + AuthProvider
│
└── CARA_MENJALANKAN_V2.md         ← Guide lengkap versi baru
```

---

## 🔐 Flow Autentikasi

```
1. User buka http://localhost:5173
2. Redirect otomatis ke /login
3. Login dengan username/password
4. Backend verify & return JWT token
5. Token disimpan di localStorage
6. Setiap request API include token di header
7. Logout → clear token dari localStorage
```

---

## ⚠️ Troubleshooting

### "Login gagal"
✅ Pastikan backend sudah running
✅ Cek username/password (case-sensitive)
✅ Lihat console browser untuk error detail

### "Unauthorized" saat akses halaman
✅ Token expired → logout & login ulang
✅ Clear browser localStorage → F12 → Application → Local Storage → Clear

### Field `location` atau `link_metro_e` tidak muncul
✅ Pastikan pakai database baru (`setup_database_v2.sql`)
✅ Jangan import database lama

### User Management tidak muncul
✅ Hanya role `admin` yang bisa akses
✅ Login dengan user `admin` (bukan `user1`)

---

## 📝 API Documentation

### Authentication

**POST /api/auth/login**
```json
Request:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "username": "admin",
      "fullName": "Administrator",
      "email": "admin@ipampro.com",
      "role": "admin"
    }
  }
}
```

**GET /api/auth/me**
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "1",
    "username": "admin",
    ...
  }
}
```

### Users (Admin Only)

**GET /api/users**
**POST /api/users** - Body: { username, password, fullName, email, role }
**PUT /api/users/:id** - Body: { fullName, email, role, isActive }
**DELETE /api/users/:id**

---

## 🎯 Next Steps

Setelah berhasil running:

1. ✅ Login dengan `admin` / `admin123`
2. ✅ Buka Dashboard → lihat stats
3. ✅ Buka Customers → coba Edit & Delete
4. ✅ Buka Subnets → coba Add & Edit
5. ✅ Buka IP Addresses → cek field `Location` & `Link Metro-E`
6. ✅ Buka Users (admin only) → coba tambah user baru
7. ✅ Test login dengan user baru

---

## 🔄 Upgrade dari Versi Lama

Jika Anda sudah punya versi sebelumnya:

```bash
# 1. Backup database lama
mysqldump -u root -p ipflow_db > backup_old.sql

# 2. Drop & recreate dengan schema baru
mysql -u root -p -e "DROP DATABASE ipflow_db"
mysql -u root -p < backend/setup_database_v2.sql

# 3. Jika perlu, import data lama manual via phpMyAdmin
```

---

**Happy IP Address Managing! 🎉**
