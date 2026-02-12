import { useState } from "react";
import { Users, Plus, Mail, Phone, Trash2, Edit2, Loader2, MapPin, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", contact: "", phone: "", alamatip: "", kapasitas: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => api.getCustomers(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      resetForm();
      toast({ title: "Customer added successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      resetForm();
      toast({ title: "Customer updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Customer deleted successfully" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ name: "", code: "", contact: "", phone: "", alamatip: "", kapasitas: "" });
    setEditCustomer(null);
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) {
      toast({ title: "Name and Code required", variant: "destructive" });
      return;
    }
    if (editCustomer) {
      updateMutation.mutate({ id: editCustomer.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEditDialog = (customer: any) => {
    setEditCustomer(customer);
    setForm(customer);
    setOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} registered customers</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={openAddDialog}>
                <Plus className="w-4 h-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Company Name *</Label>
                  <Input placeholder="e.g. PT. Telkom Indonesia" className="bg-secondary border-border"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Customer Code *</Label>
                  <Input placeholder="e.g. TLKM" className="font-mono bg-secondary border-border"
                    value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Contact Email</Label>
                    <Input placeholder="e.g. noc@company.com" className="bg-secondary border-border"
                      value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="e.g. +62-21-12345678" className="bg-secondary border-border"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Alamat IP</Label>
                  <Input placeholder="e.g. 192.168.1.1 atau 192.168.10.0/24 atau 192.168.10.1-192.168.10.7" 
                    className="font-mono bg-secondary border-border"
                    value={form.alamatip} onChange={(e) => setForm({ ...form, alamatip: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Kapasitas Langganan</Label>
                  <Input placeholder="e.g. +62-21-12345678" className="bg-secondary border-border"
                    value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editCustomer ? "Update Customer" : "Save Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Input
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm bg-secondary border-border"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="gradient-card border border-border rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="gradient-card border-border p-5 hover:border-primary/30 transition-colors animate-slide-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{customer.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono bg-primary/15 text-primary border border-primary/30">
                    {customer.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditDialog(customer)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(customer.id)}
                        disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{customer.contact || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{customer.phone || "—"}</span>
                </div>
                {customer.alamatip && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{customer.alamatip}</span>
                  </div>
                )}
                {customer.kapasitas && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{customer.kapasitas}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                <span>{customer.totalAllocations} allocations</span>
                <span>Since {customer.createdAt}</span>
              </div>
            </Card>
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No customers found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
