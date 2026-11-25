import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import sample from '../../../packages/core/tests/fixtures/excel-sample.json';
import { RadarChart } from '../src/components/RadarChart';

const scores = sample.expectedScores;

describe('RadarChart', () => {
  it('tiene cinco puntos enfocables con nombre y puntaje', () => {
    render(<RadarChart scores={scores} />);
    const points = screen.getAllByRole('button');
    expect(points).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Realizador - Comerciante: 34 de 36' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Movilizador - Social: 25 de 36' })).toBeInTheDocument();
  });

  it('dibuja el eje radial de 9 a 36', () => {
    render(<RadarChart scores={scores} />);
    for (const ring of ['9', '18', '27', '36']) expect(screen.getByText(ring)).toBeInTheDocument();
  });

  it('muestra la tarjeta con el ratón', async () => {
    const user = userEvent.setup();
    render(<RadarChart scores={scores} />);
    await user.hover(screen.getByRole('button', { name: /Realizador - Comerciante/ }));
    const card = screen.getByRole('status');
    expect(card).toHaveTextContent('Realizador - Comerciante');
    expect(card).toHaveTextContent('34/36');
    expect(card).toHaveTextContent('Capitalizar oportunidades');
    expect(card).toHaveTextContent('Perder dinero');
    expect(card).toHaveTextContent('Utilidades');
  });

  it('muestra la tarjeta con el teclado y Esc la cierra', async () => {
    const user = userEvent.setup();
    render(<RadarChart scores={scores} />);
    await user.tab();
    expect(screen.getByRole('status')).toHaveTextContent('Realista - Gerencial');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('el clic o Enter en un punto llama a onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RadarChart scores={scores} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Artístico - Imaginativo/ }));
    expect(onSelect).toHaveBeenLastCalledWith('artistico-imaginativo');
    screen.getByRole('button', { name: /Investigativo - Creador/ }).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('investigativo-creador');
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<RadarChart scores={scores} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
