import { useId, useState, type ReactNode } from 'react';

export const inputClass =
  'mt-1 block min-h-11 w-full rounded-lg border border-field bg-white px-3 py-2 text-base text-ink placeholder:text-[#6b7590]';

interface ControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface Props {
  label: string;
  error?: string;
  hint?: string;
  children: (control: ControlProps) => ReactNode;
}

/** Etiqueta + control + ayuda + error, con el error y la ayuda asociados al control (aria-describedby). */
export function Field({ label, error, hint, children }: Props) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete: 'new-password' | 'current-password';
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField({ label = 'Contraseña', value, onChange, error, hint, autoComplete }: PasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {(control) => (
        <div className="relative">
          <input
            {...control}
            type={visible ? 'text' : 'password'}
            value={value}
            autoComplete={autoComplete}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} pr-24`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="absolute top-1 right-1 min-h-9 rounded-md px-3 text-sm font-semibold text-brand-600 hover:bg-navy-soft"
          >
            {visible ? 'Ocultar' : 'Mostrar'}
            <span className="sr-only"> contraseña</span>
          </button>
        </div>
      )}
    </Field>
  );
}
