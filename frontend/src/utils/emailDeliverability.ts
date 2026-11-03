export type EmailDeliverability = 'ok' | 'institutional';

export const getEmailDeliverability = (email: string): EmailDeliverability => {
  const domain = String(email || '').split('@')[1]?.trim().toLowerCase();
  if (!domain) return 'ok';

  const institutional =
    domain.endsWith('.edu.ar') ||
    domain.endsWith('.edu') ||
    domain.includes('.edu.') ||
    domain.endsWith('.ac.ar') ||
    domain.endsWith('.gob.ar');

  return institutional ? 'institutional' : 'ok';
};

export const isInstitutionalEmail = (email: string) =>
  getEmailDeliverability(email) === 'institutional';
