import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyTheme, getStoredTheme } from './lib/theme';
import { applyThemePref, loadThemePref } from './lib/themes';
import { applyMode, getStoredMode } from './lib/mode';
import { ModeProvider } from './context/ModeContext';

// Apply the persisted/system theme before first paint to avoid a flash.
applyTheme(getStoredTheme());

// Apply the chosen decorative theme + light/dark variant.
const themePref = loadThemePref();
applyThemePref(themePref.theme, themePref.variant);

// Apply the global age-mode (Kids / Teen / Adult) before first paint.
applyMode(getStoredMode());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModeProvider>
      <App />
    </ModeProvider>
  </StrictMode>,
);

// Register the PWA service worker only in production builds (skip in dev to
// avoid interfering with HMR). The SW caches the app shell and never touches
// cross-origin Supabase API calls.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* registration is best-effort */
    });
  });
}
