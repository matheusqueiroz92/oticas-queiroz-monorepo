import { StatsCard } from "../ui/StatsCard";
import { RecentOrdersTable } from "../tables/RecentOrdersTable";

export const AdminPanel = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard title="Total de Pedidos" value="1.2k" trend="+12%" />
      <StatsCard title="Novos Clientes" value="45" trend="+8%" />
      <StatsCard title="Faturamento Mensal" value="R$ 52.4k" trend="+23%" />
    </div>

    <RecentOrdersTable />
  </div>
);
