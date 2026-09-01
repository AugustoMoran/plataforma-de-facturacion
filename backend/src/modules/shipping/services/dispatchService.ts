import Sale from '../../sales/models/Sale';
import {
  envioPackGet,
  envioPackPost,
  getEnvioPackDepositId,
} from './envioPackClient';
import { buildPackagesFromItems } from './packageBuilder';

const splitName = (fullName: string) => {
  const parts = String(fullName || 'Cliente').trim().split(/\s+/);
  const nombre = parts[0] || 'Cliente';
  const apellido = parts.slice(1).join(' ') || 'Online';
  return { nombre: nombre.slice(0, 30), apellido: apellido.slice(0, 30) };
};

const formatDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const createEnvioPackPedidoForSale = async (saleId: string) => {
  const sale = await Sale.findById(saleId);
  if (!sale || sale.source !== 'ECOMMERCE') {
    throw new Error('Pedido ecommerce no encontrado');
  }
  if (sale.envioPackPedidoId) {
    return sale.envioPackPedidoId;
  }

  const { nombre, apellido } = splitName(sale.clientName || 'Cliente Online');
  const pedido = await envioPackPost<any>('/pedidos', {
    id_externo: String(sale._id).slice(-12),
    nombre,
    apellido,
    email: sale.customerEmail || 'ventas@ososoundmusic.com',
    telefono: sale.customerPhone || undefined,
    monto: sale.total,
    fecha_alta: formatDate(sale.createdAt || new Date()),
    pagado: sale.paymentStatus === 'approved',
    provincia: sale.shippingQuote?.provinceId || sale.shippingAddress?.province,
    localidad: sale.shippingAddress?.city,
  });

  sale.envioPackPedidoId = pedido.id;
  sale.shippingStatus = sale.shippingStatus || 'awaiting_dispatch';
  await sale.save();
  return pedido.id;
};

export const createEnvioPackShipmentForSale = async (saleId: string) => {
  const sale = await Sale.findById(saleId);
  if (!sale || sale.source !== 'ECOMMERCE') {
    throw new Error('Pedido ecommerce no encontrado');
  }
  if (sale.paymentStatus !== 'approved') {
    throw new Error('El pago del pedido aún no está aprobado');
  }
  if (!sale.shippingQuote) {
    throw new Error('El pedido no tiene una cotización de envío guardada');
  }

  const pedidoId = sale.envioPackPedidoId || (await createEnvioPackPedidoForSale(saleId));
  const packages = await buildPackagesFromItems(
    sale.items.map((item) => ({
      productId: String(item.product),
      quantity: item.quantity,
    }))
  );

  const quote = sale.shippingQuote;
  const street = sale.shippingAddress?.street || '';
  const [calle, ...rest] = street.split(' ');
  const numero = rest.join(' ') || 'S/N';

  const payload: Record<string, unknown> = {
    pedido: pedidoId,
    direccion_envio: getEnvioPackDepositId(),
    destinatario: (sale.clientName || 'Cliente').slice(0, 50),
    observaciones: quote.sucursal
      ? `Sucursal ${quote.sucursal.nombre}`
      : sale.shippingAddress?.street,
    modalidad: quote.modalidad,
    servicio: quote.service,
    correo: quote.carrierId === 'enviopack' ? null : quote.carrierId,
    despacho: quote.despacho || 'D',
    confirmado: true,
    paquetes: packages.packages,
  };

  if (quote.modalidad === 'S' && quote.sucursal?.id) {
    payload.sucursal = quote.sucursal.id;
  } else {
    payload.calle = calle || street.slice(0, 50);
    payload.numero = numero.slice(0, 5);
    payload.codigo_postal = sale.shippingAddress?.postalCode;
    payload.provincia = quote.provinceId || sale.shippingAddress?.province;
    payload.localidad = sale.shippingAddress?.city;
  }

  const envio = await envioPackPost<any>('/envios', payload);

  sale.envioPackEnvioId = envio.id;
  sale.shippingStatus = envio.estado === 'P' ? 'label_ready' : 'awaiting_dispatch';
  sale.trackingNumber = envio.tracking_number || sale.trackingNumber;
  sale.envioPackSellerCost = quote.sellerCost;
  await sale.save();

  return envio;
};

export const refreshEnvioPackShipment = async (saleId: string) => {
  const sale = await Sale.findById(saleId);
  if (!sale?.envioPackEnvioId) {
    throw new Error('El pedido aún no tiene envío generado en EnvioPack');
  }

  const envio = await envioPackGet<any>(`/envios/${sale.envioPackEnvioId}`);
  sale.trackingNumber = envio.tracking_number || sale.trackingNumber;
  sale.envioPackSellerCost = Number(envio.costo || envio.costo_envio || sale.envioPackSellerCost || 0);
  if (envio.estado === 'P') sale.shippingStatus = 'label_ready';
  if (envio.condicion === 'E' || envio.condicion === 'T') sale.shippingStatus = 'shipped';
  if (envio.condicion === 'D') sale.shippingStatus = 'delivered';
  await sale.save();
  return envio;
};

export const listDispatchOrders = async () => {
  return Sale.find({
    source: 'ECOMMERCE',
    paymentStatus: 'approved',
    shippingStatus: { $in: ['awaiting_dispatch', 'label_ready', 'shipped'] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
};

export const handleEnvioPackWebhook = async (tipo: string, id: string) => {
  const sale = await Sale.findOne({ envioPackEnvioId: Number(id) });
  if (!sale) {
    return { matched: false };
  }

  await refreshEnvioPackShipment(String(sale._id));
  return { matched: true, tipo, saleId: sale._id };
};
