import type { KeyboardEvent } from 'react';
import { PROFILE_IDS, profileById, type ProfileId } from '@emprendedor/core';

interface Props {
  selected: ProfileId;
  onSelect: (id: ProfileId) => void;
}

export const tabId = (id: ProfileId) => `tab-${id}`;
export const panelId = (id: ProfileId) => `panel-${id}`;

export function ProfileTabs({ selected, onSelect }: Props) {
  function onKey(e: KeyboardEvent, index: number) {
    const move = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const target = e.key === 'Home' ? 0 : e.key === 'End' ? PROFILE_IDS.length - 1 : move !== undefined ? (index + move + PROFILE_IDS.length) % PROFILE_IDS.length : null;
    if (target === null) return;
    e.preventDefault();
    const id = PROFILE_IDS[target]!;
    onSelect(id);
    document.getElementById(tabId(id))?.focus();
  }

  return (
    <div role="tablist" aria-label="Perfiles emprendedores" className="flex gap-2 overflow-x-auto pb-1">
      {PROFILE_IDS.map((id, i) => (
        <button
          key={id}
          id={tabId(id)}
          role="tab"
          type="button"
          aria-selected={selected === id}
          aria-controls={panelId(selected)}
          tabIndex={selected === id ? 0 : -1}
          onClick={() => onSelect(id)}
          onKeyDown={(e) => onKey(e, i)}
          className={`min-h-11 shrink-0 rounded-lg border px-3 py-2 text-sm font-bold ${
            selected === id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:bg-navy-soft'
          }`}
        >
          {profileById(id)!.name}
        </button>
      ))}
    </div>
  );
}
