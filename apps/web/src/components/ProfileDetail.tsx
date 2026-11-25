import { profileById, type CompetencyGroup, type Profile } from '@emprendedor/core';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-extrabold text-navy">{title}</h3>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

function Groups({ groups }: { groups: CompetencyGroup[] }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.title}>
          <h4 className="font-bold">{g.title}</h4>
          <ul className="list-disc pl-5">
            {g.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function ProfileDetail({ profile }: { profile: Profile }) {
  return (
    <div>
      <h2 className="display text-3xl">{profile.name}</h2>
      <p className="mt-1 text-sm font-semibold text-muted">
        Deseo central: {profile.centralDesire} · Miedo central: {profile.centralFear} · Prioridad central:{' '}
        {profile.centralPriority}
      </p>

      <Section title="Descripción">
        {profile.description.split('\n\n').map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Section>
      <Section title="Fortalezas">
        <p>{profile.strengths}</p>
      </Section>
      <Section title="Oportunidades de mejora">
        <p>{profile.improvementAreas}</p>
      </Section>
      <Section title="Competencias fuertes (lo que ya tienes desarrollado)">
        <Groups groups={profile.strongCompetencies} />
      </Section>
      <Section title="Competencias para potenciar">
        <Groups groups={profile.competenciesToDevelop} />
      </Section>
      <Section title="Perfiles emprendedores que lo complementan">
        <ul className="list-disc pl-5">
          {profile.complementaryProfiles.map((id) => (
            <li key={id}>{profileById(id)!.name}</li>
          ))}
        </ul>
      </Section>
      <Section title="Consejos prácticos / plan de acción">
        {profile.practicalAdvice.intro && <p>{profile.practicalAdvice.intro}</p>}
        <ol className="list-decimal pl-5">
          {profile.practicalAdvice.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
