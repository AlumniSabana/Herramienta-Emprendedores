import type { AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe aún tipa el espacio `Vi`; aquí se amplía el módulo `vitest` actual.
declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {
    _axe?: T;
  }
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
