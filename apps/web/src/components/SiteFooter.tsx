const POLICY_URL =
  (import.meta.env.VITE_DATA_POLICY_URL as string | undefined) ||
  'https://www.unisabana.edu.co/politica-de-proteccion-de-datos';

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>© 2026 Universidad de La Sabana · Centro de Desarrollo Profesional</p>
        <a href={POLICY_URL} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline">
          Política de datos personales
        </a>
      </div>
    </footer>
  );
}
