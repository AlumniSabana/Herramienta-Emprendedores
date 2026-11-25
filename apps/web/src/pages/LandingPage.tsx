import { Link } from 'react-router';
import { landing } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { buttonClass, Card, Eyebrow } from '../components/ui';

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-1 shrink-0 text-brand-600">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function LandingPage() {
  const { session } = useAuth();
  const { hero, tool, steps, privacy } = landing;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-navy via-navy to-[#0b3fa0] px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-xs font-bold tracking-[0.16em] text-[#b9c7ea] uppercase">{hero.eyebrow}</p>
        <h1 className="mt-4 max-w-2xl text-4xl !text-white sm:text-5xl">{hero.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">{hero.lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (
            <Link to="/diagnostico" className={buttonClass('onDark', 'h-12 px-7 text-base')}>
              Ir al diagnóstico
            </Link>
          ) : (
            <>
              <Link to="/registro" className={buttonClass('onDark', 'h-12 px-7 text-base')}>
                {hero.primaryCta}
              </Link>
              <Link to="/ingresar" className={buttonClass('outlineOnDark', 'h-12 px-7 text-base')}>
                {hero.secondaryCta}
              </Link>
            </>
          )}
        </div>
      </section>

      <Card>
        <section aria-labelledby="tool-title">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy text-white" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M12 3l8 6-3 11H7L4 9z" />
              </svg>
            </span>
            <Eyebrow>{tool.eyebrow}</Eyebrow>
          </div>
          <h2 id="tool-title" className="display mt-4 text-3xl">
            {tool.title}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{tool.description}</p>
          <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {tool.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm">
                <Check />
                {b}
              </li>
            ))}
          </ul>
          <Link to="/diagnostico" className={buttonClass('primary', 'mt-6 h-12 px-7 text-base')}>
            {tool.cta} →
          </Link>
        </section>
      </Card>

      <section aria-labelledby="steps-title">
        <Eyebrow>CÓMO FUNCIONA</Eyebrow>
        <h2 id="steps-title" className="sr-only">
          Cómo funciona
        </h2>
        <p className="display mt-2 text-3xl" aria-hidden="true">
          Tres pasos, una sola cuenta
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line bg-card p-5">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-navy font-bold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-bold text-navy">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Card className="bg-navy-soft/50">
        <h2 className="display text-2xl">{privacy.title}</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-muted">{privacy.text}</p>
      </Card>
    </div>
  );
}
