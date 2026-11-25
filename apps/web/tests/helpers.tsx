import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ALL_ITEM_IDS, scoreAnswers, type Answers } from '@emprendedor/core';
import sample from '../../../packages/core/tests/fixtures/excel-sample.json';
import { AuthProvider } from '../src/auth/AuthContext';
import { FakeAuthService, type FakeAccountSeed } from '../src/auth/FakeAuthService';
import { FakeResultsService } from '../src/results/FakeResultsService';
import { ResultsContext } from '../src/results/ResultsService';
import { AppRoutes } from '../src/routes';
import { DiagnosticProvider } from '../src/state/DiagnosticContext';

export const EMAIL = 'ana@unisabana.edu.co';
export const SAMPLE_ANSWERS = sample.answers as Answers;
export const uniformAnswers = (v: number): Answers => Object.fromEntries(ALL_ITEM_IDS.map((id) => [id, v]));

/** Precarga sessionStorage como si la persona ya hubiera avanzado en el test. */
export function seed(state: { answers?: Answers; saveStatus?: string } = {}) {
  const answers = state.answers ?? {};
  const complete = ALL_ITEM_IDS.every((id) => answers[id] !== undefined);
  window.sessionStorage.setItem(
    'diagnostico-emprendedor-v2',
    JSON.stringify({ answers, result: complete ? scoreAnswers(answers) : null, saveStatus: state.saveStatus ?? 'idle' }),
  );
}

interface Options {
  /** Sesión iniciada con esta cuenta (por defecto, `EMAIL`); `null` = sin sesión. */
  signedInAs?: string | null;
  accounts?: FakeAccountSeed[];
  auth?: FakeAuthService;
  results?: FakeResultsService;
  /** false = no esperar a que termine "Cargando…" (para probar ese estado). */
  wait?: boolean;
}

/** Renderiza la app y espera a que termine de restaurarse la sesión (si no, RequireAuth muestra "Cargando…"). */
export async function renderApp(path = '/', opts: Options = {}) {
  const user = userEvent.setup();
  const signedInAs = opts.signedInAs === undefined ? EMAIL : (opts.signedInAs ?? undefined);
  const auth = opts.auth ?? new FakeAuthService({ accounts: opts.accounts, signedInAs });
  const results = opts.results ?? new FakeResultsService(() => auth.userIdFor(signedInAs ?? ''));
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider service={auth}>
        <ResultsContext.Provider value={results}>
          <DiagnosticProvider>
            <AppRoutes />
          </DiagnosticProvider>
        </ResultsContext.Provider>
      </AuthProvider>
    </MemoryRouter>,
  );
  if (opts.wait !== false) await waitFor(() => expect(screen.queryByText('Cargando…')).not.toBeInTheDocument());
  return { user, auth, results, ...utils };
}

/** Responde todos los ítems visibles del bloque actual con el valor dado (1-4). */
export async function answerBlock(user: ReturnType<typeof userEvent.setup>, container: HTMLElement, value = 3) {
  for (const radio of container.querySelectorAll<HTMLInputElement>(`input[type="radio"][value="${value}"]`)) {
    await user.click(radio);
  }
}
