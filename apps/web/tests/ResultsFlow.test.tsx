import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scoreAnswers } from '@emprendedor/core';
import { FakeAuthService } from '../src/auth/FakeAuthService';
import { FakeResultsService } from '../src/results/FakeResultsService';
import { answerBlock, EMAIL, renderApp, SAMPLE_ANSWERS, seed } from './helpers';

afterEach(() => vi.unstubAllGlobals());

/** Simula POST /api/submissions: comprueba el token, puntúa con la lógica compartida y guarda en el historial. */
function stubApi(auth: FakeAuthService, results: FakeResultsService, mode: 'ok' | 'unauthorized' | 'offline' = 'ok') {
  const calls: { token: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      if (mode === 'offline') throw new TypeError('Failed to fetch');
      const token = String((init.headers as Record<string, string>).Authorization).replace('Bearer ', '');
      const body = JSON.parse(String(init.body)) as { answers: Record<string, number> };
      calls.push({ token, body });
      const userId = auth.userIdForToken(token);
      if (mode === 'unauthorized' || !userId) return { ok: false, status: 401 };
      results.add(userId, { id: `r${calls.length}`, ...scoreAnswers(body.answers), createdAt: new Date().toISOString() });
      return { ok: true, status: 201 };
    }),
  );
  return calls;
}

function setup() {
  const auth = new FakeAuthService({ signedInAs: EMAIL, accounts: [{ email: 'luis@unisabana.edu.co', name: 'Luis Gómez' }] });
  const results = new FakeResultsService(() => auth.userIdFor(EMAIL));
  return { auth, results };
}

const withoutBlock9 = () => {
  const a = { ...SAMPLE_ANSWERS };
  for (const id of ['9.1', '9.2', '9.3', '9.4', '9.5']) delete a[id];
  return a;
};

async function finishBlock9(r: Awaited<ReturnType<typeof renderApp>>) {
  await answerBlock(r.user, r.container, 3);
  await r.user.click(screen.getByRole('button', { name: /finalizar/i }));
  await screen.findByTestId('dominant');
}

describe('resultados por cuenta', () => {
  it('al finalizar llama a la API con el token de la sesión y solo las respuestas', async () => {
    const { auth, results } = setup();
    const calls = stubApi(auth, results);
    seed({ answers: withoutBlock9() });
    const r = await renderApp('/test/9', { auth, results });
    await finishBlock9(r);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.token).toBe(`token-${auth.userIdFor(EMAIL)}`);
    expect(Object.keys(calls[0]!.body)).toEqual(['answers']);
    expect(Object.keys(calls[0]!.body.answers as object)).toHaveLength(45);
  });

  it('al volver a mi diagnóstico aparece el resultado recién guardado', async () => {
    const { auth, results } = setup();
    stubApi(auth, results);
    seed({ answers: withoutBlock9() });
    const r = await renderApp('/test/9', { auth, results });
    await finishBlock9(r);
    await r.user.click(screen.getByRole('link', { name: /mi diagnóstico/i }));
    expect(await screen.findByText('Tu último resultado', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rehacer el test' })).toBeInTheDocument();
  });

  it('"Ver mi resultado" abre el radar y el detalle a partir del resultado guardado', async () => {
    const { auth, results } = setup();
    results.add(auth.userIdFor(EMAIL)!, { id: 'r1', ...scoreAnswers(SAMPLE_ANSWERS), createdAt: '2026-11-20T15:30:00.000Z' });
    const r = await renderApp('/diagnostico', { auth, results });
    await r.user.click(await screen.findByRole('button', { name: 'Ver mi resultado' }));
    expect(await screen.findByTestId('dominant')).toHaveTextContent('Realizador - Comerciante');
    expect(screen.getAllByRole('button', { name: /de 36$/ })).toHaveLength(5);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('"Rehacer el test" empieza de cero y, al terminar, se conserva el resultado anterior y el nuevo pasa a ser el último', async () => {
    const { auth, results } = setup();
    stubApi(auth, results);
    const userId = auth.userIdFor(EMAIL)!;
    results.add(userId, { id: 'viejo', ...scoreAnswers(SAMPLE_ANSWERS), createdAt: '2026-11-01T10:00:00.000Z' });
    seed({ answers: SAMPLE_ANSWERS }); // respuestas en memoria de un intento anterior

    const r = await renderApp('/diagnostico', { auth, results });
    await r.user.click(await screen.findByRole('button', { name: 'Rehacer el test' }));
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
    expect(r.container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0);

    for (let b = 1; b <= 9; b++) {
      await screen.findByText(new RegExp(`bloque ${b} de 9`, 'i'));
      await answerBlock(r.user, r.container, 4);
      await r.user.click(screen.getByRole('button', { name: b === 9 ? /finalizar/i : /siguiente/i }));
    }
    expect(await screen.findByTestId('dominant')).toHaveTextContent('Realista - Gerencial');

    expect(results.all(userId)).toHaveLength(2);
    await r.user.click(screen.getByRole('link', { name: /mi diagnóstico/i }));
    expect(await screen.findByText('Realista - Gerencial', { exact: false })).toBeInTheDocument();
  });

  it('otra cuenta nunca ve los resultados de la primera', async () => {
    const auth = new FakeAuthService({ signedInAs: 'luis@unisabana.edu.co', accounts: [{ email: EMAIL }] });
    const results = new FakeResultsService(() => auth.userIdFor('luis@unisabana.edu.co'));
    results.add(auth.userIdFor(EMAIL)!, { id: 'r1', ...scoreAnswers(SAMPLE_ANSWERS), createdAt: '2026-11-20T15:30:00.000Z' });
    await renderApp('/diagnostico', { auth, results });
    expect(await screen.findByRole('link', { name: 'Empezar el test' })).toBeInTheDocument();
    expect(screen.queryByText('Realizador - Comerciante')).toBeNull();
  });

  it('con 401 muestra que la sesión venció y conserva las respuestas', async () => {
    const { auth, results } = setup();
    stubApi(auth, results, 'unauthorized');
    seed({ answers: withoutBlock9() });
    const r = await renderApp('/test/9', { auth, results });
    await finishBlock9(r);
    expect(await screen.findByRole('status', { name: /guardado/i })).toHaveTextContent(/sesión venció/i);
    expect(screen.getByRole('button', { name: /ingresar de nuevo/i })).toBeInTheDocument();
    const stored = JSON.parse(window.sessionStorage.getItem('diagnostico-emprendedor-v2')!);
    expect(Object.keys(stored.answers)).toHaveLength(45);
  });

  it('si falla el guardado muestra el resultado con un aviso no bloqueante', async () => {
    const { auth, results } = setup();
    stubApi(auth, results, 'offline');
    seed({ answers: withoutBlock9() });
    const r = await renderApp('/test/9', { auth, results });
    await finishBlock9(r);
    expect(await screen.findByRole('status', { name: /guardado/i })).toHaveTextContent(/no pudimos registrar/i);
    expect(screen.getByTestId('dominant')).toBeInTheDocument();
  });
});
