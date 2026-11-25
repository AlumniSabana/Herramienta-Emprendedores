import { describe, expect, it } from 'vitest';
import {
  MIN_PASSWORD_LENGTH,
  cleanVerificationCode,
  validateRecovery,
  validateRegistration,
  validateVerificationCode,
} from '../src/index';

const D = 'unisabana.edu.co';
const valid = {
  name: '  Ana Pérez  ',
  faculty: 'Facultad de Ingeniería',
  program: 'Ingeniería Industrial',
  email: '  Ana.Perez@UniSabana.edu.co ',
  password: 'Clave_segura1',
  consent: true,
};

describe('validateRegistration', () => {
  it('acepta datos válidos y los normaliza', () => {
    const r = validateRegistration(valid, D);
    expect(r).toEqual({
      ok: true,
      value: { ...valid, name: 'Ana Pérez', email: 'ana.perez@unisabana.edu.co' },
    });
  });

  it('la contraseña exige mínimo 8 caracteres', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    const short = validateRegistration({ ...valid, password: '1234567' }, D);
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.errors.password).toMatch(/8 caracteres/);
    expect(validateRegistration({ ...valid, password: '12345678' }, D).ok).toBe(true);
  });

  it('el nombre debe tener entre 2 y 120 caracteres tras recortar', () => {
    expect(validateRegistration({ ...valid, name: ' a ' }, D).ok).toBe(false);
    expect(validateRegistration({ ...valid, name: 'a'.repeat(121) }, D).ok).toBe(false);
    expect(validateRegistration({ ...valid, name: 'a'.repeat(120) }, D).ok).toBe(true);
  });

  it('la facultad debe existir y el programa pertenecer a ella', () => {
    const noFaculty = validateRegistration({ ...valid, faculty: 'Facultad inventada' }, D);
    expect(noFaculty.ok).toBe(false);
    if (!noFaculty.ok) expect(noFaculty.errors).toHaveProperty('faculty');

    const wrongProgram = validateRegistration({ ...valid, program: 'Medicina' }, D);
    expect(wrongProgram.ok).toBe(false);
    if (!wrongProgram.ok) expect(wrongProgram.errors).toHaveProperty('program');

    expect(validateRegistration({ ...valid, faculty: 'Otra / no está en la lista', program: 'Posgrado' }, D).ok).toBe(true);
  });

  it('rechaza correo de otro dominio, con sufijo o con formato inválido', () => {
    for (const email of ['a@gmail.com', 'a@unisabana.edu.co.example.com', 'sin-arroba', '']) {
      const r = validateRegistration({ ...valid, email }, D);
      expect(r.ok, email).toBe(false);
      if (!r.ok) expect(r.errors).toHaveProperty('email');
    }
  });

  it('exige el consentimiento', () => {
    const r = validateRegistration({ ...valid, consent: false }, D);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.consent).toMatch(/tratamiento de datos/i);
  });

  it('reporta todos los errores a la vez, por campo', () => {
    const r = validateRegistration({ name: '', faculty: '', program: '', email: '', password: '', consent: false }, D);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['consent', 'email', 'faculty', 'name', 'password', 'program']);
  });
});

describe('códigos de verificación', () => {
  it('limpia espacios y saltos de línea', () => {
    expect(cleanVerificationCode(' 123 456\n')).toBe('123456');
    expect(validateVerificationCode(' 12 34 56 ')).toEqual({ ok: true, code: '123456' });
  });
  it('exige solo dígitos y no vacío', () => {
    expect(validateVerificationCode('').ok).toBe(false);
    expect(validateVerificationCode('12a456').ok).toBe(false);
  });
});

describe('validateRecovery', () => {
  const ok = { email: 'A@unisabana.edu.co', code: ' 123456 ', newPassword: '12345678' };
  it('valida correo, código y contraseña nueva', () => {
    expect(validateRecovery(ok, D)).toEqual({
      ok: true,
      value: { email: 'a@unisabana.edu.co', code: '123456', newPassword: '12345678' },
    });
  });
  it('rechaza contraseña de menos de 8, código inválido y dominio incorrecto', () => {
    const r = validateRecovery({ email: 'a@gmail.com', code: 'xx', newPassword: '1234567' }, D);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['code', 'email', 'newPassword']);
  });
});
