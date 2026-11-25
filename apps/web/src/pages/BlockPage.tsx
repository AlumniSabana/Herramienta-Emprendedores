import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { scoreAnswers, testContent } from '@emprendedor/core';
import { submitDiagnostic } from '../api/submitDiagnostic';
import { useAuth } from '../auth/AuthContext';
import { LikertItem } from '../components/LikertItem';
import { Button, Card, ProgressBar } from '../components/ui';
import { useDiagnostic } from '../state/DiagnosticContext';

const TOTAL = testContent.blocks.length;

export function BlockPage() {
  const number = Number(useParams().bloque);
  const block = testContent.blocks[number - 1]!;
  const navigate = useNavigate();
  const { session } = useAuth();
  const { answers, setAnswer, setResult, setSaveStatus } = useDiagnostic();
  const [showErrors, setShowErrors] = useState(false);
  const form = useRef<HTMLDivElement>(null);

  useEffect(() => setShowErrors(false), [number]);

  const missing = block.items.filter((i) => answers[i.id] === undefined);
  const isLast = number === TOTAL;

  function next() {
    if (missing.length > 0) {
      setShowErrors(true);
      form.current?.querySelector<HTMLInputElement>('fieldset input')?.focus();
      return;
    }
    if (!isLast) {
      navigate(`/test/${number + 1}`);
      return;
    }
    // El resultado se calcula en el navegador con la misma función que usa la API; el guardado no lo bloquea.
    setResult(scoreAnswers(answers));
    setSaveStatus('saving');
    navigate('/resultado');
    void submitDiagnostic(session!.accessToken, answers).then((r) =>
      setSaveStatus(r.ok ? 'saved' : r.unauthorized ? 'unauthorized' : 'failed'),
    );
  }

  return (
    <Card>
      <ProgressBar value={number} max={TOTAL} label="Progreso del test" />
      <h1 className="mt-5 text-3xl sm:text-4xl">
        Bloque {number} de {TOTAL}
      </h1>
      <p className="mt-2 text-lg font-semibold">{block.prompt}</p>
      {number === 1 && <p className="mt-2 text-sm text-muted">{testContent.intro}</p>}

      <div ref={form} className="mt-5 space-y-4">
        {block.items.map((item) => (
          <LikertItem
            key={item.id}
            item={item}
            labels={block.scaleLabels}
            value={answers[item.id]}
            onChange={(v) => setAnswer(item.id, v)}
            showError={showErrors && answers[item.id] === undefined}
          />
        ))}
      </div>

      {showErrors && missing.length > 0 && (
        <p role="alert" className="mt-4 font-semibold text-error">
          Falta responder {missing.length} {missing.length === 1 ? 'afirmación' : 'afirmaciones'} para continuar.
        </p>
      )}

      <div className="mt-6 flex justify-between gap-3">
        {number > 1 ? (
          <Button variant="secondary" onClick={() => navigate(`/test/${number - 1}`)}>
            Anterior
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={next}>{isLast ? 'Finalizar' : 'Siguiente'}</Button>
      </div>
    </Card>
  );
}
