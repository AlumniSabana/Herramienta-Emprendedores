import { testContent } from './content';
import { PROFILE_IDS, type Answers, type ProfileId, type ScoreResult } from './types';

const PROFILE_OF_ITEM = new Map(testContent.blocks.flatMap((b) => b.items.map((i) => [i.id, i.profileId] as const)));

/**
 * Puntaje por perfil = suma de sus 9 ítems (9 a 36). Dominantes: todos los de mayor puntaje.
 * Secundarios: todos los del siguiente puntaje distinto (vacío si no existe).
 * Asume respuestas ya validadas (45 claves, enteros 1-4).
 */
export function scoreAnswers(answers: Answers): ScoreResult {
  const scores = Object.fromEntries(PROFILE_IDS.map((p) => [p, 0])) as Record<ProfileId, number>;
  for (const [id, value] of Object.entries(answers)) {
    const profile = PROFILE_OF_ITEM.get(id);
    if (profile) scores[profile] += value;
  }
  const distinct = [...new Set(Object.values(scores))].sort((a, b) => b - a);
  const withScore = (s: number | undefined) => PROFILE_IDS.filter((p) => s !== undefined && scores[p] === s);
  return { scores, dominant: withScore(distinct[0]), secondary: withScore(distinct[1]) };
}
