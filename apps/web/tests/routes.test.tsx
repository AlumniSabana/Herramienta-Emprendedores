import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, seed, uniformAnswers } from './helpers';

describe('guarda de bloques', () => {
  it('no se puede saltar a un bloque posterior al primero incompleto', async () => {
    seed();
    await renderApp('/test/6');
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
  });

  it('una recarga restaura el avance guardado en sessionStorage', async () => {
    const answers = uniformAnswers(3);
    for (const id of Object.keys(answers)) if (/^[5-9]\./.test(id)) delete answers[id];
    seed({ answers });
    await renderApp('/test/5');
    expect(screen.getByText(/bloque 5 de 9/i)).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(5);
  });
});
