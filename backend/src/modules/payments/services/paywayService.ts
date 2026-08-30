import axios from 'axios';

type PaywayEnvironment = 'sandbox' | 'production';

const getEnvironment = (): PaywayEnvironment => {
  const configured = (process.env.PAYWAY_ENVIRONMENT || '').toLowerCase();
  if (configured === 'production' || configured === 'prod') return 'production';
  if (configured === 'sandbox' || configured === 'test') return 'sandbox';
  return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
};

const getPaywayConfig = () => {
  const environment = getEnvironment();
  const isProduction = environment === 'production';

  const publicKey = process.env.PAYWAY_PUBLIC_KEY || '';
  const privateKey = process.env.PAYWAY_PRIVATE_KEY || '';
  const siteId = process.env.PAYWAY_SITE_ID || '';
  const templateId = Number(process.env.PAYWAY_TEMPLATE_ID || '0');

  return {
    environment,
    publicKey,
    privateKey,
    siteId,
    templateId,
    formsApiBase: isProduction
      ? 'https://ventasonline.payway.com.ar'
      : 'https://developers.decidir.com',
    formsWebBase: isProduction
      ? 'https://live.decidir.com'
      : 'https://developers.decidir.com',
    paymentsApiBase: isProduction
      ? 'https://ventasonline.payway.com.ar/api/v2'
      : 'https://developers.decidir.com/api/v2',
    enabled: Boolean(publicKey && privateKey && siteId && templateId),
  };
};

export const getPaywayPublicConfig = () => {
  const config = getPaywayConfig();
  return {
    publicKey: config.publicKey,
    enabled: config.enabled,
    environment: config.environment,
  };
};

const mapPaywayStatus = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (['approved', 'accredited'].includes(normalized)) return 'approved';
  if (['rejected', 'denied', 'refunded', 'annulled', 'cancelled', 'canceled'].includes(normalized)) {
    return 'rejected';
  }
  return 'pending';
};

export const createCheckoutSession = async (input: {
  saleId: string;
  title: string;
  total: number;
  payerEmail: string;
  payerIp?: string;
  backUrls?: {
    success?: string;
    cancel?: string;
  };
}) => {
  const config = getPaywayConfig();
  if (!config.enabled) {
    throw new Error('Payway no configurado. Revisá las variables PAYWAY_* en el servidor.');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const successUrl = input.backUrls?.success || `${frontendUrl}/checkout/confirmation/${input.saleId}`;
  const cancelUrl = input.backUrls?.cancel || `${frontendUrl}/checkout/failure?saleId=${input.saleId}`;
  const notificationsUrl = process.env.PAYWAY_WEBHOOK_URL
    || `${process.env.API_URL || ''}/api/payments/payway/webhook`;

  const amountInCents = Math.round(Number(input.total || 0) * 100);
  if (!amountInCents || amountInCents <= 0) {
    throw new Error('El monto del pedido debe ser mayor a cero');
  }

  const transactionId = `OSO${String(input.saleId).replace(/\W/g, '').slice(-10)}${Date.now().toString().slice(-4)}`;

  const payload: Record<string, unknown> = {
    form_site: config.publicKey,
    site: {
      id: config.siteId,
      transaction_id: transactionId,
      template: { id: config.templateId },
    },
    public_apikey: config.publicKey,
    customer: {
      id: String(input.saleId).slice(-24) || 'guest',
      email: input.payerEmail,
      ip_address: input.payerIp || '127.0.0.1',
    },
    payment: {
      amount: amountInCents,
      currency: 'ARS',
      payment_method_id: 1,
      installments: 1,
      payment_type: 'single',
      sub_payments: [],
    },
    fraud_detection: { send_to_cs: false },
    success_url: successUrl,
    cancel_url: cancelUrl,
    redirect_url: successUrl,
  };

  if (notificationsUrl && notificationsUrl.includes('http')) {
    payload.notifications_url = notificationsUrl;
  }

  const response = await axios.post(`${config.formsApiBase}/web/forms`, payload, {
    headers: {
      apikey: config.privateKey,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    const message = response.data?.description
      || response.data?.message
      || response.data?.error
      || `Payway respondió ${response.status}`;
    throw new Error(message);
  }

  const hash = response.data?.hash;
  if (!hash) {
    throw new Error('Payway no devolvió un hash de checkout válido');
  }

  const checkoutUrl = `${config.formsWebBase}/web/forms/${hash}?apikey=${encodeURIComponent(config.publicKey)}`;

  return {
    id: String(hash),
    checkoutUrl,
    transactionId,
  };
};

export const getPaymentById = async (paymentId: string) => {
  const config = getPaywayConfig();
  if (!config.privateKey) {
    throw new Error('Payway no configurado');
  }

  const response = await axios.get(`${config.paymentsApiBase}/payments/${paymentId}`, {
    headers: { apikey: config.privateKey },
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error(response.data?.message || `No se pudo consultar el pago ${paymentId}`);
  }

  return response.data;
};

export const processWebhookNotification = async (payload: any) => {
  if (!payload) return { processed: false };

  const paymentId = payload?.id
    || payload?.payment_id
    || payload?.data?.id
    || payload?.payment?.id;

  if (!paymentId) {
    return { processed: false, payload };
  }

  const payment = await getPaymentById(String(paymentId));
  const status = mapPaywayStatus(payment?.status);

  return {
    processed: true,
    paymentId: String(paymentId),
    status,
    externalReference: payment?.site_transaction_id || payment?.external_reference,
    amount: payment?.amount ? Number(payment.amount) / 100 : undefined,
    rawStatus: payment?.status,
  };
};

export const mapPaywayPaymentStatus = mapPaywayStatus;
