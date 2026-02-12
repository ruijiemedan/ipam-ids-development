/**
 * ============================================================
 *  IPAM Pro - Backend with Authentication
 *  Login Required | JWT Token | User Management
 * ============================================================
 */

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3001;
const JWT_SECRET = "ipam-pro-secret-key-change-in-production-2026";

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080"],
  credentials: true,
}));
app.use(express.json());

// ─── Database Config ──────────────────────────────────────────
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "ipflow_db",
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

async function connectDB() {
  try {
    pool = mysql.createPool(DB_CONFIG);
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
}

// ─── Helper Functions ─────────────────────────────────────────
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 500) => res.status(status).json({ success: false, message });

// ─── Auth Middleware ──────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return fail(res, "No token provided", 401);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return fail(res, "Invalid token", 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return fail(res, "Admin access required", 403);
  }
  next();
};

// ======================================================================
//  AUTHENTICATION
// ======================================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, "Username and password required", 400);

    const [users] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND is_active = 1",
      [username]
    );

    if (!users.length) return fail(res, "Invalid credentials", 401);
    
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) return fail(res, "Invalid credentials", 401);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return ok(res, {
      token,
      user: {
        id: String(user.id),
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    return fail(res, e.message);
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, full_name, email, role, is_active FROM users WHERE id = ?",
      [req.user.id]
    );
    
    if (!users.length) return fail(res, "User not found", 404);
    
    const user = users[0];
    return ok(res, {
      id: String(user.id),
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
    });
  } catch (e) {
    return fail(res, e.message);
  }
});

app.post("/api/auth/logout", (req, res) => {
  return ok(res, { message: "Logged out" });
});

// ======================================================================
//  USERS MANAGEMENT (Admin Only)
// ======================================================================

app.get("/api/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    return ok(res, users.map(mapUser));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.post("/api/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;
    if (!username || !password || !fullName || !email) {
      return fail(res, "Missing required fields", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, fullName, email, role || "user"]
    );

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    return ok(res, mapUser(users[0]), 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return fail(res, "Username or email already exists", 409);
    return fail(res, e.message);
  }
});

app.put("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { fullName, email, role, isActive, password } = req.body;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET full_name=?, email=?, role=?, is_active=?, password=? WHERE id=?",
        [fullName, email, role, isActive ? 1 : 0, hashedPassword, req.params.id]
      );
    } else {
      await pool.query(
        "UPDATE users SET full_name=?, email=?, role=?, is_active=? WHERE id=?",
        [fullName, email, role, isActive ? 1 : 0, req.params.id]
      );
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!users.length) return fail(res, "User not found", 404);
    
    return ok(res, mapUser(users[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.delete("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) {
      return fail(res, "Cannot delete your own account", 400);
    }
    
    const [result] = await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "User not found", 404);
    
    return ok(res, { id: req.params.id });
  } catch (e) {
    return fail(res, e.message);
  }
});

function mapUser(r) {
  return {
    id: String(r.id),
    username: r.username,
    fullName: r.full_name,
    email: r.email,
    role: r.role,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at ? r.created_at.toISOString().split("T")[0] : "",
  };
}

// ======================================================================
//  CUSTOMERS
// ======================================================================

