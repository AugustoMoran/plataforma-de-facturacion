import { Request, Response } from 'express';
import {
  getMailerConfigStatus,
  sendMail,
  verifyMailerTransport,
} from '../services/mailerService';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function getMailerStatusController(_req: Request, res: Response) {
  const config = getMailerConfigStatus();
  const verify = await verifyMailerTransport();
  res.json({
    ...config,
    verifyOk: verify.ok,
    verifyError: verify.error,
  });
}

export async function sendTestEmailController(req: Request, res: Response) {
  const to = String(req.body?.to || '').trim().toLowerCase();
  if (!isValidEmail(to)) {
    return res.status(400).json({ message: 'Email de destino inválido' });
  }

  const verify = await verifyMailerTransport();
  if (!verify.ok) {
    return res.status(503).json({
      message: 'SMTP no responde correctamente',
      verifyError: verify.error,
      config: getMailerConfigStatus(),
    });
  }

  const result = await sendMail({
    to,
    subject: 'Prueba de correo — Oso Sound',
    text: [
      'Este es un correo de prueba del sistema Oso Sound.',
      '',
      `Enviado: ${new Date().toISOString()}`,
      'Si lo recibiste, el mailer está funcionando.',
    ].join('\n'),
    html: `<p>Este es un correo de prueba del sistema <strong>Oso Sound</strong>.</p>
<p>Enviado: ${new Date().toISOString()}</p>
<p>Si lo recibiste, el mailer está funcionando.</p>`,
  });

  if (!result.sent) {
    return res.status(502).json({
      message: 'No se pudo enviar el correo de prueba',
      ...result,
      config: getMailerConfigStatus(),
    });
  }

  res.json({
    ok: true,
    to,
    messageId: result.messageId,
    config: getMailerConfigStatus(),
  });
}
