import axios from 'axios';

type PaywayEnvironment = 'sandbox' | 'production';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    enabled: Boolean(publicKey && privateKey && siteId && templateId > 0),
  };
};

const resolveNotificationsUrl = () => {
  const configured = (process.env.PAYWAY_WEBHOOK_URL || '').trim();
  if (configured.startsWith('http')) return configured;

  const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
  if (apiUrl.startsWith('http')) {
    return `${apiUrl}/api/payments/payway/webhook`;
  }

  return '';
};

const extractPaywayError = (data: unknown, status: number) => {
  if (!data || typeof data !== 'object') {
    return `Payway respondió ${status}`;
  }

  const payload = data as Record<string, unknown>;
  const validationErrors = Array.isArray(payload.validation_errors)
    ? payload.validation_errors
        .map((entry: any) => entry?.param || entry?.code || entry?.message)
        .filter(Boolean)
        .join(', ')
    : '';

  const candidates = [payload.description, payload.message, payload.error, validationErrors];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return `Payway respondió ${status}`;
};

export const isValidPaywayEmail = (email: string) => EMAIL_REGEX.test(String(email || '').trim());

export const getPaywayPublicConfig = () => {
  const config = getPaywayConfig();
  return {
    publicKey: config.publicKey,
    enabled: config.enabled,
    environment: config.environment,
    webhookConfigured: Boolean(resolveNotificationsUrl()),
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

const buildTransactionId = (saleId: string) => {
  const compactSaleId = String(saleId).replace(/\W/g, '').slice(-10);
  const suffix = Date.now().toString().slice(-4);
  return `OSO${compactSaleId}${suffix}`.slice(0, 39);
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
    throw new Error(
      'Payway no configurado. Revisá PAYWAY_PUBLIC_KEY, PAYWAY_PRIVATE_KEY, PAYWAY_SITE_ID y PAYWAY_TEMPLATE_ID (> 0).'
    );
  }

  const payerEmail = String(input.payerEmail || '').trim().toLowerCase();
  if (!isValidPaywayEmail(payerEmail)) {
    throw new Error('Ingresá un email válido para continuar con el pago.');
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const successUrl = input.backUrls?.success || `${frontendUrl}/checkout/confirmation/${input.saleId}`;
  const cancelUrl = input.backUrls?.cancel || `${frontendUrl}/checkout/failure?saleId=${input.saleId}`;
  const notificationsUrl = resolveNotificationsUrl();

  const amountInCents = Math.round(Number(input.total || 0) * 100);
  if (!amountInCents || amountInCents <= 0) {
    throw new Error('El monto del pedido debe ser mayor a cero');
  }

  const transactionId = buildTransactionId(input.saleId);
  const establishmentName = (process.env.STORE_NAME || 'Oso Sound Music').slice(0, 25);

  const payload: Record<string, unknown> = {
    form_site: config.publicKey,
    site: {
      id: config.siteId,
      transaction_id: transactionId,
      template: { id: config.templateId },
    },
    public_apikey: config.publicKey,
    customer: {
      id: String(input.saleId).replace(/\W/g, '').slice(-24) || 'guest',
      email: payerEmail,
      ip_address: input.payerIp || '127.0.0.1',
    },
    payment: {
      amount: amountInCents,
      currency: 'ARS',
      payment_method_id: 1,
      installments: 1,
      payment_type: 'single',
      sub_payments: [],
      description: input.title.slice(0, 120),
      establishment_name: establishmentName,
    },
    fraud_detection: { send_to_cs: false },
    success_url: successUrl,
    cancel_url: cancelUrl,
    redirect_url: successUrl,
  };

  if (notificationsUrl) {
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
    throw new Error(extractPaywayError(response.data, response.status));
  }

  const hash = response.data?.hash;
  if (!hash) {
    throw new Error('Payway no devolvió un hash de checkout válido');
  }

  const checkoutUrl = `${config.formsWebBase}/web/forms/${hash}?apikey=${encodeURIComponent(config.publicKey)}`;

  return {
    formHash: String(hash),
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
    throw new Error(extractPaywayError(response.data, response.status));
  }

  return response.data;
};

export const getPaymentByTransactionId = async (transactionId: string) => {
  const config = getPaywayConfig();
  if (!config.privateKey || !transactionId) {
    throw new Error('Payway no configurado o transacción inválida');
  }

  const params = new URLSearchParams({
    siteOperationId: transactionId,
    merchantId: config.siteId,
    pageSize: '5',
    offset: '0',
  });

  const response = await axios.get(`${config.paymentsApiBase}/payments?${params.toString()}`, {
    headers: { apikey: config.privateKey },
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error(extractPaywayError(response.data, response.status));
  }

  const results = Array.isArray(response.data?.results)
    ? response.data.results
    : Array.isArray(response.data)
      ? response.data
      : [];

  const payment = results.find(
    (entry: any) => String(entry?.site_transaction_id || '') === String(transactionId)
  ) || results[0];

  if (!payment) {
    throw new Error('Aún no hay un pago registrado para este pedido en Payway');
  }

  return payment;
};

export const resolvePaymentForSale = async (sale: {
  paymentId?: string;
  paywayFormHash?: string;
  paywayTransactionId?: string;
}) => {
  const storedPaymentId = String(sale.paymentId || '').trim();
  const looksLikePaywayPaymentId = storedPaymentId
    && storedPaymentId !== sale.paywayFormHash
    && !storedPaymentId.includes('/');

  if (looksLikePaywayPaymentId) {
    try {
      return await getPaymentById(storedPaymentId);
    } catch {
      // fallback to transaction lookup
    }
  }

  if (sale.paywayTransactionId) {
    return getPaymentByTransactionId(sale.paywayTransactionId);
  }

  throw new Error('Este pedido no tiene una referencia de pago Payway para sincronizar');
};

export const processWebhookNotification = async (payload: any) => {
  if (!payload) return { processed: false };

  const paymentId = payload?.id
    || payload?.payment_id
    || payload?.data?.id
    || payload?.payment?.id;

  if (!paymentId) {
    return {
      processed: false,
      payload,
      transactionId: payload?.site_transaction_id || payload?.site?.transaction_id,
    };
  }

  const payment = await getPaymentById(String(paymentId));
  const status = mapPaywayStatus(payment?.status);

  return {
    processed: true,
    paymentId: String(paymentId),
    status,
    transactionId: payment?.site_transaction_id || payment?.site?.transaction_id,
    externalReference: payment?.site_transaction_id || payment?.external_reference,
    amount: payment?.amount ? Number(payment.amount) / 100 : undefined,
    rawStatus: payment?.status,
  };
};

export const mapPaywayPaymentStatus = mapPaywayStatus;
