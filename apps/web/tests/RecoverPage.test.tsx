import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { FAKE_CODE } from '../src/auth/FakeAuthService';
import { renderApp } from './helpers';

type Rendered = Awaited<ReturnType<typeof renderApp>>;

const accounts = [{ email: 'ana@unisabana.edu.co', password: 'Clave_vieja1' }];

async function requestCode(r: Rendered, email: string) {
  await r.user.type(screen.getByLabelText('Correo institucional'), email);
  await r.user.click(screen.getByRole('button', { name: /enviar correo/i }));
}

describe('RecoverPage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it.each([
    ['con cuenta', 'ana@unisabana.edu.co'],
    ['sin cuenta', 'nadie@unisabana.edu.co'],
  ])('pedir el código %s muestra exactamente la misma pantalla', async (_caso, email) => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    await requestCode(r, email);
    expect(await screen.findByLabelText(/código de verificación/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revisa tu correo');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('con el código correcto y una contraseña nueva cambia la contraseña y deja la sesión iniciada', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    await requestCode(r, 'Ana@unisabana.edu.co');
    await r.user.type(await screen.findByLabelText(/código de verificación/i), FAKE_CODE);
    await r.user.type(screen.getByLabelText('Contraseña nueva'), 'Clave_nueva2');
    await r.user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(await screen.findByRole('heading', { name: /tu diagnóstico/i })).toBeInTheDocument();
    // la contraseña nueva ya sirve para ingresar
    await r.auth.signOut();
    await expect(r.auth.signIn('ana@unisabana.edu.co', 'Clave_nueva2')).resolves.toBeUndefined();
    await expect(r.auth.signIn('ana@unisabana.edu.co', 'Clave_vieja1')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('una contraseña de menos de 8 caracteres se rechaza en su campo', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    await requestCode(r, 'ana@unisabana.edu.co');
    await r.user.type(await screen.findByLabelText(/código de verificación/i), FAKE_CODE);
    await r.user.type(screen.getByLabelText('Contraseña nueva'), '1234567');
    await r.user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAccessibleDescription(/8 caracteres/i);
    expect(screen.queryByRole('heading', { name: /tu diagnóstico/i })).toBeNull();
  });

  it('un código incorrecto avisa y permite pedir uno nuevo tras la cuenta atrás', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    await requestCode(r, 'ana@unisabana.edu.co');
    await r.user.type(await screen.findByLabelText(/código de verificación/i), '000000');
    await r.user.type(screen.getByLabelText('Contraseña nueva'), 'Clave_nueva2');
    await r.user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El código no es correcto o venció. Pide uno nuevo.');

    act(() => void vi.advanceTimersByTime(61_000));
    await r.user.click(screen.getByRole('button', { name: /reenviar código/i }));
    expect(r.auth.recoveries).toEqual(['ana@unisabana.edu.co', 'ana@unisabana.edu.co']);
  });

  it('con el límite de envíos activo avisa que hay que esperar', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    r.auth.rateLimited = true;
    await requestCode(r, 'ana@unisabana.edu.co');
    expect(await screen.findByRole('alert')).toHaveTextContent('Espera un momento antes de pedir otro correo.');
    expect(screen.queryByLabelText(/código de verificación/i)).toBeNull();
  });

  it('rechaza un correo de otro dominio', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null });
    await requestCode(r, 'ana@gmail.com');
    expect(screen.getByLabelText('Correo institucional')).toHaveAccessibleDescription(/correo institucional/i);
    expect(r.auth.recoveries).toHaveLength(0);
  });

  it('no tiene violaciones de accesibilidad en ninguno de los dos pasos', async () => {
    const r = await renderApp('/recuperar', { signedInAs: null, accounts });
    expect(await axe(r.container)).toHaveNoViolations();
    await requestCode(r, 'ana@unisabana.edu.co');
    await screen.findByLabelText(/código de verificación/i);
    expect(await axe(r.container)).toHaveNoViolations();
  });
});
