// Updated types dengan User dan field changes (location, linkMetroE)

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
}

export interface Subnet {
  id: string;
  network: string;
  cidr: number;
  description: string;
  vlan: number;
  gateway: string;
  totalIPs: number;
  usedIPs: number;
  status: "active" | "reserved" | "full" | "deprecated";
  customerId?: string;
  customerName?: string;
  createdAt: string;
}

export interface IPAddress {
  id: string;
  address: string;
  subnetId: string;
  status: "active" | "inactive" | "reserved" | "gateway" | "available";
  location: string;        // dulu: hostname
  linkMetroE: string;      // dulu: macAddress
  customerId?: string;
  customerName?: string;
  description: string;
  lastSeen: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  alamatip: string;
  kapasitas: string;
  totalAllocations: number;
  createdAt: string;
}

export interface DashboardStats {
  totalSubnets: number;
  totalIPs: number;
  usedIPs: number;
  availableIPs: number;
  utilizationPercent: number;
  totalCustomers: number;
  activeAlerts: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
