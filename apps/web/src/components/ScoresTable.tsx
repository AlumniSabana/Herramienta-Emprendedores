import { PROFILE_IDS, profileById, type ScoreResult } from '@emprendedor/core';

/** Alternativa en texto del radar: los mismos cinco puntajes. */
export function ScoresTable({ id, result }: { id: string; result: ScoreResult }) {
  return (
    <table id={id} className="w-full border-collapse text-left text-sm">
      <caption className="mb-2 text-left font-semibold text-muted">Puntajes por perfil (de 9 a 36)</caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className="py-2 pr-3">Perfil</th>
          <th scope="col" className="py-2 pr-3">Puntaje</th>
          <th scope="col" className="py-2">Posición</th>
        </tr>
      </thead>
      <tbody>
        {PROFILE_IDS.map((pid) => (
          <tr key={pid} className="border-b border-line last:border-0">
            <th scope="row" className="py-2 pr-3 font-semibold">{profileById(pid)!.name}</th>
            <td className="py-2 pr-3">{result.scores[pid]}/36</td>
            <td className="py-2">
              {result.dominant.includes(pid) ? 'Dominante' : result.secondary.includes(pid) ? 'Secundario' : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
