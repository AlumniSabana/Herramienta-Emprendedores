import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { faculties } from '@emprendedor/core';
import { FAKE_CODE } from '../src/auth/FakeAuthService';
import { renderApp } from './helpers';

type Rendered = Awaited<ReturnType<typeof renderApp>>;

async function fill(
  { user }: Rendered,
  over: Partial<Record<'name' | 'faculty' | 'program' | 'email' | 'password', string>> & { consent?: boolean } = {},
) {
  const v = {
    name: 'Ana Pérez',
    faculty: 'Facultad de Ingeniería',
    program: 'Ingeniería Industrial',
    email: 'ana.perez@unisabana.edu.co',
    password: 'Clave_segura1',
    consent: true,
    ...over,
  };
  await user.type(screen.getByLabelText('Nombre completo'), v.name);
  if (v.faculty) await user.selectOptions(screen.getByLabelText('Facultad'), v.faculty);
  if (v.program) await user.selectOptions(screen.getByLabelText('Programa'), v.program);
  await user.type(screen.getByLabelText('Correo institucional'), v.email);
  await user.type(screen.getByLabelText('Contraseña'), v.password);
  if (v.consent) await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
}

const submit = (r: Rendered) => r.user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

describe('RegisterPage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('el programa depende de la facultad y se vacía al cambiarla', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    const programa = screen.getByLabelText('Programa');
    expect(within(programa).getAllByRole('option')).toHaveLength(1); // solo el vacío

    await r.user.selectOptions(screen.getByLabelText('Facultad'), 'Facultad de Medicina');
    expect(within(programa).getAllByRole('option').map((o) => o.textContent)).toEqual(['Selecciona…', 'Medicina']);

    await r.user.selectOptions(programa, 'Medicina');
    await r.user.selectOptions(screen.getByLabelText('Facultad'), 'Facultad de Ingeniería');
    expect((programa as HTMLSelectElement).value).toBe('');
    const ing = faculties.find((f) => f.name === 'Facultad de Ingeniería')!;
    expect(within(programa).getAllByRole('option')).toHaveLength(ing.programs.length + 1);
  });

  it('rechaza dominio, contraseña corta y consentimiento sin marcar, con el error asociado a su campo', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    await fill(r, { email: 'ana@gmail.com', password: '1234567', consent: false });
    await submit(r);
    expect(screen.getByLabelText('Correo institucional')).toHaveAccessibleDescription(/correo institucional/i);
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(/8 caracteres/i);
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).toHaveAccessibleDescription(/aceptar el tratamiento/i);
    expect(r.auth.signUps).toHaveLength(0);
    expect(screen.queryByLabelText(/código/i)).toBeNull();
  });

  it('con datos válidos pasa al código sin entrar todavía y envía los datos de la cuenta', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    await fill(r);
    await submit(r);
    expect(await screen.findByLabelText(/código/i)).toBeInTheDocument();
    expect(r.auth.signUps).toEqual([
      {
        name: 'Ana Pérez',
        faculty: 'Facultad de Ingeniería',
        program: 'Ingeniería Industrial',
        email: 'ana.perez@unisabana.edu.co',
        password: 'Clave_segura1',
        consent: true,
      },
    ]);
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  });

  it('con el código correcto verifica y deja la sesión iniciada', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    await fill(r);
    await submit(r);
    await r.user.type(await screen.findByLabelText(/código/i), ` ${FAKE_CODE.slice(0, 3)} ${FAKE_CODE.slice(3)} `);
    await r.user.click(screen.getByRole('button', { name: /verificar/i }));
    expect((await screen.findAllByRole('button', { name: 'Cerrar sesión' })).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/código/i)).toBeNull();
  });

  it('con un código incorrecto avisa y permite reenviar tras la cuenta atrás de 60 s', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    await fill(r);
    await submit(r);
    await r.user.type(await screen.findByLabelText(/código/i), '000000');
    await r.user.click(screen.getByRole('button', { name: /verificar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El código no es correcto o venció. Pide uno nuevo.');

    const resend = screen.getByRole('button', { name: /reenviar código/i });
    expect(resend).toBeDisabled();
    expect(resend).toHaveTextContent(/\d+ s/);
    act(() => void vi.advanceTimersByTime(61_000));
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeEnabled();

    await r.user.click(screen.getByRole('button', { name: /reenviar código/i }));
    expect(r.auth.resends).toEqual(['ana.perez@unisabana.edu.co']);
    expect(await screen.findByRole('status')).toHaveTextContent(/código nuevo/i);
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeDisabled();
  });

  it('con un correo que ya tiene cuenta lo dice y ofrece ingresar o recuperar la contraseña', async () => {
    const r = await renderApp('/registro', { signedInAs: null, accounts: [{ email: 'ana.perez@unisabana.edu.co' }] });
    await fill(r);
    await submit(r);
    expect(await screen.findByRole('alert')).toHaveTextContent(/ya tiene cuenta/i);
    expect(screen.getByRole('link', { name: /ingresar con esta cuenta/i })).toHaveAttribute('href', '/ingresar');
    expect(screen.getByRole('link', { name: /recuperar mi contraseña/i })).toHaveAttribute('href', '/recuperar');
    expect(screen.queryByLabelText(/código/i)).toBeNull();
  });

  it('un doble clic no envía dos solicitudes', async () => {
    const r = await renderApp('/registro', { signedInAs: null });
    r.auth.delayMs = 100;
    await fill(r);
    const button = screen.getByRole('button', { name: 'Crear cuenta' });
    await r.user.dblClick(button);
    await screen.findByLabelText(/código/i);
    expect(r.auth.signUps).toHaveLength(1);
  });

  it('con sesión iniciada no muestra el registro', async () => {
    await renderApp('/registro');
    expect(screen.queryByRole('heading', { name: 'Crea tu cuenta' })).toBeNull();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/registro', { signedInAs: null });
    expect(await axe(container)).toHaveNoViolations();
  });
});
