import Sale, { ISale } from '../../sales/models/Sale';
import * as settingsService from '../../settings/services/settingsService';

type NotificationScenario =
  | 'enviopack_dispatch'
  | 'store_pickup'
  | 'enviopack_branch'
  | 'generic';

const resolveScenario = (sale: ISale): NotificationScenario => {
  const carrierId = sale.shippingQuote?.carrierId;
  const modalidad = sale.shippingQuote?.modalidad || sale.shippingModalidad;

  if (carrierId === 'store' || sale.shippingQuote?.pickupBranch) {
    return 'store_pickup';
  }

  if (modalidad === 'S' || sale.shippingQuote?.sucursal) {
    return 'enviopack_branch';
  }

  if (sale.shippingQuote && carrierId && carrierId !== 'store') {
    return 'enviopack_dispatch';
  }

  return 'generic';
};

const buildSellerSubject = (sale: ISale, scenario: NotificationScenario) => {
  const orderRef = sale.invoiceNumber || String(sale._id).slice(-8).toUpperCase();
  switch (scenario) {
    case 'enviopack_dispatch':
      return `[Oso Sound] Nuevo pedido pagado #${orderRef} — preparar envío`;
    case 'enviopack_branch':
      return `[Oso Sound] Nuevo pedido pagado #${orderRef} — envío a sucursal`;
    case 'store_pickup':
      return `[Oso Sound] Nuevo pedido pagado #${orderRef} — retiro en tienda`;
    default:
      return `[Oso Sound] Nuevo pedido pagado #${orderRef}`;
  }
};

const buildSellerBody = (sale: ISale, scenario: NotificationScenario) => {
  const lines = [
    `Pedido: ${sale.invoiceNumber || sale._id}`,
    `Cliente: ${sale.clientName || 'Sin nombre'}`,
    `Email: ${sale.customerEmail || '—'}`,
    `Teléfono: ${sale.customerPhone || '—'}`,
    `Total: $${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    `Método de pago: Payway (${sale.paymentStatus || 'approved'})`,
  ];

  if (sale.shippingMethod) {
    lines.push(`Envío: ${sale.shippingMethod}`);
  }

  if (scenario === 'enviopack_dispatch' && sale.shippingAddress) {
    lines.push(
      `Dirección: ${[
        sale.shippingAddress.street,
        sale.shippingAddress.city,
        sale.shippingAddress.province,
        sale.shippingAddress.postalCode,
      ].filter(Boolean).join(', ')}`
    );
    lines.push('Acción sugerida: preparar el pedido y generar etiqueta en EnvioPack.');
  }

  if (scenario === 'enviopack_branch' && sale.shippingQuote?.sucursal) {
    const branch = sale.shippingQuote.sucursal;
    lines.push(`Sucursal: ${branch.nombre || '—'}`);
    lines.push(
      `Dirección sucursal: ${[branch.calle, branch.numero, branch.localidad, branch.codigoPostal]
        .filter(Boolean)
        .join(', ')}`
    );
    lines.push('Acción sugerida: preparar el pedido para despacho a sucursal.');
  }

  if (scenario === 'store_pickup' && sale.shippingQuote?.pickupBranch) {
    const branch = sale.shippingQuote.pickupBranch;
    lines.push(`Retiro en: ${branch.name || 'Sucursal Oso Sound'}`);
    if (branch.address) lines.push(`Dirección: ${branch.address}`);
    lines.push('Acción sugerida: preparar el pedido y avisar al cliente cuando esté listo.');
  }

  lines.push('', 'Productos:');
  for (const item of sale.items) {
    lines.push(`- ${item.quantity}x ${item.name} ($${item.subtotal})`);
  }

  return lines.join('\n');
};

const buildCustomerBody = (sale: ISale, scenario: NotificationScenario) => {
  const orderRef = sale.invoiceNumber || String(sale._id).slice(-8).toUpperCase();
  const lines = [
    `Hola ${sale.clientName || ''},`.trim(),
    '',
    `Recibimos tu pago del pedido #${orderRef}.`,
    `Total abonado: $${Number(sale.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`,
  ];

  if (scenario === 'store_pickup') {
    lines.push('Te avisaremos cuando tu pedido esté listo para retirar en la sucursal.');
  } else if (scenario === 'enviopack_dispatch' || scenario === 'enviopack_branch') {
    lines.push('Estamos preparando tu pedido. Te enviaremos el seguimiento cuando despachemos.');
  } else {
    lines.push('Gracias por tu compra en Oso Sound Music.');
  }

  return lines.join('\n');
};

const sendViaSmtp = async (to: string, subject: string, text: string) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.STORE_EMAIL || user;

  if (!host || !from) return false;

  let nodemailer: typeof import('nodemailer');
  try {
    nodemailer = await import('nodemailer');
  } catch {
    console.warn('[OrderNotification] nodemailer no instalado; notificación solo en logs');
    return false;
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transport.sendMail({ from, to, subject, text });
  return true;
};

export const notifyOrderPaymentApproved = async (saleId: string) => {
  const sale = await Sale.findById(saleId);
  if (!sale || sale.paymentStatus !== 'approved') return;
  if (sale.paymentNotifiedAt) return;

  const settings = await settingsService.getSettings();
  const scenario = resolveScenario(sale);
  const sellerEmail = settings.contactEmail || process.env.STORE_EMAIL;
  const sellerSubject = buildSellerSubject(sale, scenario);
  const sellerBody = buildSellerBody(sale, scenario);

  let sellerSent = false;
  if (sellerEmail) {
    try {
      sellerSent = await sendViaSmtp(sellerEmail, sellerSubject, sellerBody);
    } catch (error: any) {
      console.error('[OrderNotification] Error enviando mail al vendedor:', error?.message || error);
    }
  }

  let customerSent = false;
  if (sale.customerEmail) {
    try {
      customerSent = await sendViaSmtp(
        sale.customerEmail,
        `Confirmación de pago — pedido ${sale.invoiceNumber || sale._id}`,
        buildCustomerBody(sale, scenario)
      );
    } catch (error: any) {
      console.error('[OrderNotification] Error enviando mail al cliente:', error?.message || error);
    }
  }

  console.info('[OrderNotification]', {
    saleId,
    scenario,
    sellerEmail,
    sellerSent,
    customerSent,
    subject: sellerSubject,
  });

  sale.paymentNotifiedAt = new Date();
  await sale.save();
};
