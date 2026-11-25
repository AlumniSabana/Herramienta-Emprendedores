import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'onDark' | 'outlineOnDark';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-[#001e86]',
  secondary: 'border border-navy bg-white text-navy hover:bg-navy-soft',
  onDark: 'bg-white text-navy hover:bg-navy-soft',
  outlineOnDark: 'border border-white/70 text-white hover:bg-white/10',
};

export const buttonClass = (variant: Variant = 'primary', extra = '') =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-card p-5 shadow-sm sm:p-7 ${className}`}>{children}</section>;
}

/** Etiqueta en mayúsculas pequeñas con espaciado, en azul de acento. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-bold tracking-[0.16em] text-brand-600 uppercase ${className}`}>{children}</p>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-semibold text-muted">
        <span>{label}</span>
        <span>
          {value} de {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-navy-soft"
      >
        <div className="h-full bg-navy transition-all" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
