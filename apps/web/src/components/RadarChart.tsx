import { useState, type KeyboardEvent } from 'react';
import { PROFILE_IDS, profileById, type ProfileId } from '@emprendedor/core';
import { ProfileTooltipCard } from './ProfileTooltipCard';

const W = 480;
const H = 400;
const CX = 240;
const CY = 200;
const R = 115;
const MIN = 9;
const MAX = 36;
const RINGS = [9, 18, 27, 36];

const angle = (i: number) => ((-90 + i * 72) * Math.PI) / 180;
const point = (i: number, score: number): [number, number] => {
  const r = ((score - MIN) / (MAX - MIN)) * R;
  return [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))];
};
const polygon = (scoreAt: (i: number) => number) =>
  PROFILE_IDS.map((_, i) => point(i, scoreAt(i)).map((n) => n.toFixed(1)).join(',')).join(' ');

interface Props {
  scores: Record<ProfileId, number>;
  selected?: ProfileId;
  onSelect?: (id: ProfileId) => void;
  /** id de la tabla con los mismos datos (alternativa en texto). */
  describedBy?: string;
}

export function RadarChart({ scores, selected, onSelect, describedBy }: Props) {
  const [active, setActive] = useState<ProfileId | null>(null);

  const choose = (id: ProfileId) => {
    setActive(id);
    onSelect?.(id);
  };
  const onKey = (e: KeyboardEvent, id: ProfileId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(id);
    }
  };
  const anchor = (id: ProfileId) => {
    const i = PROFILE_IDS.indexOf(id);
    const [x, y] = point(i, scores[id]);
    return { x: (x / W) * 100, y: (y / H) * 100 };
  };

  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      onKeyDown={(e) => e.key === 'Escape' && setActive(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label="Radar de perfil emprendedor, puntajes de 9 a 36"
        aria-describedby={describedBy}
        className="h-auto w-full"
      >
        {RINGS.slice(1).map((ring) => (
          <polygon key={ring} points={polygon(() => ring)} fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
        ))}
        {PROFILE_IDS.map((_, i) => {
          const [x, y] = point(i, MAX);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-line)" strokeWidth="1.5" />;
        })}
        {RINGS.map((ring) => (
          <text key={ring} x={CX + 5} y={CY - ((ring - MIN) / (MAX - MIN)) * R - 3} fontSize="14" fill="var(--color-muted)" aria-hidden="true">
            {ring}
          </text>
        ))}

        <polygon
          points={polygon((i) => scores[PROFILE_IDS[i]!])}
          fill="rgba(0, 24, 94, 0.18)"
          stroke="var(--color-navy)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {PROFILE_IDS.map((id, i) => {
          const name = profileById(id)!.name;
          const [part1, part2] = name.split(' - ');
          const cos = Math.cos(angle(i));
          const sin = Math.sin(angle(i));
          const [lx, ly] = [CX + (R + 20) * cos, CY + (R + 20) * sin];
          const anchorX = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          // La etiqueta superior sube para no tapar el número del anillo de 36.
          return (
            <text key={id} x={lx} y={ly - 4 + (sin < -0.9 ? -18 : 0)} textAnchor={anchorX} fontSize="16" fontWeight="700" fill="var(--color-navy)" aria-hidden="true">
              <tspan x={lx}>{part1} -</tspan>
              <tspan x={lx} dy="18">{part2}</tspan>
            </text>
          );
        })}

        {PROFILE_IDS.map((id, i) => {
          const [x, y] = point(i, scores[id]);
          const name = profileById(id)!.name;
          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={`${name}: ${scores[id]} de 36`}
              aria-pressed={onSelect ? selected === id : undefined}
              onMouseEnter={() => setActive(id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(id)}
              onBlur={() => setActive(null)}
              onClick={() => choose(id)}
              onKeyDown={(e) => onKey(e, id)}
              className="cursor-pointer outline-none [&:focus-visible_.ring]:stroke-[#2f6bff] [&:focus-visible_.ring]:stroke-[4]"
            >
              <circle cx={x} cy={y} r="20" fill="transparent" className="ring" stroke="transparent" />
              <circle cx={x} cy={y} r={selected === id ? 9 : 7} fill={selected === id ? 'var(--color-navy)' : '#fff'} stroke="var(--color-navy)" strokeWidth="3" />
            </g>
          );
        })}
      </svg>

      {active && <ProfileTooltipCard profileId={active} score={scores[active]} anchor={anchor(active)} />}
    </div>
  );
}
