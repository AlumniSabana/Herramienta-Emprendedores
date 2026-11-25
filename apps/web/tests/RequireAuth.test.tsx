import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FakeAuthService } from '../src/auth/FakeAuthService';
import { EMAIL, renderApp, seed, uniformAnswers } from './helpers';

describe('RequireAuth', () => {
  it('sin sesión lleva al ingreso y, tras ingresar, vuelve a la ruta pedida', async () => {
    const r = await renderApp('/test/1', { signedInAs: null, accounts: [{ email: EMAIL, password: 'Clave_segura1' }] });
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
    await r.user.type(screen.getByLabelText('Correo institucional'), EMAIL);
    await r.user.type(screen.getByLabelText('Contraseña'), 'Clave_segura1');
    await r.user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
  });

  it('también protege /resultado', async () => {
    await renderApp('/resultado', { signedInAs: null });
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });

  it('mientras se restaura la sesión muestra "Cargando…" y no redirige', async () => {
    class Slow extends FakeAuthService {
      override async getSession() {
        await new Promise((r) => setTimeout(r, 80));
        return super.getSession();
      }
    }
    await renderApp('/test/1', { auth: new Slow({ signedInAs: EMAIL }), wait: false });
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeNull();
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
  });

  it('al cerrar sesión se limpian las respuestas y el resultado del navegador', async () => {
    seed({ answers: uniformAnswers(3) });
    const r = await renderApp('/test/9');
    await r.user.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0]!);
    expect(await screen.findByRole('link', { name: 'Crear mi cuenta' })).toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem('diagnostico-emprendedor-v2')!)).toMatchObject({
      answers: {},
      result: null,
    });
    expect(await r.auth.getSession()).toBeNull();
  });

  it('una sesión de recuperación solo puede usar /restablecer, también tras recargar', async () => {
    const auth = new FakeAuthService({ accounts: [{ email: EMAIL }] });
    auth.simulateRecoveryLink(EMAIL);
    const first = await renderApp('/test/1', { auth });
    expect(await screen.findByRole('heading', { name: 'Define tu nueva contraseña' })).toBeInTheDocument();
    expect(screen.queryByText(/bloque 1 de 9/i)).toBeNull();
    first.unmount();

    // "recarga": la misma sesión persistida, otra ruta protegida
    await renderApp('/diagnostico', { auth });
    expect(await screen.findByRole('heading', { name: 'Define tu nueva contraseña' })).toBeInTheDocument();
  });
});
