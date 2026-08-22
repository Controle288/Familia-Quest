// Componente Principal que gerencia o estado e seleciona o dashboard correto

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { mockChild, ChildProfile } from '../../mocks/familiaDataMock';
import { dashboardThemes, ThemeName, ThemeConfig } from './DashboardThemes';
import DashboardKids from './DashboardKids';
import DashboardTeen from './DashboardTeen';
import DashboardClean from './DashboardClean';

const DashboardFilhoContainer: React.FC = () => {
  // Estado para armazenar os dados do perfil (mockados por enquanto)
  const [profile, setProfile] = useState<ChildProfile>(mockChild);
  // Estado para armazenar o tema escolhido
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('cyberpunk'); // 'cyberpunk' | 'ocean' | 'pastel' | 'sunset'
  const [showSettings, setShowSettings] = useState(false);

  const themeConfig: ThemeConfig = dashboardThemes[currentTheme];

  // Lógica para determinar qual dashboard renderizar com base na idade
  const renderDashboard = () => {
    if (profile.age <= 9) {
      return <DashboardKids profile={profile} theme={themeConfig} />;
    } else if (profile.age > 9 && profile.age <= 14) {
      return <DashboardTeen profile={profile} theme={themeConfig} />;
    } else {
      return <DashboardClean profile={profile} theme={themeConfig} />;
    }
  };

  return (
    <div className={`min-h-screen ${themeConfig.bg} p-6 ${themeConfig.text} font-sans relative`}>
      {/* Cabeçalho do Container */}
      <header className={`flex items-center justify-between pb-6 mb-6 ${themeConfig.border} border-b`}>
        <div className='flex items-center gap-4'>
          <h1 className={`text-2xl font-bold ${themeConfig.primary}`}>FamiliaQuest</h1>
          <span className={`text-sm ${themeConfig.textMuted}`}>Dashboard do Filho ({profile.name}, {profile.age} anos)</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-full ${themeConfig.accent} ${themeConfig.border} border`}
          title="Alterar Tema"
        >
          <Settings className={`w-5 h-5 ${themeConfig.primary}`} />
        </button>
      </header>

      {/* Renderização Condicional do Dashboard baseada na idade */}
      {renderDashboard()}

      {/* Modal Simples de Configurações de Tema */}
      {showSettings && (
        <div className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50`}>
          <div className={`${themeConfig.card} ${themeConfig.border} border rounded-2xl p-6 w-full max-w-sm shadow-2xl`}>
            <h2 className={`text-lg font-bold mb-4 ${themeConfig.primary}`}>Selecione o Tema</h2>
            <div className='grid grid-cols-2 gap-3'>
              {(Object.keys(dashboardThemes) as ThemeName[]).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setCurrentTheme(themeName);
                    setShowSettings(false);
                  }}
                  className={`capitalize p-3 rounded-xl ${dashboardThemes[themeName].accent} ${currentTheme === themeName ? `border-2 ${themeConfig.primary}` : 'border border-gray-700'} text-center`}
                >
                  {themeName}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className={`mt-5 w-full p-2 text-sm rounded-lg ${themeConfig.bg} ${themeConfig.border} border`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilhoContainer;
