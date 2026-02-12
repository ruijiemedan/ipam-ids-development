import { useState } from "react";
import { Globe, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function IPAddressesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [subnetFilter, setSubnetFilter] = useState(searchParams.get("subnet") || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editIP, setEditIP] = useState<any>(null);
  const [form, setForm] = useState({
    address: "", subnetId: searchParams.get("subnet") || "",
    status: "active", location: "", linkMetroE: "",
    customerId: "", description: "", lastSeen: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const queryParams: any = {};
  if (search) queryParams.search = search;
  if (subnetFilter !== "all") queryParams.subnetId = subnetFilter;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: ipAddresses = [], isLoading } = useQuery({
    queryKey: ["ip-addresses", queryParams],
    queryFn: () => api.getIPAddresses(queryParams),
  });

  const { data: subnets = [] } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => api.getSubnets(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers(),
  });

  const selectedSubnet = subnetFilter !== "all" ? subnets.find((s) => s.id === subnetFilter) : null;

  const createMutation = useMutation({
    mutationFn: () => api.createIPAddress(form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); resetForm();
      toast({ title: "IP Address added successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateIPAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); resetForm();
      toast({ title: "IP Address updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteIPAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "IP Address deleted successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ address: "", subnetId: "", status: "active", location: "", linkMetroE: "", customerId: "", description: "", lastSeen: "" });
    setEditIP(null);
  };

  const handleSubmit = () => {
    if (!form.address || !form.subnetId) {
      toast({ title: "IP Address and Subnet required", variant: "destructive" });
      return;
    }
    if (editIP) {
      updateMutation.mutate({ id: editIP.id, data: form });
    } else {
      createMutation.mutate();
    }
  };

  const openEditDialog = (ip: any) => {
    setEditIP(ip);
    setForm(ip);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> IP Addresses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {selectedSubnet
              ? `Subnet ${selectedSubnet.network}/${selectedSubnet.cidr} — ${selectedSubnet.description}`
              : `${ipAddresses.length} addresses configured`}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => resetForm()}>
                <Plus className="w-4 h-4" /> Add IP
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editIP ? "Edit IP Address" : "Add New IP Address"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>IP Address *</Label>
                  <Input placeholder="e.g. 10.0.0.100" className="font-mono bg-secondary border-border"
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Subnet *</Label>
                  <Select value={form.subnetId} onValueChange={(v) => setForm({ ...form, subnetId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Subnet" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {subnets.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-mono">{s.network}/{s.cidr}</span> — {s.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="gateway">Gateway</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Customer</Label>
                    <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v === "none" ? "" : v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">None</SelectItem>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Input placeholder="e.g. gw-core-01" className="font-mono bg-secondary border-border"
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Link Metro-E / Satellite</Label>
                  <Input placeholder="e.g. AA:BB:CC:DD:EE:FF" className="font-mono bg-secondary border-border"
                    value={form.linkMetroE} onChange={(e) => setForm({ ...form, linkMetroE: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input placeholder="e.g. Core Gateway" className="bg-secondary border-border"
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editIP ? "Update IP Address" : "Save IP Address"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search IP, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs bg-secondary border-border" />
        <Select value={subnetFilter} onValueChange={setSubnetFilter}>
          <SelectTrigger className="w-52 bg-secondary border-border"><SelectValue placeholder="All Subnets" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Subnets</SelectItem>
            {subnets.map((s) => (
              <SelectItem key={s.id} value={s.id}><span className="font-mono text-sm">{s.network}/{s.cidr}</span></SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="gateway">Gateway</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="gradient-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>IP Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Link Metro-E / Satellite</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(isAdmin ? 8 : 7)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-secondary/50 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : ipAddresses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">No IP addresses found</TableCell>
              </TableRow>
            ) : (
              ipAddresses.map((ip) => (
                <TableRow key={ip.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="ip-text text-foreground font-medium">{ip.address}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{ip.location || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{ip.linkMetroE || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ip.customerName || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{ip.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ip.lastSeen || "—"}</TableCell>
                  <TableCell><StatusBadge status={ip.status} /></TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditDialog(ip)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(ip.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
