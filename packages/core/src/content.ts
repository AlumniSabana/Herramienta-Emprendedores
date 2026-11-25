import testJson from '../content/test.json';
import profilesJson from '../content/profiles.json';
import sourcesJson from '../content/sources.json';
import facultiesJson from '../content/faculties.json';
import landingJson from '../content/landing.json';
import { facultiesSchema, landingSchema, profilesSchema, sourcesSchema, testContentSchema } from './schemas';
import type { Faculty, LandingContent, Profile, Source, TestContent } from './types';

// Se valida al cargar: un JSON mal editado falla al arrancar, no en medio de un test.
export const testContent = testContentSchema.parse(testJson) as TestContent;
export const profiles = profilesSchema.parse(profilesJson) as Profile[];
export const sources = sourcesSchema.parse(sourcesJson) as Source;
export const faculties = facultiesSchema.parse(facultiesJson) as Faculty[];
export const landing = landingSchema.parse(landingJson) as LandingContent;

export const profileById = (id: string): Profile | undefined => profiles.find((p) => p.id === id);
