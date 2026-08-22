import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Banner that invites the user to install FamiliaQuest as a standalone app
// (works on desktop "Add to desktop/taskbar" and mobile "Add to home screen").
// Only appears when the browser fires the installable event.
export const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-[#3525cd] text-white px-4 py-3 shadow-2xl">
        <Download className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm leading-tight">Instalar FamiliaQuest</p>
          <p className="text-[11px] text-indigo-100 leading-tight">
            Adicione à área de trabalho e use como um app.
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 text-xs font-bold bg-white text-[#3525cd] px-3 py-1.5 rounded-full"
        >
          Instalar
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-indigo-200 hover:text-white"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
