import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { profileById, profiles } from '@emprendedor/core';
import { ProfileDetail } from '../src/components/ProfileDetail';
import { renderApp, SAMPLE_ANSWERS, seed, uniformAnswers } from './helpers';

const SECTIONS = [
  /^Descripción$/,
  /^Fortalezas$/,
  /^Oportunidades de mejora$/,
  /^Competencias fuertes/,
  /^Competencias para potenciar/,
  /^Perfiles emprendedores que lo complementan$/,
  /^Consejos prácticos/,
];

describe('ProfileDetail', () => {
  it.each(profiles.map((p) => [p.name, p] as const))('%s muestra las siete secciones con contenido', (_name, profile) => {
    const { container } = render(<ProfileDetail profile={profile} />);
    for (const re of SECTIONS) expect(screen.getByRole('heading', { name: re })).toBeInTheDocument();
    expect(container).toHaveTextContent(profile.strengths);
    expect(container).toHaveTextContent(profile.improvementAreas);
    expect(container).toHaveTextContent(profile.strongCompetencies[0]!.items[0]!);
    expect(container).toHaveTextContent(profile.competenciesToDevelop[0]!.items[0]!);
    expect(container).toHaveTextContent(profile.practicalAdvice.steps[0]!);
    for (const c of profile.complementaryProfiles) expect(container).toHaveTextContent(profileById(c)!.name);
  });
});

describe('detalle en la pantalla de resultados', () => {
  it('abre por defecto el perfil dominante', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    await renderApp('/resultado');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { level: 2, name: 'Realizador - Comerciante' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Realizador - Comerciante' })).toHaveAttribute('aria-selected', 'true');
  });

  it('con empate abre el primero de los empatados', async () => {
    seed({ answers: uniformAnswers(3) });
    await renderApp('/resultado');
    expect(screen.getByRole('tab', { name: 'Realista - Gerencial' })).toHaveAttribute('aria-selected', 'true');
  });

  it('cambia de perfil con las pestañas y con el radar', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    const { user } = await renderApp('/resultado');
    await user.click(screen.getByRole('tab', { name: 'Movilizador - Social' }));
    expect(within(screen.getByRole('tabpanel')).getByRole('heading', { level: 2 })).toHaveTextContent('Movilizador - Social');
    await user.click(screen.getByRole('button', { name: /Artístico - Imaginativo/ }));
    expect(screen.getByRole('tab', { name: 'Artístico - Imaginativo' })).toHaveAttribute('aria-selected', 'true');
  });

  it('las pestañas se recorren con las flechas del teclado', async () => {
    seed({ answers: SAMPLE_ANSWERS });
    const { user } = await renderApp('/resultado');
    screen.getByRole('tab', { name: 'Realizador - Comerciante' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Artístico - Imaginativo' })).toHaveAttribute('aria-selected', 'true');
  });
});
