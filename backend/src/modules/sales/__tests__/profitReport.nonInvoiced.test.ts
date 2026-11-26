import bcrypt from 'bcrypt';
import { User } from '../../auth/models/User';
import Branch from '../../branches/models/Branch';
import Sale from '../models/Sale';
import { getProfitReport } from '../services/salesService';

describe('getProfitReport — facturado vs no facturado', () => {
  let sellerId: string;
  let branchId: string;

  beforeEach(async () => {
    const branch = await Branch.create({
      name: 'Sucursal Moron',
      address: 'Test 123',
      isActive: true,
      isMain: true,
    });
    branchId = String(branch._id);

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const seller = await User.create({
      name: 'julio',
      email: 'julio@test.com',
      password: hashedPassword,
      roles: ['vendedor'],
      branch: branchId,
      commissionRate: 2,
      permissions: { 'sales:view': true, 'sales:edit': true },
    });
    sellerId = String(seller._id);

    const today = new Date();

    await Sale.create({
      items: [{ name: 'Prod A', quantity: 1, price: 1000, costPrice: 400, ivaRate: 21, subtotal: 1000 }],
      totalNeto: 826.45,
      totalIva: 173.55,
      total: 1000,
      paymentMethod: 'efectivo',
      source: 'POS',
      invoiceType: 'B',
      invoiceNumber: '0001-00000001',
      billingStatus: 'COMPLETED',
      seller: sellerId,
      branch: branchId,
      sellerCommissionRate: 2,
      status: 'COMPLETED',
      createdAt: today,
    });

    await Sale.create({
      items: [{ name: 'Prod B', quantity: 1, price: 500, costPrice: 200, ivaRate: 0, subtotal: 500 }],
      totalNeto: 500,
      totalIva: 0,
      total: 500,
      paymentMethod: 'efectivo',
      source: 'POS',
      invoiceType: 'NONE',
      invoiceNumber: '',
      billingStatus: 'NOT_INVOICED',
      seller: sellerId,
      branch: branchId,
      sellerCommissionRate: 2,
      status: 'COMPLETED',
      createdAt: today,
    });
  });

  it('expone no facturados en summary y desgloses', async () => {
    const report = await getProfitReport();

    expect(report.summary.totalInvoicedRevenue).toBe(1000);
    expect(report.summary.totalNonInvoicedRevenue).toBe(500);
    expect(report.summary.invoicedSalesCount).toBe(1);
    expect(report.summary.nonInvoicedSalesCount).toBe(1);
    expect(report.summary.totalRevenue).toBe(1500);

    expect(report.byDay.length).toBeGreaterThan(0);
    expect(report.byDay[0].invoicedRevenue).toBe(1000);
    expect(report.byDay[0].nonInvoicedRevenue).toBe(500);

    expect(report.byBranch[0].invoicedRevenue).toBe(1000);
    expect(report.byBranch[0].nonInvoicedRevenue).toBe(500);

    expect(report.bySeller[0].invoicedRevenue).toBe(1000);
    expect(report.bySeller[0].nonInvoicedRevenue).toBe(500);
    expect(report.bySeller[0].revenue).toBe(1500);

    expect(report.bySellerBranch[0].invoicedRevenue).toBe(1000);
    expect(report.bySellerBranch[0].nonInvoicedRevenue).toBe(500);
  });
});
