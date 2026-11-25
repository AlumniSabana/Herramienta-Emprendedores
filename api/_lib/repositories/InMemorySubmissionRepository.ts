import type { Submission } from '../../../packages/core/src';
import type { SubmissionRepository } from './SubmissionRepository';

export class InMemorySubmissionRepository implements SubmissionRepository {
  readonly items: Submission[] = [];

  async save(submission: Submission): Promise<void> {
    this.items.push(submission);
  }
}
