import React, { useEffect, useState } from 'react';
import { MapPin, X, Share2, Navigation } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { loadFamilyLocations, upsertLocation } from '../lib/supabase';
import { ProfileLocation } from '../types';

export const LocationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profiles, currentProfile, familySettings, isPremium } = useFamily();
  const [locations, setLocations] = useState<ProfileLocation[]>([]);
  const [busy, setBusy] = useState(false);

  const enabled = isPremium && familySettings?.location_enabled;

  const refresh = async () => {
    if (!currentProfile?.family_id) return;
    setLocations(await loadFamilyLocations(currentProfile.family_id));
  };

  useEffect(() => {
    if (enabled) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const shareMine = () => {
    if (!('geolocation' in navigator)) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await upsertLocation({
            profile_id: currentProfile.id,
            family_id: currentProfile.family_id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          await refresh();
        } finally {
          setBusy(false);
        }
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-900 dark:text-white">
            <MapPin className="w-5 h-5 text-[#3525cd]" /> Localização da família
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!enabled ? (
          <p className="mt-4 text-sm text-slate-500">
            Ative a localização nas configurações (recurso Premium) para ver onde a família está.
          </p>
        ) : (
          <>
            <button
              onClick={shareMine}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 h-11 rounded-2xl bg-[#3525cd] text-white font-semibold hover:bg-[#2e1fb5] disabled:opacity-60"
            >
              <Share2 className="w-4 h-4" /> {busy ? 'Obtendo…' : 'Compartilhar minha localização'}
            </button>

            <div className="mt-4 space-y-2">
              {profiles.map((p) => {
                const loc = locations.find((l) => l.profile_id === p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {loc?.lat && loc?.lng
                            ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                            : 'Sem localização'}
                        </p>
                      </div>
                    </div>
                    {loc?.lat && loc?.lng && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=15/${loc.lat}/${loc.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-[#3525cd]"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Ver
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Localização opcional, compartilhada com consentimento dos responsáveis.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
