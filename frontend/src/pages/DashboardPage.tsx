import { CardSkeleton } from '../components/common/SkeletonLoader';
import { useGetDailySalesQuery } from '../api/reportsApi';
import { useGetStockQuery } from '../api/stockApi';
import { DollarSign, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'success';
}) {
  const variantClasses = {
    default: 'text-primary',
    warning: 'text-yellow-400',
    success: 'text-green-400',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon size={20} className={variantClasses[variant]} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  const { data: salesData, isLoading: salesLoading } = useGetDailySalesQuery({
    dateFrom: today,
    dateTo: today,
  });
  const { data: stockData, isLoading: stockLoading } = useGetStockQuery({ lowStock: true });

  const isLoading = salesLoading || stockLoading;
  const report = salesData?.data;
  const lowStockCount = stockData?.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del día</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Ventas hoy"
            value={report?.totalSales ?? 0}
            icon={ShoppingCart}
          />
          <StatCard
            title="Ingresos hoy"
            value={`$${(report?.totalRevenue ?? 0).toLocaleString('es-AR')}`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Ganancia hoy"
            value={`$${(report?.totalProfit ?? 0).toLocaleString('es-AR')}`}
            subtitle={`IVA: $${(report?.totalIva ?? 0).toLocaleString('es-AR')}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Stock bajo"
            value={lowStockCount}
            subtitle="productos con stock mínimo"
            icon={AlertTriangle}
            variant={lowStockCount > 0 ? 'warning' : 'default'}
          />
        </div>
      )}
    </div>
  );
}
