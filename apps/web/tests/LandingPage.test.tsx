import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { landing } from '@emprendedor/core';
import { renderApp } from './helpers';

describe('LandingPage', () => {
  it('explica qué es la herramienta y qué mide', async () => {
    await renderApp('/', { signedInAs: null });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(landing.hero.title);
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(/cinco perfiles/i);
    expect(main).toHaveTextContent(/9 bloques de 5 afirmaciones/i);
    expect(main).toHaveTextContent(/radar/i);
    expect(main).toHaveTextContent(/10 minutos/i);
    expect(main).toHaveTextContent(/desarrollado/i);
    expect(main).toHaveTextContent(/potenciar/i);
  });

  it('muestra la tarjeta con 4 viñetas, 3 pasos y el bloque de privacidad', async () => {
    await renderApp('/', { signedInAs: null });
    const tool = screen.getByRole('region', { name: landing.tool.title });
    expect(within(tool).getAllByRole('listitem')).toHaveLength(4);
    const steps = screen.getByRole('region', { name: /cómo funciona/i });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: landing.privacy.title })).toBeInTheDocument();
  });

  it('sin sesión ofrece crear cuenta e ingresar en el encabezado y en el bloque principal', async () => {
    await renderApp('/', { signedInAs: null });
    expect(screen.getByRole('link', { name: 'Crear mi cuenta' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Ya tengo cuenta' })).toHaveAttribute('href', '/ingresar');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/ingresar');
  });

  it('con sesión ofrece ir al diagnóstico en lugar de crear cuenta o ingresar', async () => {
    await renderApp('/');
    expect(screen.getByRole('link', { name: 'Ir al diagnóstico' })).toHaveAttribute('href', '/diagnostico');
    expect(screen.queryByRole('link', { name: 'Crear mi cuenta' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ya tengo cuenta' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Cerrar sesión' }).length).toBeGreaterThan(0);
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = await renderApp('/', { signedInAs: null });
    expect(await axe(container)).toHaveNoViolations();
  });
});
