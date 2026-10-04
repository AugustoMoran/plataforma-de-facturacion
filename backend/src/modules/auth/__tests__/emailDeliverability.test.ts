import { getEmailDeliverability, isInstitutionalEmail } from '../services/emailDeliverability';

describe('emailDeliverability', () => {
  it('flags institutional domains', () => {
    expect(getEmailDeliverability('a@institutobuenviaje.edu.ar')).toBe('institutional');
    expect(getEmailDeliverability('a@uni.edu')).toBe('institutional');
    expect(isInstitutionalEmail('x@mail.ac.ar')).toBe(true);
  });

  it('allows common personal providers', () => {
    expect(getEmailDeliverability('a@gmail.com')).toBe('ok');
    expect(getEmailDeliverability('a@outlook.com')).toBe('ok');
  });
});
