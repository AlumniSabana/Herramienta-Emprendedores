import { describe, expect, it } from 'vitest';
import { testContent, profiles, sources, faculties, landing, PROFILE_IDS } from '../src/index';

describe('contenido', () => {
  it('9 bloques de 5 ítems con ids únicos y perfil por posición', () => {
    expect(testContent.blocks).toHaveLength(9);
    const ids = new Set<string>();
    testContent.blocks.forEach((b, i) => {
      expect(b.number).toBe(i + 1);
      expect(b.items).toHaveLength(5);
      expect(b.scaleLabels).toHaveLength(4);
      b.items.forEach((it, j) => {
        expect(it.id).toBe(`${b.number}.${j + 1}`);
        expect(it.position).toBe(j + 1);
        expect(it.profileId).toBe(PROFILE_IDS[j]);
        expect(it.text.length).toBeGreaterThan(0);
        ids.add(it.id);
      });
    });
    expect(ids.size).toBe(45);
  });

  it('el bloque 1 usa una escala distinta de los bloques 2 a 9', () => {
    expect(testContent.blocks[0]!.scaleLabels[0]).toBe('No es muy cierto de mí');
    expect(testContent.blocks[1]!.scaleLabels[0]).toBe('Nunca');
    for (const b of testContent.blocks.slice(1)) expect(b.scaleLabels).toEqual(testContent.blocks[1]!.scaleLabels);
  });

  it('5 perfiles con las siete secciones completas', () => {
    expect(profiles.map((p) => p.id)).toEqual([...PROFILE_IDS]);
    for (const p of profiles) {
      for (const f of [
        'name',
        'centralDesire',
        'centralFear',
        'centralPriority',
        'description',
        'shortDescription',
        'strengths',
        'improvementAreas',
      ] as const)
        expect(p[f].trim(), `${p.id}.${f}`).not.toBe('');
      expect(p.strongCompetencies.length).toBeGreaterThan(0);
      expect(p.competenciesToDevelop.length).toBeGreaterThan(0);
      expect(p.practicalAdvice.steps.length).toBeGreaterThan(0);
      expect(p.complementaryProfiles.length).toBeGreaterThan(0);
      for (const c of p.complementaryProfiles) {
        expect(PROFILE_IDS).toContain(c);
        expect(c).not.toBe(p.id);
      }
    }
  });

  it('4 referencias, versión y autoría', () => {
    expect(sources.references).toHaveLength(4);
    expect(sources.version).toContain('2019');
    expect(sources.authorship).toContain('CEIS');
  });

  it('10 facultades con "Otra / no está en la lista" al final y programas únicos', () => {
    expect(faculties).toHaveLength(10);
    expect(faculties.at(-1)!.name).toBe('Otra / no está en la lista');
    expect(faculties.at(-1)!.programs.map((p) => p.name)).toEqual([
      'Otro programa',
      'Posgrado',
      'Egresado de un programa que ya no se ofrece',
    ]);
    for (const f of faculties) expect(f.programs.length, f.name).toBeGreaterThan(0);
    const real = faculties.slice(0, -1).flatMap((f) => f.programs);
    expect(real).toHaveLength(29);
    const ids = [...faculties.map((f) => f.id), ...faculties.flatMap((f) => f.programs.map((p) => p.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('landing: 4 viñetas, 3 pasos y ningún texto vacío', () => {
    expect(landing.tool.bullets).toHaveLength(4);
    expect(landing.steps).toHaveLength(3);
    const texts = JSON.stringify(landing).match(/"[^"]*"/g)!.map((x) => x.slice(1, -1).trim());
    expect(texts.every((x) => x.length > 0)).toBe(true);
    expect(landing.privacy.text).toMatch(/respuestas/);
  });
});
