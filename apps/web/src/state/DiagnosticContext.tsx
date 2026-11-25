import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ALL_ITEM_IDS, testContent, type Answers, type ScoreResult } from '@emprendedor/core';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'unauthorized';

interface State {
  answers: Answers;
  result: ScoreResult | null;
  saveStatus: SaveStatus;
}

interface DiagnosticValue extends State {
  setAnswer: (itemId: string, value: number) => void;
  setResult: (result: ScoreResult) => void;
  setSaveStatus: (status: SaveStatus) => void;
  /** Repetir el test: borra respuestas y resultado en memoria (los resultados guardados se conservan). */
  restartTest: () => void;
  /** Al cerrar sesión: no debe quedar nada de la persona en el navegador. */
  clearAll: () => void;
}

const KEY = 'diagnostico-emprendedor-v2';
const EMPTY: State = { answers: {}, result: null, saveStatus: 'idle' };

// sessionStorage: sobrevive a una recarga y a una sesión vencida a mitad del test, y se borra al cerrar la pestaña.
function load(): State {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

const Ctx = createContext<DiagnosticValue | null>(null);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* sin almacenamiento: el test sigue funcionando en memoria */
    }
  }, [state]);

  const setAnswer = useCallback(
    (id: string, value: number) => setState((s) => ({ ...s, answers: { ...s.answers, [id]: value }, result: null })),
    [],
  );
  const setResult = useCallback((result: ScoreResult) => setState((s) => ({ ...s, result })), []);
  const setSaveStatus = useCallback((saveStatus: SaveStatus) => setState((s) => ({ ...s, saveStatus })), []);
  const restartTest = useCallback(() => setState(EMPTY), []);
  const clearAll = useCallback(() => setState(EMPTY), []);

  const value = useMemo(
    () => ({ ...state, setAnswer, setResult, setSaveStatus, restartTest, clearAll }),
    [state, setAnswer, setResult, setSaveStatus, restartTest, clearAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDiagnostic(): DiagnosticValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDiagnostic debe usarse dentro de DiagnosticProvider');
  return v;
}

/** Primer bloque (1-9) con algún ítem sin responder, o null si están los 45. */
export function firstIncompleteBlock(answers: Answers): number | null {
  const block = testContent.blocks.find((b) => b.items.some((i) => answers[i.id] === undefined));
  return block ? block.number : null;
}

export const isComplete = (answers: Answers) => ALL_ITEM_IDS.every((id) => answers[id] !== undefined);
