# 🔐 IPAM Pro - Fixed Role-Based Access Control

## ✅ FIXED: Authorization berdasarkan Role

### Role Admin
- ✅ **Full Access**: Create, Edit, Delete semua data
- ✅ Akses User Management
- ✅ Melihat tombol Add, Edit, Delete di semua halaman

### Role User  
- ✅ **Read-Only Access**: Hanya bisa VIEW data
- ❌ TIDAK ada tombol Add Customer
- ❌ TIDAK ada tombol Edit (pensil)
- ❌ TIDAK ada tombol Delete (sampah)
- ❌ TIDAK bisa akses halaman Users

---

## 🆕 Field Baru di Customer

Sesuai database Anda, ditambahkan 2 field baru:
1. **Alamat IP** - untuk mencatat alamat IP customer
2. **Kapasitas Langganan** - untuk mencatat bandwidth/kapasitas

---

## 🚀 Cara Install

### 1. Extract ZIP
```bash
unzip IPAM-PRO-FIXED.zip
cd ipam-pro-fixed
```

### 2. Setup Database
```bash
mysql -u root -p < backend/setup_database_v2.sql
```

Atau import manual via phpMyAdmin.

### 3. Edit MySQL Config
Buka `backend/server.js`, edit:
```js
const DB_CONFIG = {
  user: "root",          // ← MySQL user
  password: "",          // ← MySQL password
  ...
};
```

### 4. Install & Run Backend
```bash
cd backend
npm install
npm start
```

Output:
```
✅ Connected to MySQL
🚀 IPAM Pro Backend: http://localhost:3001
   🔐 Authentication: Enabled
```

### 5. Install & Run Frontend
```bash
# Terminal baru, di folder root
npm install
npm run dev
```

Buka: **http://localhost:5173**

---

## 👤 Test Login

### Test sebagai Admin (Full Access)
```
Username: admin
Password: admin123
```

**Yang terlihat:**
- ✅ Tombol "+ Add Customer" 
- ✅ Tombol Edit (pensil) di setiap card/row
- ✅ Tombol Delete (sampah) di setiap card/row
- ✅ Menu "Users" di sidebar

### Test sebagai User (Read-Only)
```
Username: user1
Password: admin123
```

**Yang terlihat:**
- ✅ Bisa lihat semua data
- ❌ TIDAK ada tombol "+ Add Customer"
- ❌ TIDAK ada tombol Edit
- ❌ TIDAK ada tombol Delete
- ❌ TIDAK ada menu "Users" di sidebar

---

## 📝 Checklist Test

### Test Admin Role
- [ ] Login dengan admin/admin123
- [ ] Buka Customers → ada tombol "+ Add Customer"
- [ ] Klik card customer → ada tombol Edit & Delete
- [ ] Coba Add customer baru → BERHASIL
- [ ] Coba Edit customer → BERHASIL
- [ ] Coba Delete customer → BERHASIL
- [ ] Buka menu Users → MUNCUL
- [ ] Buka Subnets → ada tombol Add/Edit/Delete
- [ ] Buka IP Addresses → ada tombol Add/Edit/Delete

### Test User Role
- [ ] Logout → Login dengan user1/admin123
- [ ] Buka Customers → TIDAK ada tombol "+ Add Customer"
- [ ] Lihat card customer → TIDAK ada tombol Edit & Delete
- [ ] Buka Subnets → TIDAK ada tombol Add/Edit/Delete
- [ ] Buka IP Addresses → TIDAK ada tombol Add/Edit/Delete
- [ ] Cek sidebar → TIDAK ada menu "Users"
- [ ] Semua data tetap bisa dilihat (read-only)

---

## 🔧 Troubleshooting

### "Masih ada tombol Edit/Delete padahal login sebagai user"
✅ Clear browser cache (Ctrl+Shift+Del)
✅ Logout → Login ulang
✅ Hard refresh (Ctrl+F5)

### "Database error"
✅ Pastikan pakai `setup_database_v2.sql` (bukan yang lama)
✅ Drop database lama dulu: `DROP DATABASE ipflow_db;`
✅ Import ulang

### "Backend tidak jalan"
✅ Cek MySQL sudah running
✅ Cek konfigurasi DB_CONFIG di server.js

---

## 📊 Database Schema Update

Tabel `customers` sekarang punya field tambahan:
```sql
alamatip   VARCHAR(60)  -- Alamat IP customer
kapasitas  VARCHAR(60)  -- Kapasitas langganan
```

---

## 🎯 Summary

| Fitur | Admin | User |
|-------|:-----:|:----:|
| View Data | ✅ | ✅ |
| Create Data | ✅ | ❌ |
| Edit Data | ✅ | ❌ |
| Delete Data | ✅ | ❌ |
| User Management | ✅ | ❌ |
| Tombol Add | ✅ | ❌ |
| Tombol Edit | ✅ | ❌ |
| Tombol Delete | ✅ | ❌ |

---

**Selamat menggunakan! 🎉**
