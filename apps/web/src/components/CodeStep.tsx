import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { validateVerificationCode } from '@emprendedor/core';
import { toAuthError } from '../auth/errors';
import { Field, inputClass } from './Field';
import { Button } from './ui';

const COOLDOWN_SECONDS = 60;

interface Props {
  title: string;
  /** Texto bajo el título; normalmente "Te enviamos un código a <correo>". */
  description: ReactNode;
  submitLabel: string;
  /** Recibe el código ya limpio. Si lanza, el mensaje se muestra como error. */
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  /** Campos adicionales antes del botón (p. ej. la contraseña nueva en la recuperación). */
  extraFields?: ReactNode;
}

/** Paso de código de un solo uso: verificación de correo y recuperación de contraseña. */
export function CodeStep({ title, description, submitLabel, onSubmit, onResend, extraFields }: Props) {
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(COOLDOWN_SECONDS); // el código se acaba de enviar
  const input = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => input.current?.focus(), []);
  const counting = seconds > 0;
  useEffect(() => {
    if (!counting) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [counting]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setError(undefined);
    setNotice(undefined);
    const parsed = validateVerificationCode(code);
    if (!parsed.ok) {
      setFieldError(parsed.error);
      input.current?.focus();
      return;
    }
    setFieldError(undefined);
    busyRef.current = true;
    setBusy(true);
    try {
      await onSubmit(parsed.code);
    } catch (err) {
      setError(toAuthError(err).message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function resend() {
    setError(undefined);
    setNotice(undefined);
    try {
      await onResend();
      setNotice('Te enviamos un código nuevo. Revisa tu correo.');
      setSeconds(COOLDOWN_SECONDS);
    } catch (err) {
      setError(toAuthError(err).message);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted">{description}</p>
      </div>

      <Field label="Código de verificación" error={fieldError}>
        {(control) => (
          <input
            {...control}
            ref={input}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} tracking-widest`}
          />
        )}
      </Field>

      {extraFields}

      {error && (
        <p role="alert" className="font-semibold text-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm font-semibold text-ok">
          {notice}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Verificando…' : submitLabel}
      </Button>
      <button
        type="button"
        onClick={resend}
        disabled={seconds > 0}
        className="block w-full text-center text-sm font-semibold text-brand-600 underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
      >
        {seconds > 0 ? `Reenviar código en ${seconds} s` : 'Reenviar código'}
      </button>
    </form>
  );
}
