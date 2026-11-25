import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useDiagnostic } from '../state/DiagnosticContext';
import { buttonClass } from './ui';

export function SiteHeader() {
  const { session, profile, signOut } = useAuth();
  const { clearAll } = useDiagnostic();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    setOpen(false);
    await signOut();
    clearAll();
    navigate('/');
  }

  const who = profile?.name || session?.email;

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {/* Marca provisional: sustituir por el logo oficial TalentHub UniSabana. */}
          <span className="leading-none font-bold tracking-tight">
            TalentHub
            <span className="block text-[10px] font-normal tracking-wide">UniSabana</span>
          </span>
          <span className="h-8 w-px bg-white/30" aria-hidden="true" />
          <span className="display truncate text-lg !text-white sm:text-xl">Diagnóstico emprendedor</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Link
                to="/cuenta"
                title={who}
                className="max-w-40 truncate rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 max-sm:hidden"
              >
                Mi cuenta
              </Link>
              <button type="button" onClick={logout} className={buttonClass('outlineOnDark', 'max-sm:hidden')}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/ingresar" className="hidden rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 sm:inline-flex">
                Ingresar
              </Link>
              <Link to="/registro" className={buttonClass('onDark', 'max-sm:hidden')}>
                Crear cuenta
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="Menú"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-white/10 sm:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-movil" aria-label="Menú principal" className="border-t border-white/15 px-4 pb-4 sm:hidden">
          <ul className="flex flex-col gap-2 pt-3">
            <li>
              <Link to="/" onClick={() => setOpen(false)} className={buttonClass('outlineOnDark', 'w-full')}>
                Inicio
              </Link>
            </li>
            {session ? (
              <>
                <li>
                  <Link to="/cuenta" onClick={() => setOpen(false)} className={buttonClass('outlineOnDark', 'w-full')}>
                    Mi cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/diagnostico" onClick={() => setOpen(false)} className={buttonClass('outlineOnDark', 'w-full')}>
                    Mi diagnóstico
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={logout} className={buttonClass('onDark', 'w-full')}>
                    Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/ingresar" onClick={() => setOpen(false)} className={buttonClass('outlineOnDark', 'w-full')}>
                    Ingresar
                  </Link>
                </li>
                <li>
                  <Link to="/registro" onClick={() => setOpen(false)} className={buttonClass('onDark', 'w-full')}>
                    Crear cuenta
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