app.get("/api/customers", authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.*, (SELECT COUNT(*) FROM subnets WHERE customer_id = c.id) AS totalAllocations
      FROM customers c
    `;
    const params = [];
    if (search) {
      sql += " WHERE c.name LIKE ? OR c.code LIKE ? OR c.contact LIKE ?";
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    sql += " ORDER BY c.created_at DESC";
    const [rows] = await pool.query(sql, params);
    return ok(res, rows.map(mapCustomer));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.get("/api/customers/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM subnets WHERE customer_id = c.id) AS totalAllocations
       FROM customers c WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, "Customer not found", 404);
    return ok(res, mapCustomer(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.post("/api/customers", authenticate, async (req, res) => {
  try {
    const { name, code, contact, phone, alamatip, kapasitas } = req.body;
    if (!name || !code) return fail(res, "Name and code required", 400);
    
    const [result] = await pool.query(
      "INSERT INTO customers (name, code, contact, phone, alamatip, kapasitas) VALUES (?, ?, ?, ?, ?, ?)",
      [name, code, contact || "", phone || "", alamatip || "", kapasitas || ""]
    );
    
    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [result.insertId]);
    return ok(res, mapCustomer({ ...rows[0], totalAllocations: 0 }), 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return fail(res, "Customer code already exists", 409);
    return fail(res, e.message);
  }
});

app.put("/api/customers/:id", authenticate, async (req, res) => {
  try {
    const { name, code, contact, phone, alamatip, kapasitas } = req.body;
    const [result] = await pool.query(
      "UPDATE customers SET name=?, code=?, contact=?, phone=?, alamatip=?, kapasitas=? WHERE id=?",
      [name, code, contact || "", phone || "", alamatip || "", kapasitas || "", req.params.id]
    );
    
    if (result.affectedRows === 0) return fail(res, "Customer not found", 404);
    
    const [rows] = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM subnets WHERE customer_id=c.id) AS totalAllocations
       FROM customers c WHERE c.id=?`,
      [req.params.id]
    );
    return ok(res, mapCustomer(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.delete("/api/customers/:id", authenticate, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM customers WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "Customer not found", 404);
    return ok(res, { id: req.params.id });
  } catch (e) {
    return fail(res, e.message);
  }
});

function mapCustomer(r) {
  return {
    id: String(r.id),
    name: r.name,
    code: r.code,
    contact: r.contact || "",
    phone: r.phone || "",
    alamatip: r.alamatip || "",
    kapasitas: r.kapasitas || "",
    totalAllocations: Number(r.totalAllocations ?? 0),
    createdAt: r.created_at ? r.created_at.toISOString().split("T")[0] : "",
  };
}

// ======================================================================
//  SUBNETS
// ======================================================================

