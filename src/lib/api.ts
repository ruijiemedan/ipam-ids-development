import { Subnet, IPAddress, Customer, DashboardStats, User, LoginRequest, LoginResponse } from "@/types/ipam";

const BASE_URL = "/api";

const getToken = () => localStorage.getItem("token");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
  const json = await res.json();
  
  if (!res.ok || !json.success) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  // Auth
  login: (data: LoginRequest): Promise<LoginResponse> =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: (): Promise<void> =>
    request("/auth/logout", { method: "POST" }),
  getMe: (): Promise<User> =>
    request("/auth/me"),

  // Users
  getUsers: (): Promise<User[]> => request("/users"),
  createUser: (body: Partial<User> & { password: string }): Promise<User> =>
    request("/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: string, body: Partial<User> & { password?: string }): Promise<User> =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id: string): Promise<{ id: string }> =>
    request(`/users/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: (): Promise<DashboardStats> => request("/dashboard"),

  // Customers
  getCustomers: (search?: string): Promise<Customer[]> =>
    request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCustomer: (id: string): Promise<Customer> => request(`/customers/${id}`),
  createCustomer: (body: Omit<Customer, "id" | "totalAllocations" | "createdAt">): Promise<Customer> =>
    request("/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id: string, body: Partial<Customer>): Promise<Customer> =>
    request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomer: (id: string): Promise<{ id: string }> =>
    request(`/customers/${id}`, { method: "DELETE" }),

  // Subnets
  getSubnets: (params?: { search?: string; customerId?: string }): Promise<Subnet[]> => {
    const filtered = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null && v !== ""));
    const q = new URLSearchParams(filtered).toString();
    return request(`/subnets${q ? `?${q}` : ""}`);
  },
  getSubnet: (id: string): Promise<Subnet> => request(`/subnets/${id}`),
  createSubnet: (body: Omit<Subnet, "id" | "createdAt">): Promise<Subnet> =>
    request("/subnets", { method: "POST", body: JSON.stringify(body) }),
  updateSubnet: (id: string, body: Partial<Subnet>): Promise<Subnet> =>
    request(`/subnets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSubnet: (id: string): Promise<{ id: string }> =>
    request(`/subnets/${id}`, { method: "DELETE" }),

  // IP Addresses
  getIPAddresses: (params?: { search?: string; subnetId?: string; status?: string }): Promise<IPAddress[]> => {
    const filtered = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v != null && v !== ""));
    const q = new URLSearchParams(filtered).toString();
    return request(`/ip-addresses${q ? `?${q}` : ""}`);
  },
  getIPAddress: (id: string): Promise<IPAddress> => request(`/ip-addresses/${id}`),
  createIPAddress: (body: Omit<IPAddress, "id">): Promise<IPAddress> =>
    request("/ip-addresses", { method: "POST", body: JSON.stringify(body) }),
  updateIPAddress: (id: string, body: Partial<IPAddress>): Promise<IPAddress> =>
    request(`/ip-addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteIPAddress: (id: string): Promise<{ id: string }> =>
    request(`/ip-addresses/${id}`, { method: "DELETE" }),
};

export default api;
