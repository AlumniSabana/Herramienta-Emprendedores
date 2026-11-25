import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { FakeAuthService } from '../src/auth/FakeAuthService';
import { EMAIL, renderApp } from './helpers';

const recoveringAuth = () => {
  const auth = new FakeAuthService({ accounts: [{ email: EMAIL, password: 'Clave_vieja1' }] });
  auth.simulateRecoveryLink(EMAIL); // equivale a abrir el enlace del correo
  return auth;
};

describe('ResetPasswordPage', () => {
  it('con una sesión de recuperación pide la contraseña nueva y su confirmación', async () => {
    await renderApp('/restablecer', { auth: recoveringAuth() });
    expect(screen.getByRole('heading', { name: 'Define tu nueva contraseña' })).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña nueva')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirma tu contraseña nueva')).toBeInTheDocument();
  });

  it('rechaza una contraseña corta y una confirmación distinta, cada una en su campo', async () => {
    const r = await renderApp('/restablecer', { auth: recoveringAuth() });
    await r.user.type(screen.getByLabelText('Contraseña nueva'), '1234567');
    await r.user.type(screen.getByLabelText('Confirma tu contraseña nueva'), '12345678');
    await r.user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAccessibleDescription(/8 caracteres/i);
    expect(screen.getByLabelText('Confirma tu contraseña nueva')).toHaveAccessibleDescription(/no coinciden/i);
    expect((await r.auth.getSession())?.recovery).toBe(true);
  });

  it('al guardar libera el acceso, lleva al diagnóstico y la contraseña nueva sirve', async () => {
    const r = await renderApp('/restablecer', { auth: recoveringAuth() });
    await r.user.type(screen.getByLabelText('Contraseña nueva'), 'Clave_nueva2');
    await r.user.type(screen.getByLabelText('Confirma tu contraseña nueva'), 'Clave_nueva2');
    await r.user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('heading', { name: /tu diagnóstico/i })).toBeInTheDocument();
    expect((await r.auth.getSession())?.recovery).toBe(false);
    await r.auth.signOut();
    await expect(r.auth.signIn(EMAIL, 'Clave_nueva2')).resolves.toBeUndefined();
    await expect(r.auth.signIn(EMAIL, 'Clave_vieja1')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('"Cancelar" cierra la sesión de recuperación sin cambiar la contraseña', async () => {
    const r = await renderApp('/restablecer', { auth: recoveringAuth() });
    await r.user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByRole('link', { name: 'Crear mi cuenta' })).toBeInTheDocument();
    expect(await r.auth.getSession()).toBeNull();
    await expect(r.auth.signIn(EMAIL, 'Clave_vieja1')).resolves.toBeUndefined();
  });

  it('sin sesión ni enlace válido lo dice y ofrece pedir otro', async () => {
    await renderApp('/restablecer', { signedInAs: null });
    expect(screen.getByRole('heading', { name: 'Este enlace no es válido o ya venció' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pedir un enlace nuevo/i })).toHaveAttribute('href', '/recuperar');
  });

  it('muestra el error que trajo el enlace (vencido o ya usado)', async () => {
    window.sessionStorage.setItem('auth-link-error', 'otp_expired');
    await renderApp('/restablecer', { signedInAs: null });
    expect(screen.getByRole('alert')).toHaveTextContent('El enlace venció o ya fue usado. Pide uno nuevo.');
  });

  it('una sesión normal (sin recuperación) va a "Mi cuenta"', async () => {
    await renderApp('/restablecer');
    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/restablecer', { auth: recoveringAuth() });
    expect(await axe(container)).toHaveNoViolations();
  });
});
