-- ============================================================
--  IPFlow Connect - Database Setup
--  Jalankan di MySQL: mysql -u root -p < setup_database.sql
--  Atau copy-paste di MySQL Workbench / phpMyAdmin / DBeaver
-- ============================================================

-- Buat database
CREATE DATABASE IF NOT EXISTS ipflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ipflow_db;

-- ─── Tabel customers ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  contact     VARCHAR(100) DEFAULT '',
  phone       VARCHAR(30)  DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel subnets ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subnets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  network     VARCHAR(45)  NOT NULL,
  cidr        TINYINT UNSIGNED NOT NULL,
  description VARCHAR(200) DEFAULT '',
  vlan        SMALLINT UNSIGNED DEFAULT 0,
  gateway     VARCHAR(45)  DEFAULT '',
  total_ips   INT UNSIGNED DEFAULT 0,
  used_ips    INT UNSIGNED DEFAULT 0,
  status      ENUM('active','reserved','full','deprecated') NOT NULL DEFAULT 'active',
  customer_id INT UNSIGNED DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subnet_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uq_subnet (network, cidr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Tabel ip_addresses ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_addresses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  address     VARCHAR(45)  NOT NULL UNIQUE,
  subnet_id   INT UNSIGNED NOT NULL,
  status      ENUM('active','inactive','reserved','gateway','available') NOT NULL DEFAULT 'available',
  hostname    VARCHAR(100) DEFAULT '',
  mac_address VARCHAR(20)  DEFAULT '',
  customer_id INT UNSIGNED DEFAULT NULL,
  description VARCHAR(200) DEFAULT '',
  last_seen   DATE         DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ip_subnet FOREIGN KEY (subnet_id)
    REFERENCES subnets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ip_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_subnet_id (subnet_id),
  INDEX idx_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  SEED DATA (Data Awal / Contoh)
-- ============================================================

-- Customers
INSERT INTO customers (name, code, contact, phone, created_at) VALUES
  ('PT. Telkom Indonesia',  'TLKM', 'admin@telkom.co.id',      '+62-21-12345678', '2024-01-15'),
  ('PT. Biznet Networks',   'BIZN', 'noc@biznetnetworks.com',   '+62-21-87654321', '2024-02-20'),
  ('PT. Indosat Ooredoo',   'ISAT', 'noc@indosat.com',          '+62-21-55667788', '2024-03-10'),
  ('PT. XL Axiata',         'EXCL', 'network@xl.co.id',         '+62-21-99887766', '2024-04-05'),
  ('PT. CBN Fiber',         'CBNF', 'support@cbn.id',           '+62-21-11223344', '2024-05-12')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Subnets
INSERT INTO subnets (network, cidr, description, vlan, gateway, total_ips, used_ips, status, customer_id, created_at) VALUES
  ('10.0.0.0',     24, 'Core Infrastructure',  100,   '10.0.0.1',     254,  187, 'active',     1, '2024-01-15'),
  ('10.0.1.0',     24, 'Customer Peering',     200,   '10.0.1.1',     254,   98, 'active',     2, '2024-02-01'),
  ('172.16.0.0',   22, 'Data Center Block A',  300,   '172.16.0.1',  1022,  756, 'active',     3, '2024-02-15'),
  ('192.168.10.0', 25, 'Management Network',   999,   '192.168.10.1', 126,   45, 'active',  NULL, '2024-03-01'),
  ('10.10.0.0',    23, 'Transit Network',      150,   '10.10.0.1',    510,  510, 'full',       4, '2024-03-20'),
  ('10.20.0.0',    24, 'Reserved Block',         0,   '10.20.0.1',    254,    0, 'reserved', NULL, '2024-04-01')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- IP Addresses (menggunakan subquery untuk dapat ID subnet)
INSERT INTO ip_addresses (address, subnet_id, status, hostname, mac_address, customer_id, description, last_seen) VALUES
  ('10.0.0.1',  (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'gateway',  'gw-core-01',     'AA:BB:CC:DD:EE:01', NULL, 'Core Gateway',         '2024-12-01'),
  ('10.0.0.2',  (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'active',   'sw-core-01',     'AA:BB:CC:DD:EE:02',    1, 'Core Switch 1',        '2024-12-01'),
  ('10.0.0.3',  (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'active',   'sw-core-02',     'AA:BB:CC:DD:EE:03',    1, 'Core Switch 2',        '2024-12-01'),
  ('10.0.0.4',  (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'active',   'rt-edge-01',     'AA:BB:CC:DD:EE:04', NULL, 'Edge Router',          '2024-12-01'),
  ('10.0.0.5',  (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'reserved', '',               '',                  NULL, 'Reserved for expansion',NULL),
  ('10.0.0.10', (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'active',   'dns-01',         'AA:BB:CC:DD:EE:10', NULL, 'Primary DNS',          '2024-12-01'),
  ('10.0.0.11', (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'active',   'dns-02',         'AA:BB:CC:DD:EE:11', NULL, 'Secondary DNS',        '2024-12-01'),
  ('10.0.0.50', (SELECT id FROM subnets WHERE network='10.0.0.0'  AND cidr=24), 'inactive', 'old-server',     'AA:BB:CC:DD:EE:50', NULL, 'Decommissioned',       '2024-06-15'),
  ('10.0.1.1',  (SELECT id FROM subnets WHERE network='10.0.1.0'  AND cidr=24), 'gateway',  'gw-peer-01',     'BB:CC:DD:EE:FF:01', NULL, 'Peering Gateway',      '2024-12-01'),
  ('10.0.1.10', (SELECT id FROM subnets WHERE network='10.0.1.0'  AND cidr=24), 'active',   'peer-biznet-01', 'BB:CC:DD:EE:FF:10',    2, 'Biznet Peering Port',  '2024-12-01')
ON DUPLICATE KEY UPDATE hostname = VALUES(hostname);

-- ============================================================
SELECT 'Database ipflow_db berhasil dibuat dan data seed telah dimasukkan!' AS status;
