import { describe, expect, it } from 'vitest';
import sample from './fixtures/excel-sample.json';
import { scoreAnswers, ALL_ITEM_IDS, PROFILE_IDS, type Answers, type ProfileId } from '../src/index';

const uniform = (v: number): Answers => Object.fromEntries(ALL_ITEM_IDS.map((id) => [id, v]));
/** Asigna a cada ítem el valor de su perfil (por posición x.n). */
const byProfile = (values: Record<ProfileId, number>): Answers => {
  const a: Answers = {};
  for (const id of ALL_ITEM_IDS) a[id] = values[PROFILE_IDS[Number(id.split('.')[1]) - 1]!];
  return a;
};

describe('scoreAnswers', () => {
  it('reproduce el ejemplo del Excel', () => {
    const r = scoreAnswers(sample.answers);
    expect(r.scores).toEqual(sample.expectedScores);
    expect(r.dominant).toEqual(['realizador-comerciante']);
    expect(r.secondary).toEqual(['investigativo-creador']);
  });

  it('todo 1 → 9 por perfil y todo 4 → 36, con los cinco empatados y sin secundario', () => {
    const lo = scoreAnswers(uniform(1));
    const hi = scoreAnswers(uniform(4));
    for (const id of PROFILE_IDS) {
      expect(lo.scores[id]).toBe(9);
      expect(hi.scores[id]).toBe(36);
    }
    expect(hi.dominant).toEqual([...PROFILE_IDS]);
    expect(hi.secondary).toEqual([]);
  });

  it('empate en el primer puesto: todos los empatados son dominantes y el siguiente puntaje es secundario', () => {
    const r = scoreAnswers(
      byProfile({
        'realista-gerencial': 4,
        'realizador-comerciante': 4,
        'artistico-imaginativo': 3,
        'movilizador-social': 2,
        'investigativo-creador': 1,
      }),
    );
    expect(r.dominant).toEqual(['realista-gerencial', 'realizador-comerciante']);
    expect(r.secondary).toEqual(['artistico-imaginativo']);
  });

  it('empate en segundo puesto: todos los empatados son secundarios', () => {
    const r = scoreAnswers(
      byProfile({
        'realista-gerencial': 4,
        'realizador-comerciante': 3,
        'artistico-imaginativo': 3,
        'movilizador-social': 1,
        'investigativo-creador': 1,
      }),
    );
    expect(r.dominant).toEqual(['realista-gerencial']);
    expect(r.secondary).toEqual(['realizador-comerciante', 'artistico-imaginativo']);
  });

  it('es determinista y conserva la suma (1.000 combinaciones con semilla fija)', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = 0; i < 1000; i++) {
      const a: Answers = Object.fromEntries(ALL_ITEM_IDS.map((id) => [id, 1 + Math.floor(rnd() * 4)]));
      const r = scoreAnswers(a);
      expect(scoreAnswers(a)).toEqual(r);
      const total = Object.values(a).reduce((s, v) => s + v, 0);
      expect(Object.values(r.scores).reduce((s, v) => s + v, 0)).toBe(total);
      for (const v of Object.values(r.scores)) {
        expect(v).toBeGreaterThanOrEqual(9);
        expect(v).toBeLessThanOrEqual(36);
      }
    }
  });
});
