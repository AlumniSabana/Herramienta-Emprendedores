import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { MIN_PASSWORD_LENGTH } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { authError, toAuthError } from '../auth/errors';
import { PasswordField } from '../components/Field';
import { Button, Card } from '../components/ui';
import { clearLinkError, peekLinkError } from '../lib/linkError';

/**
 * Destino del enlace de recuperación del correo. Con la sesión de recuperación obliga a definir la contraseña
 * nueva; sin ella (enlace vencido, ya usado o abierto sin sesión) explica qué pasó y ofrece pedir otro.
 */
export function ResetPasswordPage() {
  const { session, cargando, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const savedRef = useRef(false);
  const linkError = peekLinkError();

  if (cargando)
    return (
      <p role="status" className="py-16 text-center text-muted">
        Cargando…
      </p>
    );

  // Una sesión normal no tiene nada que hacer aquí: el cambio de contraseña está en "Mi cuenta".
  if (session && !session.recovery) return <Navigate to={savedRef.current ? '/diagnostico' : '/cuenta'} replace />;

  if (!session)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <h1 className="text-3xl sm:text-4xl">Este enlace no es válido o ya venció</h1>
          {linkError && (
            <p role="alert" className="mt-3 font-semibold text-error">
              {authError('link-expired').message}
            </p>
          )}
          <p className="mt-3 text-muted">
            Los enlaces del correo sirven una sola vez y vencen pronto. Pide uno nuevo para cambiar tu contraseña.
          </p>
          <Link
            to="/recuperar"
            onClick={clearLinkError}
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white"
          >
            Pedir un enlace nuevo
          </Link>
        </Card>
      </div>
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setFormError(undefined);
    const next: Record<string, string> = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    busyRef.current = true;
    savedRef.current = true; // al actualizarse la sesión, esta pantalla manda al diagnóstico y no a "Mi cuenta"
    setBusy(true);
    try {
      await updatePassword(password);
      clearLinkError();
      navigate('/diagnostico', { replace: true });
    } catch (err) {
      savedRef.current = false;
      setFormError(toAuthError(err).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl sm:text-5xl">Define tu nueva contraseña</h1>
      <p className="mt-2 text-muted">
        Para seguir usando tu cuenta debes elegir una contraseña nueva. Hasta entonces no podrás abrir el diagnóstico.
      </p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
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
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            Cancelar
          </Button>
        </form>
      </Card>
    </div>
  );
}
