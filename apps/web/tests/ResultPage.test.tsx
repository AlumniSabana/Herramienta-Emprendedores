import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { answerBlock, renderApp, SAMPLE_ANSWERS, seed, uniformAnswers } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('ResultPage', () => {
  it('con el ejemplo del Excel muestra dominante, secundario y los cinco puntajes', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    await renderApp('/resultado');
    expect(screen.getByTestId('dominant')).toHaveTextContent('Realizador - Comerciante');
    expect(screen.getByTestId('secondary')).toHaveTextContent('Investigativo - Creador');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1).map((r) => r.textContent ?? '');
    expect(rows.join('|')).toMatch(/Realista - Gerencial.*27/);
    expect(rows.join('|')).toMatch(/Realizador - Comerciante.*34/);
    expect(rows.join('|')).toMatch(/Artístico - Imaginativo.*26/);
    expect(rows.join('|')).toMatch(/Movilizador - Social.*25/);
    expect(rows.join('|')).toMatch(/Investigativo - Creador.*30/);
  });

  it('con los cinco perfiles empatados todos son dominantes y no hay secundario', async () => {
    seed({ answers: uniformAnswers(4) });
    await renderApp('/resultado');
    const dominant = screen.getByTestId('dominant');
    for (const n of ['Realista - Gerencial', 'Realizador - Comerciante', 'Artístico - Imaginativo', 'Movilizador - Social', 'Investigativo - Creador'])
      expect(dominant).toHaveTextContent(n);
    expect(screen.queryByTestId('secondary')).toBeNull();
  });

  it('muestra un aviso no bloqueante si no se pudo guardar', async () => {
    seed({ answers: SAMPLE_ANSWERS, saveStatus: 'failed' });
    await renderApp('/resultado');
    expect(screen.getByRole('status', { name: /guardado/i })).toHaveTextContent(/no pudimos registrar/i);
    expect(screen.getByTestId('dominant')).toBeInTheDocument();
  });

  it('flujo final: finalizar el bloque 9 con la API caída igual muestra el resultado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const partial = { ...SAMPLE_ANSWERS };
    for (const id of ['9.1', '9.2', '9.3', '9.4', '9.5']) delete partial[id];
    seed({ answers: partial });
    const { user, container } = await renderApp('/test/9');
    await answerBlock(user, container, 3);
    await user.click(screen.getByRole('button', { name: /finalizar/i }));
    expect(await screen.findByTestId('dominant')).toBeInTheDocument();
    expect(await screen.findByRole('status', { name: /guardado/i })).toHaveTextContent(/no pudimos registrar/i);
  });

  it('no tiene violaciones de accesibilidad', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    const { container } = await renderApp('/resultado');
    expect(await axe(container)).toHaveNoViolations();
  });
});
