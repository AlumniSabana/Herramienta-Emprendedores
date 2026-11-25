import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { DEFAULT_ALLOWED_EMAIL_DOMAIN, MIN_PASSWORD_LENGTH, validateInstitutionalEmail } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { toAuthError } from '../auth/errors';
import { CodeStep } from '../components/CodeStep';
import { Field, PasswordField, inputClass } from '../components/Field';
import { Button, Card } from '../components/ui';

const DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || DEFAULT_ALLOWED_EMAIL_DOMAIN;

export function RecoverPage() {
  const { session, requestRecovery, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Con sesión (ya la tenía, o la acaba de crear al cambiar la contraseña) se va al diagnóstico.
  if (session) return <Navigate to="/diagnostico" replace />;

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setError(undefined);
    const check = validateInstitutionalEmail(email, DOMAIN);
    if (!check.ok) {
      setEmailError(check.error);
      return;
    }
    setEmailError(undefined);
    busyRef.current = true;
    setBusy(true);
    try {
      // La respuesta es la misma exista o no la cuenta: no se revela si el correo está registrado.
      await requestRecovery(check.email);
      setSentTo(check.email);
    } catch (err) {
      setError(toAuthError(err).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (sentTo)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CodeStep
            title="Revisa tu correo"
            description={
              <>
                Si <strong>{sentTo}</strong> tiene cuenta, te enviamos un correo. Abre el enlace que trae para elegir tu contraseña
                nueva. Si en lugar del enlace te llegó un código, escríbelo aquí junto con tu contraseña nueva.
              </>
            }
            submitLabel="Cambiar contraseña"
            onSubmit={async (code) => {
              if (newPassword.length < MIN_PASSWORD_LENGTH) {
                setPasswordError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
                return;
              }
              setPasswordError(undefined);
              await resetPassword(sentTo, code, newPassword);
            }}
            onResend={() => requestRecovery(sentTo)}
            extraFields={
              <PasswordField
                label="Contraseña nueva"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordError}
                hint="Mínimo 8 caracteres."
                autoComplete="new-password"
              />
            }
          />
        </Card>
      </div>
    );

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl sm:text-5xl">Recupera tu contraseña</h1>
      <p className="mt-2 text-muted">Te enviaremos un correo con un enlace para elegir una contraseña nueva.</p>

      <Card className="mt-6">
        <form onSubmit={onRequest} noValidate className="space-y-5">
          <Field label="Correo institucional" error={emailError}>
            {(c) => (
              <input
                {...c}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`nombre.apellido@${DOMAIN}`}
                className={inputClass}
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Enviando…' : 'Enviar correo de recuperación'}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm">
        <Link to="/ingresar" className="font-bold text-brand-600 underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}
