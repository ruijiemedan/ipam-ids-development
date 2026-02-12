import { useState } from "react";
import { Network, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UtilizationBar } from "@/components/UtilizationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function SubnetsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editSubnet, setEditSubnet] = useState<any>(null);
  const [form, setForm] = useState({
    network: "", cidr: "24", description: "", vlan: "", gateway: "",
    status: "active", customerId: "",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: subnets = [], isLoading } = useQuery({
    queryKey: ["subnets", search],
    queryFn: () => api.getSubnets(search ? { search } : undefined),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const cidr = parseInt(data.cidr);
      const totalIPs = Math.pow(2, 32 - cidr) - 2;
      return api.createSubnet({
        network: data.network, cidr, description: data.description,
        vlan: parseInt(data.vlan) || 0, gateway: data.gateway,
        totalIPs, usedIPs: 0, status: data.status as any,
        customerId: data.customerId || undefined,
        customerName: undefined, createdAt: "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); resetForm();
      toast({ title: "Subnet added successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateSubnet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); resetForm();
      toast({ title: "Subnet updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSubnet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Subnet deleted successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ network: "", cidr: "24", description: "", vlan: "", gateway: "", status: "active", customerId: "" });
    setEditSubnet(null);
  };

  const handleSubmit = () => {
    if (!form.network || !form.cidr) {
      toast({ title: "Network and CIDR required", variant: "destructive" });
      return;
    }
    if (editSubnet) {
      const cidr = parseInt(form.cidr);
      const totalIPs = Math.pow(2, 32 - cidr) - 2;
      updateMutation.mutate({
        id: editSubnet.id,
        data: { network: form.network, cidr, description: form.description,
          vlan: parseInt(form.vlan) || 0, gateway: form.gateway,
          totalIPs, usedIPs: editSubnet.usedIPs, status: form.status,
          customerId: form.customerId || undefined,
        },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEditDialog = (subnet: any) => {
    setEditSubnet(subnet);
    setForm({
      network: subnet.network, cidr: String(subnet.cidr),
      description: subnet.description, vlan: String(subnet.vlan),
      gateway: subnet.gateway, status: subnet.status,
      customerId: subnet.customerId || "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" /> Subnet Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subnets.length} subnets configured</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => resetForm()}>
                <Plus className="w-4 h-4" /> Add Subnet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editSubnet ? "Edit Subnet" : "Add New Subnet"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Network Address *</Label>
                  <Input placeholder="e.g. 10.0.0.0" className="font-mono bg-secondary border-border"
                    value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>CIDR *</Label>
                    <Input type="number" min="1" max="32" placeholder="24" className="font-mono bg-secondary border-border"
                      value={form.cidr} onChange={(e) => setForm({ ...form, cidr: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>VLAN</Label>
                    <Input type="number" placeholder="100" className="font-mono bg-secondary border-border"
                      value={form.vlan} onChange={(e) => setForm({ ...form, vlan: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input placeholder="e.g. Core Infrastructure" className="bg-secondary border-border"
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Gateway</Label>
                  <Input placeholder="e.g. 10.0.0.1" className="font-mono bg-secondary border-border"
                    value={form.gateway} onChange={(e) => setForm({ ...form, gateway: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="deprecated">Deprecated</SelectItem>
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
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editSubnet ? "Update Subnet" : "Create Subnet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Input placeholder="Search subnets..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm bg-secondary border-border" />

      <div className="gradient-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Network</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>VLAN</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(isAdmin ? 8 : 7)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-secondary/50 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : subnets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  No subnets found
                </TableCell>
              </TableRow>
            ) : (
              subnets.map((subnet) => (
                <TableRow key={subnet.id} className="border-border hover:bg-secondary/50 transition-colors">
                  <TableCell className="ip-text text-foreground font-medium cursor-pointer"
                    onClick={() => navigate(`/ip-addresses?subnet=${subnet.id}`)}>
                    {subnet.network}/{subnet.cidr}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{subnet.description}</TableCell>
                  <TableCell className="font-mono text-sm text-foreground">{subnet.vlan || "—"}</TableCell>
                  <TableCell className="ip-text text-muted-foreground">{subnet.gateway}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{subnet.customerName || "—"}</TableCell>
                  <TableCell className="w-40">
                    <UtilizationBar used={subnet.usedIPs} total={subnet.totalIPs} showPercent />
                  </TableCell>
                  <TableCell><StatusBadge status={subnet.status} /></TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditDialog(subnet)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(subnet.id)} disabled={deleteMutation.isPending}>
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
