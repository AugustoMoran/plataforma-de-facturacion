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
  const pass = process.env.SMTP_PASS;

  cachedTransport = nodemailer.createTransport({
    host: status.host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransport;
};

export const sendMail = async (input: { to: string; subject: string; text: string; html?: string }) => {
  const status = getMailerConfigStatus();
  const transport = getTransport();

  if (!transport || !status.from) {
    console.warn('[Mailer] Envío omitido (SMTP no configurado):', input.subject, '→', input.to);
    return { sent: false, reason: status.reason || 'SMTP no configurado' };
  }

  await transport.sendMail({
    from: status.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { sent: true };
};

export const resetMailerCacheForTests = () => {
  cachedTransport = undefined;
};
