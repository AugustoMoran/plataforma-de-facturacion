import React, { useMemo, useState } from 'react';
import { useGetProfitReportQuery } from '../../services/salesApi';

const toInputDate = (date: Date) => date.toISOString().split('T')[0];
const money = (value: number) => `$${(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const exact = (value: number) => `${value ?? 0}`;

const LEDGER_TYPE_LABELS: Record<string, string> = {
  INVOICE: 'Factura',
  PAYMENT: 'Pago',
  ADJUSTMENT: 'Ajuste',
};

export const AdminProfitReport: React.FC = () => {
  const today = useMemo(() => toInputDate(new Date()), []);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [submittedRange, setSubmittedRange] = useState<{ from: string; to: string }>({ from: today, to: today });

  const { data, isLoading, isFetching, error } = useGetProfitReportQuery(submittedRange);

  const summary = data?.summary || {
    salesCount: 0,
    totalRevenue: 0,
    totalInvoicedRevenue: 0,
    totalNonInvoicedRevenue: 0,
    invoicedSalesCount: 0,
    nonInvoicedSalesCount: 0,
    pendingFiscalRevenue: 0,
    failedFiscalRevenue: 0,
    totalCost: 0,
    totalIva: 0,
    totalNeto: 0,
    totalDiscount: 0,
    totalExpenses: 0,
    totalExpensesAffectingProfit: 0,
    totalExpensesInformative: 0,
    supplierInvoices: 0,
    supplierAdjustments: 0,
    supplierPayments: 0,
    totalGain: 0,
    gainAfterExpenses: 0,
    totalCommission: 0,
    gainWithoutIva: 0,
    marginPercent: 0,
  };

  const applyFilter = (e: React.FormEvent) => {
    e.preventDefault();

    if (fromDate > toDate) {
      alert('La fecha "Desde" no puede ser mayor a la fecha "Hasta"');
      return;
    }

    setSubmittedRange({ from: fromDate, to: toDate });
  };

  const resetToToday = () => {
    setFromDate(today);
    setToDate(today);
    setSubmittedRange({ from: today, to: today });
  };

  const supplierEntries = (data?.supplierLedgerEntries || []).filter(
    (item: any) => item.entryType === 'INVOICE' || item.entryType === 'ADJUSTMENT'
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Informe de Ganancias</h1>
          <p className="page-sub">Desglose de costos, ganancias, compras a proveedores e IVA</p>
        </div>
        <button onClick={resetToToday} className="btn-secondary w-full sm:w-auto justify-center">
          Hoy
        </button>
      </div>

      <div className="card p-4 sm:p-5">
        <form onSubmit={applyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="section-heading">Desde</label>
            <input
              type="date"
              className="input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate}
            />
          </div>
          <div>
            <label className="section-heading">Hasta</label>
            <input
              type="date"
              className="input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={isFetching}>
            {isFetching ? 'Filtrando...' : 'Aplicar filtro'}
          </button>
          <div className="text-xs text-blue-800">
            Rango actual: <span className="text-blue-950 font-medium">{submittedRange.from}</span> a <span className="text-blue-950 font-medium">{submittedRange.to}</span>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-blue-50 py-20 justify-center">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generando informe...
        </div>
      ) : error ? (
        <div className="badge-red p-4">No se pudo cargar el informe de ganancias</div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Ventas</p>
              <p className="text-[clamp(1.15rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight">{summary.salesCount}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Total ingresos</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalRevenue)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Facturado AFIP</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalInvoicedRevenue)}</p>
              <p className="text-[11px] text-blue-700 mt-1">{summary.invoicedSalesCount} venta(s)</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">No facturado</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalNonInvoicedRevenue)}</p>
              <p className="text-[11px] text-blue-700 mt-1">{summary.nonInvoicedSalesCount} venta(s)</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Costo total</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalCost)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">IVA total</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalIva)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Compras (impactan)</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalExpensesAffectingProfit)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Ganancia final</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.totalGain)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Ganancia post-gastos</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">{money(summary.gainAfterExpenses)}</p>
            </div>
            <div className="card p-4 min-w-0">
              <p className="text-xs text-blue-800 mb-1">Liquidación vendedores</p>
              <p className="text-[clamp(1.1rem,2vw,1.85rem)] font-bold text-blue-950 leading-tight break-words">${exact(summary.totalCommission)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-blue-950">Desglose impositivo y rentabilidad</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">IVA pagado (ventas fiscales)</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalIva)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Neto total</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalNeto)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Descuento total aplicado</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalDiscount)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Ganancia neta (regla fiscal)</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.gainWithoutIva)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Facturación fiscal pendiente AFIP</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.pendingFiscalRevenue)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Facturación fiscal fallida AFIP</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.failedFiscalRevenue)}</span>
                </div>
                <div className="pt-2 border-t border-blue-100 flex justify-between gap-3">
                  <span className="text-blue-800">Margen</span>
                  <span className="text-blue-950 font-bold text-right">{summary.marginPercent}%</span>
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-blue-950">Facturado vs no facturado</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-blue-100 pb-2">
                  <span className="text-blue-800">Ventas facturadas AFIP</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalInvoicedRevenue)} <span className="text-xs text-blue-700">({summary.invoicedSalesCount})</span></span>
                </div>
                <div className="flex justify-between gap-3 border-b border-blue-100 pb-2">
                  <span className="text-blue-800">Ventas no facturadas</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalNonInvoicedRevenue)} <span className="text-xs text-blue-700">({summary.nonInvoicedSalesCount})</span></span>
                </div>
                <div className="flex justify-between gap-3 border-b border-blue-100 pb-2">
                  <span className="text-blue-800">Facturas de compra</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.supplierInvoices)}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-blue-100 pb-2">
                  <span className="text-blue-800">Ajustes netos</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.supplierAdjustments)}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-blue-100 pb-2">
                  <span className="text-blue-800">Pagos a proveedores</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.supplierPayments)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-blue-800">Compras que impactan ganancia</span>
                  <span className="text-blue-950 font-semibold text-right">{money(summary.totalExpensesAffectingProfit)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-blue-950">Por método de cobro</h2>
              <div className="space-y-2">
                {(data?.byPaymentMethod || []).length === 0 ? (
                  <p className="text-sm text-blue-800">Sin datos para el rango seleccionado</p>
                ) : (
                  data.byPaymentMethod.map((row: any) => (
                    <div key={row.method} className="flex justify-between text-sm border-b border-blue-100 pb-2 gap-3">
                      <span className="text-blue-800 capitalize">{row.method}</span>
                      <span className="text-blue-950 font-semibold text-right">{money(row.revenue)} <span className="text-xs text-blue-700">({row.count})</span></span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-blue-950">Compras y deuda (período)</h2>
                <p className="text-xs text-blue-800 mt-1">Datos cargados en Compras y Deuda. Las facturas y ajustes impactan la ganancia post-compras.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Proveedor</th>
                    <th>Referencia</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-blue-800 py-10 text-sm">
                        Sin compras ni ajustes en el período. Cargalos en Compras y Deuda.
                      </td>
                    </tr>
                  ) : (
                    supplierEntries.map((item: any) => (
                      <tr key={item._id}>
                        <td className="text-blue-950 text-sm">
                          {new Date(`${new Date(item.date).toISOString().split('T')[0]}T00:00:00`).toLocaleDateString('es-AR')}
                        </td>
                        <td>
                          <span className="badge-gray">{LEDGER_TYPE_LABELS[item.entryType] || item.entryType}</span>
                        </td>
                        <td className="text-blue-950 text-sm">{item.counterpartyName || '—'}</td>
                        <td className="text-blue-800 text-sm">{item.reference || item.description || '—'}</td>
                        <td className="text-right text-blue-950 font-semibold">
                          {money(item.entryType === 'ADJUSTMENT' ? item.signedAmount : item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100">
              <h2 className="text-sm font-semibold text-blue-950">Evolución diaria (rango seleccionado)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Facturado</th>
                    <th className="text-right">No facturado</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Costo</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Descuento</th>
                    <th className="text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.byDay || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-blue-800 py-10 text-sm">Sin movimientos en el período seleccionado</td>
                    </tr>
                  ) : (
                    data.byDay.map((d: any) => (
                      <tr key={d.date}>
                        <td className="text-blue-950 text-sm">{new Date(`${d.date}T00:00:00`).toLocaleDateString('es-AR')}</td>
                        <td className="text-right text-blue-950">{d.sales}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.invoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.nonInvoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.revenue)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.cost)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.iva)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(d.discount)}</td>
                        <td className="text-right text-blue-950 font-bold">{money(d.gain)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100">
              <h2 className="text-sm font-semibold text-blue-950">Ganancias por sucursal</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Facturado</th>
                    <th className="text-right">No facturado</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Costo</th>
                    <th className="text-right">IVA</th>
                    <th className="text-right">Descuento</th>
                    <th className="text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.byBranch || []).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-blue-800 py-10 text-sm">Sin datos por sucursal en el período seleccionado</td>
                    </tr>
                  ) : (
                    data.byBranch.map((row: any) => (
                      <tr key={`${row.branchId}-${row.branchName}`}>
                        <td className="text-blue-950 text-sm">{row.branchName || 'Sin sucursal'}</td>
                        <td className="text-right text-blue-950">{row.sales}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.invoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.nonInvoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.revenue)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.cost)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.iva)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.discount)}</td>
                        <td className="text-right text-blue-950 font-bold">{money(row.gain)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100">
              <h2 className="text-sm font-semibold text-blue-950">Liquidación por vendedor</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Facturado</th>
                    <th className="text-right">No facturado</th>
                    <th className="text-right">Total bruto</th>
                    <th className="text-right">% efectivo</th>
                    <th className="text-right">Liquidación</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.bySeller || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-blue-800 py-10 text-sm">Sin datos de liquidación para el período seleccionado</td>
                    </tr>
                  ) : (
                    data.bySeller.map((row: any) => (
                      <tr key={`${row.sellerId}-${row.sellerName}`}>
                        <td className="text-blue-950 text-sm">{row.sellerName || 'Sin vendedor'}</td>
                        <td className="text-right text-blue-950">{row.sales}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.invoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.nonInvoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.revenue)}</td>
                        <td className="text-right text-blue-950">{exact(row.effectiveRate)}%</td>
                        <td className="text-right text-blue-950 font-bold">${exact(row.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100">
              <h2 className="text-sm font-semibold text-blue-950">Liquidación vendedor por sucursal</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="hidden sm:table-cell">Sucursal</th>
                    <th className="text-right">Ventas</th>
                    <th className="text-right">Facturado</th>
                    <th className="text-right">No facturado</th>
                    <th className="text-right">Total bruto</th>
                    <th className="text-right hidden md:table-cell">% efectivo</th>
                    <th className="text-right">Liquidación</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.bySellerBranch || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-blue-800 py-10 text-sm">Sin datos vendedor/sucursal para el período seleccionado</td>
                    </tr>
                  ) : (
                    data.bySellerBranch.map((row: any) => (
                      <tr key={`${row.sellerId}-${row.branchId}-${row.sellerName}-${row.branchName}`}>
                        <td className="text-blue-950 text-sm">{row.sellerName || 'Sin vendedor'}</td>
                        <td className="text-blue-950 text-sm hidden sm:table-cell">{row.branchName || 'Sin sucursal'}</td>
                        <td className="text-right text-blue-950">{row.sales}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.invoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.nonInvoicedRevenue ?? 0)}</td>
                        <td className="text-right text-blue-950 font-semibold">{money(row.revenue)}</td>
                        <td className="text-right text-blue-950 hidden md:table-cell">{exact(row.effectiveRate)}%</td>
                        <td className="text-right text-blue-950 font-bold">${exact(row.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
