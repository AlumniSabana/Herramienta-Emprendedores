import type { CSSProperties } from 'react';
import { profileById, type ProfileId } from '@emprendedor/core';

interface Props {
  profileId: ProfileId;
  score: number;
  /** Posición del punto dentro del radar, en porcentaje (0-100). */
  anchor: { x: number; y: number };
}

export function ProfileTooltipCard({ profileId, score, anchor }: Props) {
  const p = profileById(profileId)!;
  const above = anchor.y > 50;
  // El ancho de la tarjeta es 16rem: se limita el centro para que nunca salga del radar.
  const style: CSSProperties = {
    left: `clamp(8rem, ${anchor.x}%, calc(100% - 8rem))`,
    ...(above ? { bottom: `${100 - anchor.y + 4}%` } : { top: `${anchor.y + 4}%` }),
    transform: 'translateX(-50%)',
  };
  return (
    <div
      role="status"
      style={style}
      className="pointer-events-none absolute z-10 w-64 rounded-lg border border-navy bg-white p-3 text-sm shadow-lg"
    >
      <p className="flex items-baseline justify-between gap-2">
        <strong className="text-base text-navy">{p.name}</strong>
        <span className="font-bold">{score}/36</span>
      </p>
      <dl className="mt-1 space-y-0.5">
        <div>
          <dt className="inline font-semibold">Deseo central: </dt>
          <dd className="inline">{p.centralDesire}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Miedo central: </dt>
          <dd className="inline">{p.centralFear}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Prioridad central: </dt>
          <dd className="inline">{p.centralPriority}</dd>
        </div>
      </dl>
      <p className="mt-1 text-muted">{p.shortDescription}</p>
    </div>
  );
}
