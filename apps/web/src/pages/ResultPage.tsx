import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { profileById, type ProfileId } from '@emprendedor/core';
import { submitDiagnostic } from '../api/submitDiagnostic';
import { useAuth } from '../auth/AuthContext';
import { ProfileDetail } from '../components/ProfileDetail';
import { ProfileTabs, panelId, tabId } from '../components/ProfileTabs';
import { RadarChart } from '../components/RadarChart';
import { ScoresTable } from '../components/ScoresTable';
import { SourcesSection } from '../components/SourcesSection';
import { Button, Card, buttonClass } from '../components/ui';
import { isComplete, useDiagnostic } from '../state/DiagnosticContext';

const names = (ids: ProfileId[]) => {
  const list = ids.map((id) => profileById(id)!.name);
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} y ${list.at(-1)}` : (list[0] ?? '');
};

export function ResultPage() {
  const { result, saveStatus, answers, setSaveStatus } = useDiagnostic();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  // Si se llega con un guardado pendiente por sesión vencida (tras ingresar de nuevo), se reintenta una vez.
  useEffect(() => {
    if (saveStatus !== 'unauthorized' || !session || !isComplete(answers)) return;
    setSaveStatus('saving');
    void submitDiagnostic(session.accessToken, answers).then((r) =>
      setSaveStatus(r.ok ? 'saved' : r.unauthorized ? 'unauthorized' : 'failed'),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar: evita reintentos en bucle
  }, []);

  const [selected, setSelected] = useState<ProfileId | null>(null);
  if (!result) return null;

  const current = selected ?? result.dominant[0]!;

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl sm:text-4xl">Tu resultado</h1>
        <p data-testid="dominant" className="mt-3 text-lg">
          {result.dominant.length > 1 ? 'Tus perfiles dominantes: ' : 'Tu perfil dominante: '}
          <strong className="text-navy">{names(result.dominant)}</strong>
        </p>
        {result.secondary.length > 0 && (
          <p data-testid="secondary" className="mt-1 text-muted">
            {result.secondary.length > 1 ? 'Perfiles secundarios: ' : 'Perfil secundario: '}
            <strong>{names(result.secondary)}</strong>
          </p>
        )}
        {saveStatus === 'failed' && (
          <p role="status" aria-label="Estado del guardado" className="mt-4 rounded-lg border border-line bg-navy-soft p-3 text-sm">
            No pudimos registrar tu diagnóstico en este momento. Tu resultado se muestra completo en esta pantalla.
          </p>
        )}
        {saveStatus === 'unauthorized' && (
          <div role="status" aria-label="Estado del guardado" className="mt-4 rounded-lg border border-line bg-navy-soft p-3 text-sm">
            <p>Tu sesión venció, por eso no pudimos guardar tu resultado. Ingresa de nuevo y lo guardamos; tus respuestas se conservan.</p>
            <Button
              className="mt-3"
              onClick={async () => {
                await signOut();
                navigate('/ingresar', { state: { from: { pathname: '/resultado' } } });
              }}
            >
              Ingresar de nuevo
            </Button>
          </div>
        )}
        <Link to="/diagnostico" className={buttonClass('secondary', 'mt-4')}>
          Volver a mi diagnóstico
        </Link>
      </Card>

      <Card>
        <h2 className="display text-2xl">Mapa de perfiles</h2>
        <p className="mt-1 text-sm text-muted">
          Pasa el cursor, toca o enfoca con el teclado un punto para ver el resumen; selecciónalo para abrir el detalle
          de ese perfil.
        </p>
        <div className="mt-4">
          <RadarChart scores={result.scores} selected={current} onSelect={setSelected} describedBy="scores-table" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <ScoresTable id="scores-table" result={result} />
        </div>
      </Card>

      <Card>
        <ProfileTabs selected={current} onSelect={setSelected} />
        <div role="tabpanel" id={panelId(current)} aria-labelledby={tabId(current)} className="mt-4">
          <ProfileDetail profile={profileById(current)!} />
        </div>
      </Card>

      <SourcesSection />

      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => {
            // BlockGuard limpia las respuestas al llegar (state.restart): así /resultado no ve un resultado vacío.
            navigate('/test/1', { state: { restart: true } });
          }}
        >
          Repetir el test
        </Button>
      </div>
    </div>
  );
}
