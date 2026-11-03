import nodemailer from 'nodemailer';

export type MailerConfigStatus = {
  configured: boolean;
  host?: string;
  from?: string;
  reason?: string;
};

let cachedTransport: nodemailer.Transporter | null | undefined;

export const getMailerConfigStatus = (): MailerConfigStatus => {
  const host = process.env.SMTP_HOST?.trim();
  const from = (process.env.SMTP_FROM || process.env.STORE_EMAIL || process.env.SMTP_USER || '').trim();

  if (!host) {
    return { configured: false, reason: 'SMTP_HOST no configurado' };
  }
  if (!from) {
    return { configured: false, host, reason: 'SMTP_FROM / STORE_EMAIL no configurado' };
  }

  return { configured: true, host, from };
};

const getTransport = () => {
  if (cachedTransport !== undefined) return cachedTransport;

  const status = getMailerConfigStatus();
  if (!status.configured) {
    cachedTransport = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const isGmail = status.host?.toLowerCase().includes('gmail');

  cachedTransport = nodemailer.createTransport({
    host: status.host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: user && pass ? { user, pass } : undefined,
    ...(isGmail
      ? {
          tls: { minVersion: 'TLSv1.2' },
        }
      : {}),
  });

  return cachedTransport;
};

export type SendMailResult = {
  sent: boolean;
  messageId?: string;
  reason?: string;
  error?: string;
};

export const verifyMailerTransport = async (): Promise<{ ok: boolean; error?: string }> => {
  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: getMailerConfigStatus().reason || 'SMTP no configurado' };
  }

  try {
    await transport.verify();
    return { ok: true };
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error('[Mailer] verify() falló:', message);
    return { ok: false, error: message };
  }
};

export const sendMail = async (input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendMailResult> => {
  const status = getMailerConfigStatus();
  const transport = getTransport();

  if (!transport || !status.from) {
    console.warn('[Mailer] Envío omitido (SMTP no configurado):', input.subject, '→', input.to);
    return { sent: false, reason: status.reason || 'SMTP no configurado' };
  }

  try {
    const fromAddress = status.from.includes('<')
      ? status.from
      : `Oso Sound Music <${status.from}>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    console.info('[Mailer] Enviado:', input.subject, '→', input.to, info.messageId || '');
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error('[Mailer] Error al enviar:', input.subject, '→', input.to, message);
    return { sent: false, error: message, reason: 'send_failed' };
  }
};

export const resetMailerCacheForTests = () => {
  cachedTransport = undefined;
};
