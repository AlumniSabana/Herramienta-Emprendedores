import { useRef, useState, type FormEvent } from 'react';
import { MIN_PASSWORD_LENGTH } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { toAuthError } from '../auth/errors';
import { PasswordField } from '../components/Field';
import { Button, Card, Eyebrow } from '../components/ui';

export function AccountPage() {
  const { profile, session, changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setFormError(undefined);
    setDone(false);
    const next: Record<string, string> = {};
    if (!current) next.current = 'Escribe tu contraseña actual.';
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    busyRef.current = true;
    setBusy(true);
    try {
      await changePassword(current, password);
      setCurrent('');
      setPassword('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      const e2 = toAuthError(err);
      if (e2.code === 'wrong-current-password') setErrors({ current: e2.message });
      else setFormError(e2.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const rows: [string, string][] = [
    ['Nombre', profile?.name ?? ''],
    ['Facultad', profile?.faculty ?? ''],
    ['Programa', profile?.program ?? ''],
    ['Correo', profile?.email ?? session?.email ?? ''],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Eyebrow>CONFIGURACIÓN DE USUARIO</Eyebrow>
        <h1 className="mt-2 text-4xl sm:text-5xl">Mi cuenta</h1>
      </div>

      <Card>
        <section aria-labelledby="datos-title">
          <h2 id="datos-title" className="display text-2xl">
            Mis datos
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold tracking-wide text-muted uppercase">{label}</dt>
                <dd className="mt-0.5 break-words">{value || '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">Estos datos vienen de tu cuenta de Herramientas CDP y no se editan aquí.</p>
        </section>
      </Card>

      <Card>
        <h2 className="display text-2xl">Cambiar contraseña</h2>
        <form onSubmit={onSubmit} noValidate className="mt-4 max-w-md space-y-5">
          <PasswordField label="Contraseña actual" value={current} onChange={setCurrent} error={errors.current} autoComplete="current-password" />
          <PasswordField
            label="Contraseña nueva"
            value={password}
            onChange={setPassword}
            error={errors.password}
            hint="Mínimo 8 caracteres."
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirma tu contraseña nueva"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            autoComplete="new-password"
          />
          {formError && (
            <p role="alert" className="font-semibold text-error">
              {formError}
            </p>
          )}
          {done && (
            <p role="status" className="font-semibold text-ok">
              Contraseña actualizada.
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
