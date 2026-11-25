import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { profileById, type StoredResult } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { buttonClass, Button, Card, Eyebrow } from '../components/ui';
import { useResults } from '../results/ResultsService';
import { useDiagnostic } from '../state/DiagnosticContext';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });

const names = (ids: StoredResult['dominant']) => ids.map((id) => profileById(id)!.name).join(', ');

export function DiagnosticHomePage() {
  const { profile, session } = useAuth();
  const results = useResults();
  const { setResult } = useDiagnostic();
  const navigate = useNavigate();
  const [latest, setLatest] = useState<StoredResult | null | undefined>(undefined); // undefined = cargando
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    results
      .getLatest()
      .then((r) => active && setLatest(r))
      .catch(() => active && (setFailed(true), setLatest(null)));
    return () => {
      active = false;
    };
  }, [results, session?.userId]);

  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Eyebrow>DIAGNÓSTICO DE PERFIL EMPRENDEDOR</Eyebrow>
        <h1 className="mt-2 text-4xl sm:text-5xl">Tu diagnóstico</h1>
        <p className="mt-2 text-lg text-muted">{firstName ? `Hola, ${firstName}.` : 'Hola.'}</p>
      </div>

      {latest === undefined && (
        <p role="status" className="text-muted">
          Buscando tu último resultado…
        </p>
      )}

      {failed && (
        <p role="status" className="rounded-lg border border-line bg-navy-soft p-3 text-sm">
          No pudimos consultar tus resultados guardados. Puedes hacer el test de todos modos.
        </p>
      )}

      {latest === null && (
        <Card>
          <h2 className="display text-2xl">Aún no has hecho el diagnóstico</h2>
          <p className="mt-2 text-muted">
            Son 9 bloques de 5 afirmaciones y toma unos 10 minutos. Al terminar verás tu radar de cinco perfiles, lo que ya
            tienes desarrollado y lo que puedes potenciar. Tu resultado queda guardado en tu cuenta.
          </p>
          <Link to="/test/1" state={{ restart: true }} className={buttonClass('primary', 'mt-5 h-12 px-7 text-base')}>
            Empezar el test
          </Link>
        </Card>
      )}

      {latest && (
        <Card>
          <Eyebrow>TU ÚLTIMO RESULTADO</Eyebrow>
          <p className="mt-2 text-sm text-muted">{formatDate(latest.createdAt)}</p>
          <h2 className="display mt-2 text-3xl">{names(latest.dominant)}</h2>
          <p className="mt-1 text-muted">
            {latest.dominant.length > 1 ? 'Perfiles dominantes' : 'Perfil dominante'}
            {latest.secondary.length > 0 && <> · Secundario: {names(latest.secondary)}</>}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setResult(latest);
                navigate('/resultado');
              }}
            >
              Ver mi resultado
            </Button>
            <Button variant="secondary" onClick={() => navigate('/test/1', { state: { restart: true } })}>
              Rehacer el test
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted">Tu resultado anterior se conserva en tu cuenta.</p>
        </Card>
      )}
    </div>
  );
}
