import { Network, Globe, Users, AlertTriangle, Activity, Shield } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { UtilizationBar } from "@/components/UtilizationBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    refetchInterval: 30000,
  });

  const { data: subnets = [], isLoading: subnetsLoading } = useQuery({
    queryKey: ["subnets"],
    queryFn: () => api.getSubnets(),
    refetchInterval: 30000,
  });

  const isLoading = statsLoading || subnetsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">IP Address Management Overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="gradient-card rounded-lg border border-border p-5 animate-pulse">
              <div className="h-4 bg-secondary rounded w-24 mb-3" />
              <div className="h-8 bg-secondary rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeSubnets = subnets.filter((s) => s.status === "active").length;
  const reservedSubnets = subnets.filter((s) => s.status === "reserved").length;
  const fullSubnets = subnets.filter((s) => s.status === "full").length;
  const uniqueVlans = new Set(subnets.map((s) => s.vlan).filter((v) => v > 0)).size;
  const alertSubnets = subnets.filter(
    (s) => s.totalIPs > 0 && s.usedIPs / s.totalIPs >= 0.8
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">IP Address Management Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Subnets" value={stats?.totalSubnets ?? 0} icon={Network} variant="primary" subtitle={`${activeSubnets} active`} />
        <StatCard title="IP Addresses" value={(stats?.totalIPs ?? 0).toLocaleString()} icon={Globe} variant="success" subtitle={`${stats?.availableIPs ?? 0} available`} />
        <StatCard title="Customers" value={stats?.totalCustomers ?? 0} icon={Users} variant="default" />
        <StatCard title="Alerts" value={stats?.activeAlerts ?? 0} icon={AlertTriangle} variant={(stats?.activeAlerts ?? 0) > 0 ? "warning" : "default"} subtitle="Subnets nearing capacity" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 gradient-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Overall IP Utilization
          </h2>
          <UtilizationBar used={stats?.usedIPs ?? 0} total={stats?.totalIPs ?? 1} label="Global Usage" className="mb-6" />
          <div className="space-y-4">
            {subnets.slice(0, 4).map((subnet) => (
              <div key={subnet.id} className="flex items-center gap-4 p-3 rounded-md bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors" onClick={() => navigate(`/subnets`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="ip-text text-foreground">{subnet.network}/{subnet.cidr}</span>
                    <StatusBadge status={subnet.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{subnet.description}</p>
                </div>
                <div className="w-32">
                  <UtilizationBar used={subnet.usedIPs} total={subnet.totalIPs} showPercent />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="gradient-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Network Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Subnets</span>
                <span className="font-mono text-foreground">{activeSubnets}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reserved Blocks</span>
                <span className="font-mono text-foreground">{reservedSubnets}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Full Subnets</span>
                <span className="font-mono text-destructive">{fullSubnets}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">VLANs In Use</span>
                <span className="font-mono text-foreground">{uniqueVlans}</span>
              </div>
            </div>
          </div>

          <div className="gradient-card rounded-lg border border-warning/30 p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alerts
            </h2>
            <div className="space-y-2">
              {alertSubnets.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada alert saat ini.</p>
              ) : (
                alertSubnets.map((s) => {
                  const pct = Math.round((s.usedIPs / s.totalIPs) * 100);
                  return (
                    <div key={s.id} className="p-2.5 rounded-md bg-warning/10 border border-warning/20">
                      <p className="text-xs text-warning font-medium">{s.network}/{s.cidr} at {pct}% capacity</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description} — {pct >= 100 ? "Consider expanding" : "Monitor closely"}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
