export const PROFILE_IDS = [
  'realista-gerencial',
  'realizador-comerciante',
  'artistico-imaginativo',
  'movilizador-social',
  'investigativo-creador',
] as const;

export type ProfileId = (typeof PROFILE_IDS)[number];

/** Los 45 ids de ítem: "1.1" … "9.5". */
export const ALL_ITEM_IDS: readonly string[] = Array.from({ length: 9 }, (_, b) =>
  Array.from({ length: 5 }, (_, n) => `${b + 1}.${n + 1}`),
).flat();

/** Versión del acuerdo de tratamiento de datos que se acepta al crear la cuenta (Ley 1581 de 2012). */
export const AGREEMENT_VERSION = '1.1';

export interface Item {
  /** "x.n": bloque x (1-9), posición n (1-5). */
  id: string;
  /** Entero 1-5. */
  position: number;
  text: string;
  profileId: ProfileId;
}

export interface Block {
  /** Entero 1-9. */
  number: number;
  prompt: string;
  /** Exactamente 4 textos: etiquetas de los valores 1 a 4. */
  scaleLabels: [string, string, string, string];
  /** Exactamente 5 ítems. */
  items: Item[];
}

export interface TestContent {
  intro: string;
  blocks: Block[];
}

export interface CompetencyGroup {
  title: string;
  items: string[];
}

export interface Profile {
  id: ProfileId;
  name: string;
  centralDesire: string;
  centralFear: string;
  centralPriority: string;
  description: string;
  shortDescription: string;
  strengths: string;
  improvementAreas: string;
  strongCompetencies: CompetencyGroup[];
  competenciesToDevelop: CompetencyGroup[];
  complementaryProfiles: ProfileId[];
  practicalAdvice: { intro: string; steps: string[] };
}

export interface Source {
  authorship: string;
  version: string;
  /** Exactamente 4 referencias. */
  references: string[];
}

export interface Program {
  id: string;
  name: string;
}

/** Claves "1.1" a "9.5"; valores enteros de 1 a 4. */
export type Answers = Record<string, number>;

export interface ScoreResult {
  /** Entero 9-36 por perfil. */
  scores: Record<ProfileId, number>;
  /** 1 o más (empate). */
  dominant: ProfileId[];
  /** Vacío si no existe un puntaje distinto. */
  secondary: ProfileId[];
}

export interface Faculty {
  id: string;
  name: string;
  programs: Program[];
}

export interface LandingContent {
  hero: { eyebrow: string; title: string; lead: string; primaryCta: string; secondaryCta: string };
  tool: { eyebrow: string; title: string; description: string; bullets: string[]; cta: string };
  steps: { title: string; text: string }[];
  privacy: { title: string; text: string };
  footer: { copyright: string; policyLabel: string };
}

/** Datos del formulario de registro; facultad y programa van por NOMBRE (así los guarda la cuenta). */
export interface RegistrationInput {
  name: string;
  faculty: string;
  program: string;
  email: string;
  password: string;
  consent: boolean;
}

export interface RecoveryInput {
  email: string;
  code: string;
  newPassword: string;
}

/** Perfil de la cuenta (tabla perfiles, o user_metadata como respaldo). No confundir con `Profile` (perfil emprendedor). */
export interface AccountProfile {
  id: string;
  email: string;
  name: string;
  faculty: string;
  program: string;
}

/** Resultado guardado de una persona. */
export interface StoredResult extends ScoreResult {
  id: string;
  createdAt: string;
}

export interface Submission extends ScoreResult {
  id: string;
  userId: string;
  answers: Answers;
  createdAt: string;
}
