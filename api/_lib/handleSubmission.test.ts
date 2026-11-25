import { beforeEach, describe, expect, it } from 'vitest';
import sample from '../../packages/core/tests/fixtures/excel-sample.json';
import { handleSubmission } from './handleSubmission';
import { FakeTokenVerifier } from './auth/FakeTokenVerifier';
import { InMemorySubmissionRepository } from './repositories/InMemorySubmissionRepository';
import type { SubmissionRepository } from './repositories/SubmissionRepository';

const verifier = new FakeTokenVerifier({ 'token-ana': 'user-ana' });
const body = () => ({ answers: { ...sample.answers } });

let repo: InMemorySubmissionRepository;
const call = (b: unknown, accessToken: string | undefined = 'token-ana', r: SubmissionRepository = repo) =>
  handleSubmission(
    { body: b, accessToken },
    { verifier, repositoryFor: () => r, newId: () => 'id-1', now: () => new Date('2026-11-25T10:00:00Z') },
  );

beforeEach(() => {
  repo = new InMemorySubmissionRepository();
});

describe('handleSubmission v2', () => {
  it('201: puntúa con la lógica compartida y guarda con el userId verificado', async () => {
    const res = await call(body());
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'id-1',
      scores: sample.expectedScores,
      dominant: ['realizador-comerciante'],
      secondary: ['investigativo-creador'],
      createdAt: '2026-11-25T10:00:00.000Z',
    });
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0]).toMatchObject({ userId: 'user-ana', createdAt: '2026-11-25T10:00:00.000Z' });
    expect(repo.items[0]!.answers).toEqual(sample.answers);
  });

  it('ignora correo, programa, puntajes y cualquier campo extra del cuerpo', async () => {
    const res = await call({
      ...body(),
      email: 'otro@unisabana.edu.co',
      userId: 'user-otro',
      programId: 'medicina',
      scores: { 'realista-gerencial': 36 },
      dominant: ['realista-gerencial'],
    });
    expect(res.status).toBe(201);
    expect((res.body as { dominant: string[] }).dominant).toEqual(['realizador-comerciante']);
    expect(repo.items[0]!.userId).toBe('user-ana');
    expect(repo.items[0]).not.toHaveProperty('email');
  });

  it('401: sin token o con token inválido; no guarda nada', async () => {
    for (const token of [undefined, '', 'token-falso']) {
      const res = await handleSubmission(
        { body: body(), accessToken: token },
        { verifier, repositoryFor: () => repo },
      );
      expect(res.status, String(token)).toBe(401);
      expect((res.body as { error: string }).error).toMatch(/sesión/i);
    }
    expect(repo.items).toHaveLength(0);
  });

  const bad: [string, (b: ReturnType<typeof body>) => unknown][] = [
    ['respuesta faltante', (b) => ({ answers: Object.fromEntries(Object.entries(b.answers).slice(1)) })],
    ['respuesta sobrante', (b) => ({ answers: { ...b.answers, '10.1': 2 } })],
    ['respuesta fuera de rango', (b) => ({ answers: { ...b.answers, '1.1': 5 } })],
    ['respuesta no entera', (b) => ({ answers: { ...b.answers, '1.1': 2.5 } })],
    ['sin answers', () => ({})],
  ];
  it.each(bad)('400: %s', async (_name, mutate) => {
    const res = await call(mutate(body()));
    expect(res.status).toBe(400);
    expect((res.body as { fields: Record<string, string> }).fields).toHaveProperty('answers');
    expect((res.body as { fields: Record<string, string> }).fields.answers).not.toMatch(/Invalid input|expected/);
    expect(repo.items).toHaveLength(0);
  });

  it('400: cuerpo que no es un objeto', async () => {
    expect((await call('x')).status).toBe(400);
    expect((await call(null)).status).toBe(400);
  });

  it('500: si el repositorio falla', async () => {
    const failing: SubmissionRepository = { save: async () => Promise.reject(new Error('boom')) };
    const res = await call(body(), 'token-ana', failing);
    expect(res.status).toBe(500);
    expect((res.body as { error: string }).error).toMatch(/no pudimos/i);
  });

  it('pide el repositorio con el token de la persona', async () => {
    let used: string | undefined;
    await handleSubmission(
      { body: body(), accessToken: 'token-ana' },
      {
        verifier,
        repositoryFor: (t) => {
          used = t;
          return repo;
        },
      },
    );
    expect(used).toBe('token-ana');
  });
});
