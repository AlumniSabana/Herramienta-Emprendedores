import { describe, expect, it } from 'vitest';
import { validateInstitutionalEmail } from '../src/index';

const D = 'unisabana.edu.co';

describe('validateInstitutionalEmail', () => {
  it('acepta y normaliza', () => {
    expect(validateInstitutionalEmail('  Ana.Perez@UniSabana.edu.co ', D)).toEqual({
      ok: true,
      email: 'ana.perez@unisabana.edu.co',
    });
  });

  it.each(['sin-arroba', 'a@', '@unisabana.edu.co', 'a b@unisabana.edu.co', 'a@@unisabana.edu.co', ''])(
    'rechaza formato inválido: "%s"',
    (e) => expect(validateInstitutionalEmail(e, D).ok).toBe(false),
  );

  it.each(['x@gmail.com', 'x@unisabana.edu.co.example.com', 'x@xunisabana.edu.co', 'x@mail.unisabana.edu.co'])(
    'rechaza dominio distinto: %s',
    (e) => expect(validateInstitutionalEmail(e, D).ok).toBe(false),
  );

  it('el dominio es configurable y admite "@" inicial', () => {
    expect(validateInstitutionalEmail('a@otra.edu.co', '@otra.edu.co').ok).toBe(true);
    expect(validateInstitutionalEmail('a@unisabana.edu.co', 'otra.edu.co').ok).toBe(false);
  });
});
