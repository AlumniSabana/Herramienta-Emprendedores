import type { Item } from '@emprendedor/core';

interface Props {
  item: Item;
  labels: readonly string[];
  value: number | undefined;
  onChange: (value: number) => void;
  /** Muestra el aviso de ítem pendiente. */
  showError: boolean;
}

export function LikertItem({ item, labels, value, onChange, showError }: Props) {
  const errorId = `err-${item.id}`;
  return (
    <fieldset
      aria-describedby={showError ? errorId : undefined}
      className={`rounded-lg border p-4 ${showError ? 'border-error' : 'border-line'}`}
    >
      <legend className="px-1 text-base font-semibold text-ink">{item.text}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {labels.map((label, i) => {
          const n = i + 1;
          return (
            <label
              key={n}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2f6bff] ${
                value === n ? 'border-navy bg-navy-soft font-bold text-navy' : 'border-field bg-white text-ink'
              }`}
            >
              <input
                type="radio"
                name={`item-${item.id}`}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                aria-label={label}
                className="size-4 accent-[#00185e]"
              />
              <span aria-hidden="true">
                <strong className="mr-1">{n}</strong>
                {label}
              </span>
            </label>
          );
        })}
      </div>
      {showError && (
        <p id={errorId} className="mt-2 text-sm font-semibold text-error">
          Falta responder esta afirmación.
        </p>
      )}
    </fieldset>
  );
}
