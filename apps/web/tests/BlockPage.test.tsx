import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { answerBlock, renderApp, seed, uniformAnswers } from './helpers';

describe('BlockPage', () => {
  it('muestra 5 afirmaciones con la escala propia del bloque 1', async () => {
    seed();
    await renderApp('/test/1');
    expect(screen.getByText(/bloque 1 de 9/i)).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(5);
    expect(screen.getAllByLabelText('No es muy cierto de mí')).toHaveLength(5);
    expect(screen.queryByLabelText('Nunca')).toBeNull();
  });

  it('los bloques 2 a 9 usan "Nunca…Usualmente"', async () => {
    seed({ answers: uniformAnswers(3) });
    await renderApp('/test/2');
    expect(screen.getAllByLabelText('Nunca')).toHaveLength(5);
    expect(screen.getAllByLabelText('Usualmente')).toHaveLength(5);
  });

  it('no avanza con ítems sin responder y señala los pendientes', async () => {
    seed();
    const { user, container } = await renderApp('/test/1');
    await user.click(container.querySelector('input[type="radio"][value="3"]')!);
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/falta responder/i);
    expect(screen.getByText(/bloque 1 de 9/i)).toBeInTheDocument();
  });

  it('avanza al completar y Anterior conserva las respuestas', async () => {
    seed();
    const { user, container } = await renderApp('/test/1');
    await answerBlock(user, container, 3);
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(await screen.findByText(/bloque 2 de 9/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(await screen.findByText(/bloque 1 de 9/i)).toBeInTheDocument();
    const checked = container.querySelectorAll('input[type="radio"]:checked');
    expect(checked).toHaveLength(5);
    for (const r of checked) expect((r as HTMLInputElement).value).toBe('3');
  });

  it('muestra la barra de progreso', async () => {
    seed({ answers: uniformAnswers(2) });
    await renderApp('/test/4');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
  });

  it('el bloque 9 muestra Finalizar en lugar de Siguiente', async () => {
    seed({ answers: uniformAnswers(2) });
    await renderApp('/test/9');
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /siguiente/i })).toBeNull();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    seed();
    const { container } = await renderApp('/test/1');
    expect(await axe(container)).toHaveNoViolations();
  });
});
