import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './app/routes';
import { SocketProvider } from './features/socket/SocketProvider';
import { useGetCsrfTokenQuery } from './api/authApi';

/**
 * Initializes the CSRF token cookie by fetching /api/csrf-token on startup.
 * This ensures the non-HttpOnly cookie is set before any mutation is fired.
 */
function CsrfInitializer() {
  useGetCsrfTokenQuery();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <CsrfInitializer />
      <SocketProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          duration={4000}
        />
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
