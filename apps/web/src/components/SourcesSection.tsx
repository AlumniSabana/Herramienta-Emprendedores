import { sources } from '@emprendedor/core';
import { Card } from './ui';

export function SourcesSection() {
  return (
    <Card>
      <section aria-labelledby="sources-title">
        <h2 id="sources-title" className="display text-2xl">
          Fuentes
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{sources.authorship}</p>
        <p className="mt-1 text-sm font-semibold">{sources.version}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {sources.references.map((r) => (
            <li key={r} className="whitespace-pre-line">
              {r}
            </li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
