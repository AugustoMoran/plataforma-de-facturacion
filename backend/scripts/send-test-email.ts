/**
 * Uso (en Render shell o local con .env cargado):
 *   npx ts-node scripts/send-test-email.ts augusto@example.com
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  getMailerConfigStatus,
  sendMail,
  verifyMailerTransport,
} from '../src/modules/notifications/services/mailerService';

const to = process.argv[2]?.trim();
if (!to) {
  console.error('Uso: npx ts-node scripts/send-test-email.ts <email>');
  process.exit(1);
}

(async () => {
  const config = getMailerConfigStatus();
  console.log('Mailer config:', config);

  const verify = await verifyMailerTransport();
  console.log('SMTP verify:', verify);
  if (!verify.ok) process.exit(2);

  const result = await sendMail({
    to,
    subject: 'Prueba Oso Sound mailer',
    text: `Correo de prueba enviado ${new Date().toISOString()}`,
  });
  console.log('Send result:', result);
  process.exit(result.sent ? 0 : 3);
})();
