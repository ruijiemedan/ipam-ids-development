-- ============================================================
--  IPAM Pro - Database dengan field alamatip & kapasitas
-- ============================================================

CREATE DATABASE IF NOT EXISTS ipflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ipflow_db;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  role        ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Customers (dengan alamatip & kapasitas) ─────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  contact     VARCHAR(100) DEFAULT '',
  phone       VARCHAR(30)  DEFAULT '',
  alamatip    VARCHAR(60)  DEFAULT NULL,
  kapasitas   VARCHAR(60)  DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Subnets ─────────────────────────────────────────────────
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

-- ─── IP Addresses ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_addresses (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  address       VARCHAR(45)  NOT NULL UNIQUE,
  subnet_id     INT UNSIGNED NOT NULL,
  status        ENUM('active','inactive','reserved','gateway','available') NOT NULL DEFAULT 'available',
  location      VARCHAR(100) DEFAULT '',
  link_metro_e  VARCHAR(100) DEFAULT '',
  customer_id   INT UNSIGNED DEFAULT NULL,
  description   VARCHAR(200) DEFAULT '',
  last_seen     DATE         DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ip_subnet FOREIGN KEY (subnet_id)
    REFERENCES subnets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ip_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_subnet_id (subnet_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  SEED DATA
-- ============================================================

-- Default users (password: admin123)
INSERT INTO users (username, password, full_name, email, role, is_active) VALUES
  ('admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Administrator', 'admin@ipampro.com', 'admin', TRUE),
  ('user1', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'User Demo', 'user@ipampro.com', 'user', TRUE)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- Customers
INSERT INTO customers (name, code, contact, phone, alamatip, kapasitas, created_at) VALUES
  ('PT. Telkom Indonesia',  'TLKM', 'admin@telkom.co.id',      '+62-21-12345678', NULL, NULL, '2024-01-15'),
  ('PT. Biznet Networks',   'BIZN', 'noc@biznetnetworks.com',   '+62-21-87654321', NULL, NULL, '2024-02-20'),
  ('PT. Indosat Ooredoo',   'ISAT', 'noc@indosat.com',          '+62-21-55667788', NULL, NULL, '2024-03-10'),
  ('PT. XL Axiata',         'EXCL', 'network@xl.co.id',         '+62-21-99887766', NULL, NULL, '2024-04-05'),
  ('PT. CBN Fiber',         'CBNF', 'support@cbn.id',           '+62-21-11223344', NULL, NULL, '2024-05-12'),
  ('Berca',                 'KEE',  'Berca@gmail.com',          '081212124324343',  NULL, NULL, '2026-02-11'),
  ('PT. Berca Perkasa7',    'PTBP7','berca7@example.com',       '0833434343437', '103.138.116.247', '207 Mbps', '2026-02-12')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Subnets
INSERT INTO subnets (network, cidr, description, vlan, gateway, total_ips, used_ips, status, customer_id, created_at) VALUES
  ('10.0.0.0',          24, 'Core Infrastructure',  100, '10.0.0.1',        254, 5, 'active',   1, '2024-01-15'),
  ('10.0.1.0',          24, 'Customer Peering',     200, '10.0.1.1',        254, 3, 'active',   2, '2024-02-01'),
  ('172.16.0.0',        22, 'Data Center Block A',  300, '172.16.0.1',     1022, 756, 'active', 3, '2024-02-15'),
  ('192.168.10.0',      25, 'Management Network',   999, '192.168.10.1',    126, 45, 'active',NULL, '2024-03-01'),
  ('10.10.0.0',         23, 'Transit Network',      150, '10.10.0.1',       510, 510, 'full',   4, '2024-03-20'),
  ('10.20.0.0',         24, 'Reserved Block',         0, '10.20.0.1',       254, 0, 'reserved',NULL, '2024-04-01'),
  ('103.138.116.248',   32, 'Berca',                  0, '103.138.116.248',   0, 1, 'active',NULL, '2026-02-12')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- IP Addresses
INSERT INTO ip_addresses (address, subnet_id, status, location, link_metro_e, customer_id, description, last_seen) VALUES
  ('10.0.0.3',  1, 'active',   'sw-core-02',      'AA:BB:CC:DD:EE:03',    1, 'Core Switch 2',        '2024-12-01'),
  ('10.0.0.4',  1, 'active',   'rt-edge-01',      'AA:BB:CC:DD:EE:04', NULL, 'Edge Router',          '2024-12-01'),
  ('10.0.0.5',  1, 'reserved', '',                '',                  NULL, 'Reserved for expansion',NULL),
  ('10.0.0.10', 1, 'active',   'dns-01',          'AA:BB:CC:DD:EE:10', NULL, 'Primary DNS',          '2024-12-01'),
  ('10.0.0.11', 1, 'active',   'dns-02',          'AA:BB:CC:DD:EE:11', NULL, 'Secondary DNS',        '2024-12-01'),
  ('10.0.1.1',  2, 'gateway',  'gw-peer-01',      'BB:CC:DD:EE:FF:01', NULL, 'Peering Gateway',      '2024-12-01'),
  ('10.0.1.10', 2, 'active',   'peer-biznet-01',  'BB:CC:DD:EE:FF:10',    2, 'Biznet Peering Port',  '2024-12-01'),
  ('14.14.14.14', 2, 'active', 'gw-core-01234',   'AA:BB:CC:DD:EE:0132343', NULL, 'Core Gateway ING', '2024-11-28'),
  ('103.138.116.248', 7, 'active', 'PoP Rindan Permai', 'Metro-E Icon', NULL, 'Core', NULL)
ON DUPLICATE KEY UPDATE location = VALUES(location);

SELECT 'Database ipflow_db created successfully!' AS status;
