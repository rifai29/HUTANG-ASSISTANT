import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { DbProvider } from './context/DbContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DbProvider>
        <App />
      </DbProvider>
    </AuthProvider>
  </StrictMode>,
);
