import { createContext, useContext } from 'react';
import type { StoredResult } from '@emprendedor/core';

export interface ResultsService {
  /** Último resultado guardado de la persona con sesión, o null si nunca hizo el test. */
  getLatest(): Promise<StoredResult | null>;
}

export const ResultsContext = createContext<ResultsService | null>(null);

export function useResults(): ResultsService {
  const v = useContext(ResultsContext);
  if (!v) throw new Error('useResults debe usarse dentro de ResultsContext.Provider');
  return v;
}
