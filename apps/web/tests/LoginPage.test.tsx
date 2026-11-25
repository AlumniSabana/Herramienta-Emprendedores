import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { FAKE_CODE } from '../src/auth/FakeAuthService';
import { renderApp } from './helpers';

const accounts = [
  { email: 'ana@unisabana.edu.co', password: 'Clave_segura1' },
  { email: 'nueva@unisabana.edu.co', password: 'Clave_segura1', verified: false },
];

async function login(r: Awaited<ReturnType<typeof renderApp>>, email: string, password: string) {
  await r.user.type(screen.getByLabelText('Correo institucional'), email);
  await r.user.type(screen.getByLabelText('Contraseña'), password);
  await r.user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('LoginPage', () => {
  it('con credenciales correctas entra al diagnóstico', async () => {
    const r = await renderApp('/ingresar', { signedInAs: null, accounts });
    await login(r, 'Ana@UniSabana.edu.co', 'Clave_segura1');
    expect(await screen.findByRole('heading', { name: /tu diagnóstico/i })).toBeInTheDocument();
  });

  it.each([
    ['contraseña incorrecta', 'ana@unisabana.edu.co', 'otra-clave'],
    ['correo sin cuenta', 'noexiste@unisabana.edu.co', 'Clave_segura1'],
  ])('%s: el mismo mensaje, sin decir cuál dato falló', async (_caso, email, password) => {
    const r = await renderApp('/ingresar', { signedInAs: null, accounts });
    await login(r, email, password);
    expect((await screen.findByRole('alert')).textContent).toBe('El correo o la contraseña no coinciden.');
  });

  it('una cuenta sin verificar lleva al código, reenvía uno y permite terminar', async () => {
    const r = await renderApp('/ingresar', { signedInAs: null, accounts });
    await login(r, 'nueva@unisabana.edu.co', 'Clave_segura1');
    expect(await screen.findByLabelText(/código/i)).toBeInTheDocument();
    expect(r.auth.resends).toEqual(['nueva@unisabana.edu.co']);

    await r.user.type(screen.getByLabelText(/código/i), FAKE_CODE);
    await r.user.click(screen.getByRole('button', { name: /verificar/i }));
    expect(await screen.findByRole('heading', { name: /tu diagnóstico/i })).toBeInTheDocument();
  });

  it('ofrece olvidé mi contraseña y crear cuenta', async () => {
    await renderApp('/ingresar', { signedInAs: null });
    expect(screen.getByRole('link', { name: 'Olvidé mi contraseña' })).toHaveAttribute('href', '/recuperar');
    expect(screen.getByRole('link', { name: 'Créala aquí' })).toHaveAttribute('href', '/registro');
  });

  it('con sesión iniciada no muestra el ingreso', async () => {
    await renderApp('/ingresar');
    expect(screen.queryByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeNull();
    expect(await screen.findByRole('heading', { name: /tu diagnóstico/i })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/ingresar', { signedInAs: null });
    expect(await axe(container)).toHaveNoViolations();
  });
});
