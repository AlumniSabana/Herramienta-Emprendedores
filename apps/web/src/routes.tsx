import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { testContent } from '@emprendedor/core';
import { RequireAuth } from './auth/RequireAuth';
import { SiteLayout } from './components/SiteLayout';
import { AccountPage } from './pages/AccountPage';
import { BlockPage } from './pages/BlockPage';
import { DiagnosticHomePage } from './pages/DiagnosticHomePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RecoverPage } from './pages/RecoverPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResultPage } from './pages/ResultPage';
import { firstIncompleteBlock, useDiagnostic } from './state/DiagnosticContext';

function BlockGuard() {
  const { answers, restartTest } = useDiagnostic();
  const n = Number(useParams().bloque);
  const location = useLocation();
  const navigate = useNavigate();

  // "Repetir"/"Rehacer" llegan con state.restart: se limpia aquí, ya dentro de /test, y se quita la marca.
  const restart = (location.state as { restart?: boolean } | null)?.restart === true;
  useEffect(() => {
    if (!restart) return;
    restartTest();
    navigate(location.pathname, { replace: true });
  }, [restart, restartTest, navigate, location.pathname]);

  const first = firstIncompleteBlock(answers) ?? testContent.blocks.length;
  if (!Number.isInteger(n) || n < 1 || n > first) return <Navigate to={`/test/${first}`} replace />;
  return <BlockPage key={n} />;
}

function ResultGuard() {
  const { result } = useDiagnostic();
  if (!result) return <Navigate to="/diagnostico" replace />;
  return <ResultPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/ingresar" element={<LoginPage />} />
        <Route path="/recuperar" element={<RecoverPage />} />
        <Route path="/restablecer" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/diagnostico" element={<DiagnosticHomePage />} />
          <Route path="/cuenta" element={<AccountPage />} />
          <Route path="/test/:bloque" element={<BlockGuard />} />
          <Route path="/resultado" element={<ResultGuard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
