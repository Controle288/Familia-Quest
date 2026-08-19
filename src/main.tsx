import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyTheme, getStoredTheme } from './lib/theme';

// Apply the persisted/system theme before first paint to avoid a flash.
applyTheme(getStoredTheme());

// Clear any stale demo-mode data left by previous versions of the app so
// returning visitors start from a clean, official (server-backed) state.
['fq_family', 'fq_profiles', 'fq_current_profile_id', 'fq_tasks', 'fq_rewards', 'fq_redemptions', 'fq_logs', 'fq_session_mode'].forEach((key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
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
