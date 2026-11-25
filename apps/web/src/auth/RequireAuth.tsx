import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

/** Ruta protegida: sin sesión lleva a /ingresar y, tras ingresar, devuelve a lo que se pidió. */
export function RequireAuth() {
  const { session, cargando } = useAuth();
  const location = useLocation();

  if (cargando)
    return (
      <p role="status" className="py-16 text-center text-muted">
        Cargando…
      </p>
    );
  if (!session) return <Navigate to="/ingresar" replace state={{ from: location }} />;
  // Una sesión abierta con un enlace de recuperación solo puede definir la contraseña nueva.
  if (session.recovery) return <Navigate to="/restablecer" replace />;
  return <Outlet />;
}
