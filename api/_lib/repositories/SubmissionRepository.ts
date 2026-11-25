import type { Submission } from '../../../packages/core/src';

/** Punto único de persistencia: una BD futura solo añade otra implementación. */
export interface SubmissionRepository {
  save(submission: Submission): Promise<void>;
}
