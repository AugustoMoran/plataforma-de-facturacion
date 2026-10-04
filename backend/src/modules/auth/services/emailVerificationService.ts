import { IUser, User } from '../models/User';
import { sendMail } from '../../notifications/services/mailerService';
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} from './customerProfileService';

const buildVerificationUrl = (token: string) => {
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${frontend}/verify-email?token=${encodeURIComponent(token)}`;
};

export const issueEmailVerification = async (user: IUser) => {
  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpiresAt = expiresAt;
  user.emailVerified = false;
  await user.save({ validateBeforeSave: false });

  const verifyUrl = buildVerificationUrl(token);
  const recipient = String(user.email || '').trim().toLowerCase();
  if (!recipient) {
    return { verifyUrl, mailSent: false, messageId: undefined, error: 'missing_email' };
  }

  let result = await sendMail({
    to: recipient,
    subject: 'Confirmá tu email — Oso Sound Music',
    text: [
      `Hola ${user.name || ''},`.trim(),
      '',
      'Gracias por registrarte en Oso Sound Music.',
      'Para confirmar tu cuenta y recibir novedades de tus pedidos, abrí este enlace:',
      verifyUrl,
      '',
      'El enlace vence en 24 horas.',
      'Si no creaste esta cuenta, ignorá este mensaje.',
    ].join('\n'),
    html: `<p>Hola ${user.name || ''},</p>
<p>Gracias por registrarte en <strong>Oso Sound Music</strong>.</p>
<p><a href="${verifyUrl}">Confirmar mi email</a> para recibir novedades de tus pedidos.</p>
<p>El enlace vence en 24 horas.</p>`,
  });

  if (!result.sent) {
    result = await sendMail({
      to: recipient,
      subject: 'Confirmá tu email — Oso Sound Music',
      text: [
        `Hola ${user.name || ''},`.trim(),
        '',
        'Gracias por registrarte en Oso Sound Music.',
        'Para confirmar tu cuenta y recibir novedades de tus pedidos, abrí este enlace:',
        verifyUrl,
        '',
        'El enlace vence en 24 horas.',
        'Si no creaste esta cuenta, ignorá este mensaje.',
      ].join('\n'),
      html: `<p>Hola ${user.name || ''},</p>
<p>Gracias por registrarte en <strong>Oso Sound Music</strong>.</p>
<p><a href="${verifyUrl}">Confirmar mi email</a> para recibir novedades de tus pedidos.</p>
<p>El enlace vence en 24 horas.</p>`,
    });
  }

  return {
    verifyUrl,
    mailSent: result.sent,
    messageId: result.messageId,
    sendError: result.error || result.reason,
  };
};

export const verifyEmailByToken = async (token: string) => {
  const tokenHash = hashEmailVerificationToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('El enlace de verificación es inválido o expiró');
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });
  return user;
};

export const resendEmailVerification = async (user: IUser) => {
  if (user.emailVerified) {
    return { alreadyVerified: true, mailSent: false };
  }
  const result = await issueEmailVerification(user);
  return {
    alreadyVerified: false,
    mailSent: result.mailSent,
    verifyUrl: result.verifyUrl,
    messageId: result.messageId,
    sendError: result.sendError,
    sentTo: String(user.email || '').trim().toLowerCase(),
  };
};