app.get("/api/subnets", authenticate, async (req, res) => {
  try {
    const { search, customerId } = req.query;
    let sql = `
      SELECT s.*, c.name AS customerName
      FROM subnets s
      LEFT JOIN customers c ON s.customer_id = c.id
    `;
    const params = [];
    const where = [];
    
    if (search) {
      where.push("(s.network LIKE ? OR s.description LIKE ? OR c.name LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (customerId) {
      where.push("s.customer_id = ?");
      params.push(customerId);
    }
    
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY s.created_at DESC";
    
    const [rows] = await pool.query(sql, params);
    return ok(res, rows.map(mapSubnet));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.get("/api/subnets/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.name AS customerName FROM subnets s
       LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, "Subnet not found", 404);
    return ok(res, mapSubnet(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.post("/api/subnets", authenticate, async (req, res) => {
  try {
    const { network, cidr, description, vlan, gateway, totalIPs, usedIPs, status, customerId } = req.body;
    if (!network || cidr === undefined) return fail(res, "Network and CIDR required", 400);
    
    const calcTotal = totalIPs ?? Math.pow(2, 32 - Number(cidr)) - 2;
    
    const [result] = await pool.query(
      `INSERT INTO subnets (network, cidr, description, vlan, gateway, total_ips, used_ips, status, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [network, cidr, description || "", vlan || 0, gateway || "",
       calcTotal, usedIPs || 0, status || "active", customerId || null]
    );
    
    const [rows] = await pool.query(
      `SELECT s.*, c.name AS customerName FROM subnets s
       LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`,
      [result.insertId]
    );
    return ok(res, mapSubnet(rows[0]), 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return fail(res, "Subnet already exists", 409);
    return fail(res, e.message);
  }
});

app.put("/api/subnets/:id", authenticate, async (req, res) => {
  try {
    const { network, cidr, description, vlan, gateway, totalIPs, usedIPs, status, customerId } = req.body;
    
    const [result] = await pool.query(
      `UPDATE subnets SET network=?, cidr=?, description=?, vlan=?, gateway=?,
       total_ips=?, used_ips=?, status=?, customer_id=? WHERE id=?`,
      [network, cidr, description || "", vlan || 0, gateway || "",
       totalIPs, usedIPs, status, customerId || null, req.params.id]
    );
    
    if (result.affectedRows === 0) return fail(res, "Subnet not found", 404);
    
    const [rows] = await pool.query(
      `SELECT s.*, c.name AS customerName FROM subnets s
       LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`,
      [req.params.id]
    );
    return ok(res, mapSubnet(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.delete("/api/subnets/:id", authenticate, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM subnets WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return fail(res, "Subnet not found", 404);
    return ok(res, { id: req.params.id });
  } catch (e) {
    return fail(res, e.message);
  }
});

function mapSubnet(r) {
  return {
    id: String(r.id),
    network: r.network,
    cidr: Number(r.cidr),
    description: r.description || "",
    vlan: Number(r.vlan),
    gateway: r.gateway || "",
    totalIPs: Number(r.total_ips),
    usedIPs: Number(r.used_ips),
    status: r.status,
    customerId: r.customer_id ? String(r.customer_id) : undefined,
    customerName: r.customerName || undefined,
    createdAt: r.created_at ? r.created_at.toISOString().split("T")[0] : "",
  };
}

// ======================================================================
//  IP ADDRESSES (Updated: location, link_metro_e)
// ======================================================================

app.get("/api/ip-addresses", authenticate, async (req, res) => {
  try {
    const { search, subnetId, status } = req.query;
    let sql = `
      SELECT ip.*, c.name AS customerName
      FROM ip_addresses ip
      LEFT JOIN customers c ON ip.customer_id = c.id
    `;
    const params = [];
    const where = [];
    
    if (search) {
      where.push("(ip.address LIKE ? OR ip.location LIKE ? OR ip.description LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (subnetId) {
      where.push("ip.subnet_id = ?");
      params.push(subnetId);
    }
    if (status) {
      where.push("ip.status = ?");
      params.push(status);
    }
    
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY INET_ATON(ip.address)";
    
    const [rows] = await pool.query(sql, params);
    return ok(res, rows.map(mapIP));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.get("/api/ip-addresses/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ip.*, c.name AS customerName FROM ip_addresses ip
       LEFT JOIN customers c ON ip.customer_id = c.id WHERE ip.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, "IP Address not found", 404);
    return ok(res, mapIP(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.post("/api/ip-addresses", authenticate, async (req, res) => {
  try {
    const { address, subnetId, status, location, linkMetroE, customerId, description, lastSeen } = req.body;
    if (!address || !subnetId) return fail(res, "Address and subnet required", 400);
    
    const [result] = await pool.query(
      `INSERT INTO ip_addresses (address, subnet_id, status, location, link_metro_e, customer_id, description, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [address, subnetId, status || "available",
       location || "", linkMetroE || "",
       customerId || null, description || "",
       lastSeen || null]
    );
    
    await pool.query(
      `UPDATE subnets SET used_ips = (
        SELECT COUNT(*) FROM ip_addresses
        WHERE subnet_id = ? AND status NOT IN ('available','reserved')
       ) WHERE id = ?`,
      [subnetId, subnetId]
    );
    
    const [rows] = await pool.query(
      `SELECT ip.*, c.name AS customerName FROM ip_addresses ip
       LEFT JOIN customers c ON ip.customer_id = c.id WHERE ip.id = ?`,
      [result.insertId]
    );
    return ok(res, mapIP(rows[0]), 201);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return fail(res, "IP Address already exists", 409);
    return fail(res, e.message);
  }
});

app.put("/api/ip-addresses/:id", authenticate, async (req, res) => {
  try {
    const { address, subnetId, status, location, linkMetroE, customerId, description, lastSeen } = req.body;
    
    const [result] = await pool.query(
      `UPDATE ip_addresses SET address=?, subnet_id=?, status=?, location=?,
       link_metro_e=?, customer_id=?, description=?, last_seen=? WHERE id=?`,
      [address, subnetId, status,
       location || "", linkMetroE || "",
       customerId || null, description || "",
       lastSeen || null, req.params.id]
    );
    
    if (result.affectedRows === 0) return fail(res, "IP Address not found", 404);
    
    await pool.query(
      `UPDATE subnets SET used_ips = (
        SELECT COUNT(*) FROM ip_addresses
        WHERE subnet_id = ? AND status NOT IN ('available','reserved')
       ) WHERE id = ?`,
      [subnetId, subnetId]
    );
    
    const [rows] = await pool.query(
      `SELECT ip.*, c.name AS customerName FROM ip_addresses ip
       LEFT JOIN customers c ON ip.customer_id = c.id WHERE ip.id = ?`,
      [req.params.id]
    );
    return ok(res, mapIP(rows[0]));
  } catch (e) {
    return fail(res, e.message);
  }
});

app.delete("/api/ip-addresses/:id", authenticate, async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT subnet_id FROM ip_addresses WHERE id=?", [req.params.id]);
    const [result] = await pool.query("DELETE FROM ip_addresses WHERE id=?", [req.params.id]);
    
    if (result.affectedRows === 0) return fail(res, "IP Address not found", 404);
    
    if (existing.length) {
      await pool.query(
        `UPDATE subnets SET used_ips = (
          SELECT COUNT(*) FROM ip_addresses
          WHERE subnet_id = ? AND status NOT IN ('available','reserved')
         ) WHERE id = ?`,
        [existing[0].subnet_id, existing[0].subnet_id]
      );
    }
    return ok(res, { id: req.params.id });
  } catch (e) {
    return fail(res, e.message);
  }
});

function mapIP(r) {
  return {
    id: String(r.id),
    address: r.address,
    subnetId: String(r.subnet_id),
    status: r.status,
    location: r.location || "",
    linkMetroE: r.link_metro_e || "",
    customerId: r.customer_id ? String(r.customer_id) : undefined,
    customerName: r.customerName || undefined,
    description: r.description || "",
    lastSeen: r.last_seen ? r.last_seen.toISOString().split("T")[0] : "",
  };
}

// ======================================================================
//  DASHBOARD
// ======================================================================

app.get("/api/dashboard", authenticate, async (req, res) => {
  try {
    const [[subnetStats]] = await pool.query(`
      SELECT COUNT(*) AS totalSubnets, COALESCE(SUM(total_ips), 0) AS totalIPs,
             COALESCE(SUM(used_ips), 0) AS usedIPs FROM subnets
    `);
    const [[custStats]] = await pool.query("SELECT COUNT(*) AS totalCustomers FROM customers");
    const [[alertStats]] = await pool.query(`
      SELECT COUNT(*) AS activeAlerts FROM subnets
      WHERE total_ips > 0 AND (used_ips / total_ips) >= 0.80
    `);
    
    const totalIPs = Number(subnetStats.totalIPs);
    const usedIPs = Number(subnetStats.usedIPs);
    
    return ok(res, {
      totalSubnets: Number(subnetStats.totalSubnets),
      totalIPs,
      usedIPs,
      availableIPs: totalIPs - usedIPs,
      utilizationPercent: totalIPs > 0 ? Math.round((usedIPs / totalIPs) * 1000) / 10 : 0,
      totalCustomers: Number(custStats.totalCustomers),
      activeAlerts: Number(alertStats.activeAlerts),
    });
  } catch (e) {
    return fail(res, e.message);
  }
});

app.get("/api/health", (req, res) => ok(res, { status: "ok", time: new Date() }));

// ─── Start Server ─────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 IPAM Pro Backend: http://localhost:${PORT}`);
    console.log(`   🔐 Authentication: Enabled`);
    console.log(`   📡 Endpoints: /api/auth, /api/users, /api/customers, /api/subnets, /api/ip-addresses\n`);
  });
});
