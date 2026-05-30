import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './app/routes';
import { SocketProvider } from './features/socket/SocketProvider';

function App() {
  return (
    <BrowserRouter>
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
