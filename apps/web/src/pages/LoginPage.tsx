import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { DEFAULT_ALLOWED_EMAIL_DOMAIN } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { toAuthError } from '../auth/errors';
import { CodeStep } from '../components/CodeStep';
import { Field, PasswordField, inputClass } from '../components/Field';
import { Button, Card } from '../components/ui';

const DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || DEFAULT_ALLOWED_EMAIL_DOMAIN;

export function LoginPage() {
  const { session, signIn, verifySignup, resendSignupCode } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Con sesión (ya la tenía o la acaba de crear) se vuelve a lo que se pidió, o al diagnóstico.
  if (session) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/diagnostico'} replace />;

  if (unverifiedEmail)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CodeStep
            title="Verifica tu correo"
            description={
              <>
                Tu cuenta aún no está verificada. Te enviamos un correo a <strong>{unverifiedEmail}</strong>: abre el enlace que trae o,
                si te llegó un código, escríbelo aquí.
              </>
            }
            submitLabel="Verificar con el código"
            onSubmit={(code) => verifySignup(unverifiedEmail, code)}
            onResend={() => resendSignupCode(unverifiedEmail)}
          />
        </Card>
      </div>
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setError(undefined);
    busyRef.current = true;
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const authError = toAuthError(err);
      if (authError.code === 'email-not-verified') {
        try {
          await resendSignupCode(email);
        } catch {
          /* si el reenvío falla, la persona puede pedirlo desde la pantalla del código */
        }
        setUnverifiedEmail(email.trim().toLowerCase());
      } else setError(authError.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl sm:text-5xl">Ingresa a tu cuenta</h1>
      <p className="mt-2 text-muted">Usa tu correo institucional.</p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Correo institucional">
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
          <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />

          {error && (
            <p role="alert" className="font-semibold text-error">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Ingresando…' : 'Ingresar'}
          </Button>
          <p className="text-center">
            <Link to="/recuperar" className="text-sm font-bold text-brand-600">
              Olvidé mi contraseña
            </Link>
          </p>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-bold text-brand-600 underline">
          Créala aquí
        </Link>
      </p>
    </div>
  );
}
