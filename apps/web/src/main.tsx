import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { SupabaseAuthService } from './auth/SupabaseAuthService';
import { captureLinkError } from './lib/linkError';
import { createSupabaseClient } from './lib/supabase';
import { ResultsContext } from './results/ResultsService';
import { SupabaseResultsService } from './results/SupabaseResultsService';
import { AppRoutes } from './routes';
import { DiagnosticProvider } from './state/DiagnosticContext';
import './styles.css';

// Antes de crear el cliente (que limpia la URL): guarda el error de un enlace vencido o ya usado.
captureLinkError();
const client = createSupabaseClient();
const authService = new SupabaseAuthService(client);
const resultsService = new SupabaseResultsService(client);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider service={authService}>
        <ResultsContext.Provider value={resultsService}>
          <DiagnosticProvider>
            <AppRoutes />
          </DiagnosticProvider>
        </ResultsContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
