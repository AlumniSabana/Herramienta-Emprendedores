import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import sample from '../../../packages/core/tests/fixtures/excel-sample.json';
import { FakeAuthService } from '../src/auth/FakeAuthService';
import { FakeResultsService } from '../src/results/FakeResultsService';
import { EMAIL, renderApp } from './helpers';

function setup(withResult: boolean) {
  const auth = new FakeAuthService({ signedInAs: EMAIL });
  const userId = auth.userIdFor(EMAIL)!;
  const results = new FakeResultsService(() => userId);
  if (withResult)
    results.add(userId, {
      id: 'r1',
      scores: sample.expectedScores,
      dominant: ['realizador-comerciante'],
      secondary: ['investigativo-creador'],
      createdAt: '2026-11-20T15:30:00.000Z',
    });
  return { auth, results };
}

describe('DiagnosticHomePage', () => {
  it('saluda por el nombre del perfil', async () => {
    await renderApp('/diagnostico', setup(false));
    expect(await screen.findByText(/hola, ana/i)).toBeInTheDocument();
  });

  it('sin resultado guardado muestra cómo empezar', async () => {
    await renderApp('/diagnostico', setup(false));
    expect(await screen.findByRole('link', { name: 'Empezar el test' })).toHaveAttribute('href', '/test/1');
    expect(screen.queryByRole('button', { name: /rehacer/i })).toBeNull();
  });

  it('con resultado guardado muestra el último, su fecha y las opciones de verlo o rehacerlo', async () => {
    await renderApp('/diagnostico', setup(true));
    expect(await screen.findByText('Realizador - Comerciante')).toBeInTheDocument();
    expect(screen.getByText(/noviembre de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver mi resultado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rehacer el test' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Empezar el test' })).toBeNull();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/diagnostico', setup(true));
    await screen.findByText('Realizador - Comerciante');
    expect(await axe(container)).toHaveNoViolations();
  });
});
