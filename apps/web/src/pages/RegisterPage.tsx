import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { AGREEMENT_VERSION, DEFAULT_ALLOWED_EMAIL_DOMAIN, faculties, validateRegistration } from '@emprendedor/core';
import { useAuth } from '../auth/AuthContext';
import { toAuthError } from '../auth/errors';
import { CodeStep } from '../components/CodeStep';
import { Field, PasswordField, inputClass } from '../components/Field';
import { Button, Card } from '../components/ui';

const DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || DEFAULT_ALLOWED_EMAIL_DOMAIN;
const POLICY_URL =
  (import.meta.env.VITE_DATA_POLICY_URL as string | undefined) ||
  'https://www.unisabana.edu.co/politica-de-proteccion-de-datos';

export function RegisterPage() {
  const { session, signUp, verifySignup, resendSignupCode } = useAuth();
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [program, setProgram] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [exists, setExists] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Con sesión (ya la tenía o la acaba de crear al verificar) se va al diagnóstico.
  if (session) return <Navigate to="/diagnostico" replace />;

  if (pendingEmail)
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CodeStep
            title="Revisa tu correo"
            description={
              <>
                Te enviamos un correo a <strong>{pendingEmail}</strong>. Abre el enlace que trae para activar tu cuenta. Si en lugar
                del enlace te llegó un código, escríbelo aquí.
              </>
            }
            submitLabel="Verificar con el código"
            onSubmit={(code) => verifySignup(pendingEmail, code)}
            onResend={() => resendSignupCode(pendingEmail)}
          />
        </Card>
      </div>
    );

  const programs = faculties.find((f) => f.name === faculty)?.programs ?? [];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setFormError(undefined);
    setExists(false);
    const v = validateRegistration({ name, faculty, program, email, password, consent }, DOMAIN);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    busyRef.current = true;
    setBusy(true);
    try {
      const { status } = await signUp(v.value);
      if (status === 'already-registered') setExists(true);
      else setPendingEmail(v.value.email);
    } catch (err) {
      setFormError(toAuthError(err).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-4xl sm:text-5xl">Crea tu cuenta</h1>
      <p className="mt-2 text-muted">Con tu correo institucional. Un solo registro sirve para todas las herramientas.</p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label="Nombre completo" error={errors.name}>
            {(c) => <input {...c} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Facultad" error={errors.faculty}>
              {(c) => (
                <select
                  {...c}
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value);
                    setProgram(''); // el programa depende de la facultad
                  }}
                  className={inputClass}
                >
                  <option value="">Selecciona…</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Programa" error={errors.program}>
              {(c) => (
                <select {...c} value={program} onChange={(e) => setProgram(e.target.value)} disabled={!faculty} className={inputClass}>
                  <option value="">Selecciona…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field label="Correo institucional" error={errors.email}>
            {(c) => (
              <input
                {...c}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`nombre.apellido@${DOMAIN}`}
                className={inputClass}
              />
            )}
          </Field>

          <PasswordField
            value={password}
            onChange={setPassword}
            error={errors.password}
            hint="Mínimo 8 caracteres."
            autoComplete="new-password"
          />

          <div className="rounded-lg bg-navy-soft/60 p-4 text-sm leading-relaxed">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
                className="mt-1 size-5 shrink-0 accent-[#00135b]"
              />
              <span>
                Autorizo a la Universidad de La Sabana, a través del Centro de Desarrollo Profesional, a almacenar y tratar
                los datos de mi cuenta (nombre, facultad, programa y correo), mis respuestas y mis resultados del
                diagnóstico, con el fin de mostrarme mi progreso y permitirme rehacerlo (Ley 1581 de 2012, acuerdo versión{' '}
                {AGREEMENT_VERSION}). Entiendo que la información es confidencial y no se comparte con docentes,
                empleadores ni terceros, salvo obligación legal, y que puedo consultar, corregir o solicitar la
                eliminación de mis datos conforme a la{' '}
                <a href={POLICY_URL} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline">
                  Política de Tratamiento de Datos Personales
                </a>{' '}
                de la Universidad.
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" role="alert" className="mt-2 pl-8 font-semibold text-error">
                {errors.consent}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="font-semibold text-error">
              {formError}
            </p>
          )}
          {exists && (
            <div role="alert" className="rounded-lg border border-error p-3 text-sm">
              <p className="font-semibold text-error">Ese correo ya tiene cuenta.</p>
              <p className="mt-1">
                <Link to="/ingresar" className="font-semibold text-brand-600 underline">
                  Ingresar con esta cuenta
                </Link>{' '}
                ·{' '}
                <Link to="/recuperar" className="font-semibold text-brand-600 underline">
                  Recuperar mi contraseña
                </Link>
              </p>
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link to="/ingresar" className="font-bold text-brand-600 underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
