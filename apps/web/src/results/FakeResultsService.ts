import type { StoredResult } from '@emprendedor/core';
import type { ResultsService } from './ResultsService';

/** Historial en memoria por persona; `currentUserId` dice quién tiene la sesión. */
export class FakeResultsService implements ResultsService {
  private readonly byUser = new Map<string, StoredResult[]>();

  constructor(private readonly currentUserId: () => string | undefined = () => undefined) {}

  add(userId: string, result: StoredResult) {
    this.byUser.set(userId, [...(this.byUser.get(userId) ?? []), result]);
  }

  all(userId: string): StoredResult[] {
    return this.byUser.get(userId) ?? [];
  }

  async getLatest(): Promise<StoredResult | null> {
    const id = this.currentUserId();
    const list = id ? this.all(id) : [];
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }
}
