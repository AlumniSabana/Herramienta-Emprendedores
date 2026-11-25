import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sources } from '@emprendedor/core';
import { renderApp, SAMPLE_ANSWERS, seed } from './helpers';

describe('Fuentes y repetir', () => {
  it('muestra la elaboración CEIS, la versión y las 4 referencias', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    await renderApp('/resultado');
    const section = screen.getByRole('region', { name: 'Fuentes' });
    expect(section).toHaveTextContent('CEIS - Centro de Emprendimiento e Innovación Sabana');
    expect(section).toHaveTextContent(sources.version);
    expect(within(section).getAllByRole('listitem')).toHaveLength(4);
  });

  it('"Repetir el test" limpia respuestas y vuelve al bloque 1 conservando la sesión', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    const { user, container } = await renderApp('/resultado');
    await user.click(screen.getByRole('button', { name: /repetir el test/i }));
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0);
    expect(JSON.parse(window.sessionStorage.getItem('diagnostico-emprendedor-v2')!)).toMatchObject({
      answers: {},
      result: null,
    });
  });
});
