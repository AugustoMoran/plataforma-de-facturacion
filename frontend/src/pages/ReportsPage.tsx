import { useState } from 'react';
import { useGetDailySalesQuery, useGetSellerReportQuery, useGetStockReportQuery } from '../api/reportsApi';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { format, subDays } from 'date-fns';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export default function ReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(lastWeek);
  const [dateTo, setDateTo] = useState(today);

  const { data: dailyData, isLoading: dailyLoading } = useGetDailySalesQuery({ dateFrom, dateTo });
  const { data: sellerData, isLoading: sellerLoading } = useGetSellerReportQuery({ dateFrom, dateTo });
  const { data: stockData, isLoading: stockLoading } = useGetStockReportQuery({});

  const report = dailyData?.data;
  const sellers = sellerData?.data ?? [];
  const stock = stockData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Métricas y análisis del negocio</p>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {/* Quick filters */}
        {[
          { label: 'Hoy', days: 0 },
          { label: '7 días', days: 7 },
          { label: '30 días', days: 30 },
        ].map(({ label, days }) => (
          <button
            key={label}
            onClick={() => {
              setDateTo(today);
              setDateFrom(format(subDays(new Date(), days), 'yyyy-MM-dd'));
            }}
            className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sales summary */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Resumen de ventas</h2>
        {dailyLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : report ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total ventas" value={report.totalSales.toString()} />
            <MetricCard label="Ingresos" value={formatCurrency(report.totalRevenue)} />
            <MetricCard label="Ganancia" value={formatCurrency(report.totalProfit)} />
            <MetricCard label="IVA" value={formatCurrency(report.totalIva)} />
            <MetricCard label="Costo total" value={formatCurrency(report.totalCost)} />
            <MetricCard label="Comisiones" value={formatCurrency(report.totalCommissions)} />
            <MetricCard label="Facturadas" value={report.salesByType.facturada.toString()} />
            <MetricCard label="No facturadas" value={report.salesByType.noFacturada.toString()} />
          </div>
        ) : null}
      </div>

      {/* Sellers report */}
      {!sellerLoading && sellers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Ventas por vendedor</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Vendedor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.sellerId} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 text-foreground">{seller.sellerName}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{seller.totalSales}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(seller.totalRevenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{formatCurrency(seller.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock summary */}
      {!stockLoading && stock && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Estado del stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <MetricCard label="Total productos" value={stock.totalProducts.toString()} />
            <MetricCard label="Stock bajo" value={stock.lowStockProducts.toString()} variant="warning" />
            <MetricCard label="Sin stock" value={stock.outOfStockProducts.toString()} variant="danger" />
          </div>

          {stock.stockByBranch.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Sucursal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Productos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Unidades totales</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.stockByBranch.map((b) => (
                    <tr key={b.branchId} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 text-foreground">{b.branchName}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{b.totalProducts}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{b.totalStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const valueClass = {
    default: 'text-foreground',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  }[variant];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
