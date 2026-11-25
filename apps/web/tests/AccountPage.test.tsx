import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { FakeAuthService } from '../src/auth/FakeAuthService';
import { EMAIL, renderApp } from './helpers';

const setup = () =>
  new FakeAuthService({
    accounts: [{ email: EMAIL, password: 'Clave_vieja1', name: 'Ana Pérez', faculty: 'Facultad de Medicina', program: 'Medicina' }],
    signedInAs: EMAIL,
  });

async function fillForm(r: Awaited<ReturnType<typeof renderApp>>, current: string, next: string, confirm = next) {
  await r.user.type(screen.getByLabelText('Contraseña actual'), current);
  await r.user.type(screen.getByLabelText('Contraseña nueva'), next);
  await r.user.type(screen.getByLabelText('Confirma tu contraseña nueva'), confirm);
  await r.user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

describe('AccountPage', () => {
  it('muestra nombre, facultad, programa y correo', async () => {
    await renderApp('/cuenta', { auth: setup() });
    await screen.findByText('Ana Pérez');
    const data = screen.getByRole('region', { name: 'Mis datos' });
    expect(data).toHaveTextContent('Ana Pérez');
    expect(data).toHaveTextContent('Facultad de Medicina');
    expect(data).toHaveTextContent('Medicina');
    expect(data).toHaveTextContent(EMAIL);
  });

  it('el encabezado ofrece "Mi cuenta"', async () => {
    await renderApp('/diagnostico', { auth: setup() });
    expect(await screen.findByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/cuenta');
  });

  it('una contraseña actual incorrecta da un mensaje claro', async () => {
    const r = await renderApp('/cuenta', { auth: setup() });
    await fillForm(r, 'otra-clave', 'Clave_nueva2');
    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta.');
  });

  it('rechaza una contraseña nueva corta y una confirmación distinta', async () => {
    const r = await renderApp('/cuenta', { auth: setup() });
    await fillForm(r, 'Clave_vieja1', '1234567', '12345678');
    expect(screen.getByLabelText('Contraseña nueva')).toHaveAccessibleDescription(/8 caracteres/i);
    expect(screen.getByLabelText('Confirma tu contraseña nueva')).toHaveAccessibleDescription(/no coinciden/i);
  });

  it('al cambiarla confirma, mantiene la sesión y la contraseña nueva sirve', async () => {
    const r = await renderApp('/cuenta', { auth: setup() });
    await fillForm(r, 'Clave_vieja1', 'Clave_nueva2');
    expect(await screen.findByRole('status')).toHaveTextContent('Contraseña actualizada.');
    expect(await r.auth.getSession()).not.toBeNull();
    expect((screen.getByLabelText('Contraseña actual') as HTMLInputElement).value).toBe('');
    await r.auth.signOut();
    await expect(r.auth.signIn(EMAIL, 'Clave_nueva2')).resolves.toBeUndefined();
  });

  it('sin sesión lleva al ingreso', async () => {
    await renderApp('/cuenta', { signedInAs: null });
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/cuenta', { auth: setup() });
    await screen.findByText('Ana Pérez');
    expect(await axe(container)).toHaveNoViolations();
  });
});
