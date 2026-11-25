import { z } from 'zod';
import { ALL_ITEM_IDS, PROFILE_IDS } from './types';

const text = z.string().trim().min(1);
const profileId = z.enum(PROFILE_IDS);

const item = z.object({
  id: z.string().regex(/^[1-9]\.[1-5]$/),
  position: z.number().int().min(1).max(5),
  text,
  profileId,
});

const block = z.object({
  number: z.number().int().min(1).max(9),
  prompt: text,
  scaleLabels: z.tuple([text, text, text, text]),
  items: z.array(item).length(5),
});

const competencyGroup = z.object({ title: text, items: z.array(text).min(1) });

const profile = z.object({
  id: profileId,
  name: text,
  centralDesire: text,
  centralFear: text,
  centralPriority: text,
  description: text,
  shortDescription: text,
  strengths: text,
  improvementAreas: text,
  strongCompetencies: z.array(competencyGroup).min(1),
  competenciesToDevelop: z.array(competencyGroup).min(1),
  complementaryProfiles: z.array(profileId).min(1),
  practicalAdvice: z.object({ intro: z.string(), steps: z.array(text).min(1) }),
});

export const testContentSchema = z.object({ intro: text, blocks: z.array(block).length(9) });
export const profilesSchema = z.array(profile).length(5);
export const sourcesSchema = z.object({ authorship: text, version: text, references: z.array(text).length(4) });

const program = z.object({ id: text, name: text });
export const facultiesSchema = z
  .array(z.object({ id: text, name: text, programs: z.array(program).min(1) }))
  .refine((f) => f.at(-1)?.id === 'otra', { message: '"Otra / no está en la lista" debe ser la última facultad.' });

export const landingSchema = z.object({
  hero: z.object({ eyebrow: text, title: text, lead: text, primaryCta: text, secondaryCta: text }),
  tool: z.object({ eyebrow: text, title: text, description: text, bullets: z.array(text).length(4), cta: text }),
  steps: z.array(z.object({ title: text, text })).length(3),
  privacy: z.object({ title: text, text }),
  footer: z.object({ copyright: text, policyLabel: text }),
});

const ANSWER_MSG = 'Cada respuesta debe ser un entero de 1 a 4.';
const ALL_MSG = 'Se requieren exactamente las 45 respuestas del test.';

/** Exactamente las 45 claves "x.n" con enteros de 1 a 4; cualquier otra cosa da un mensaje en español. */
export const answersSchema = z
  .preprocess(
    (v) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {}),
    z
      .record(z.string(), z.number({ error: ANSWER_MSG }).int(ANSWER_MSG).min(1, ANSWER_MSG).max(4, ANSWER_MSG))
      .refine(
        (a) => {
          const keys = Object.keys(a);
          return keys.length === ALL_ITEM_IDS.length && ALL_ITEM_IDS.every((id) => id in a);
        },
        { message: ALL_MSG },
      ),
  );

/** Cuerpo de POST /api/submissions: solo las respuestas; cualquier otro campo se descarta. */
export const submissionRequestSchema = z.object({ answers: answersSchema });

export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;
