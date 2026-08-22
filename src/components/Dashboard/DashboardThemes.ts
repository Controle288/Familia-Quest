// Definição dos temas de cores customizáveis para o FamiliaQuest

export interface ThemeConfig {
  bg: string;          // Background principal
  card: string;        // Fundo dos cartões/seções
  border: string;      // Bordas
  text: string;        // Texto principal
  textMuted: string;   // Texto secundário/suave
  primary: string;     // Cor de destaque (botões, barras de progresso, etc.)
  secondary: string;   // Cor de destaque secundária
  accent: string;      // Cor de acento
}

export type ThemeName = 'cyberpunk' | 'ocean' | 'pastel' | 'sunset';

export const dashboardThemes: Record<ThemeName, ThemeConfig> = {
  cyberpunk: {
    bg: 'bg-gray-950',
    card: 'bg-gray-900',
    border: 'border-gray-700',
    text: 'text-gray-100',
    textMuted: 'text-gray-500',
    primary: 'text-purple-400',
    secondary: 'text-cyan-400',
    accent: 'bg-purple-900/50',
  },
  ocean: {
    bg: 'bg-cyan-950',
    card: 'bg-cyan-900',
    border: 'border-cyan-700',
    text: 'text-gray-100',
    textMuted: 'text-cyan-500',
    primary: 'text-teal-400',
    secondary: 'text-teal-200',
    accent: 'bg-teal-900/50',
  },
  pastel: {
    bg: 'bg-purple-50',
    card: 'bg-white',
    border: 'border-purple-200',
    text: 'text-purple-950',
    textMuted: 'text-purple-400',
    primary: 'text-purple-600',
    secondary: 'text-pink-600',
    accent: 'bg-purple-100',
  },
  sunset: {
    bg: 'bg-orange-50',
    card: 'bg-white',
    border: 'border-orange-200',
    text: 'text-orange-950',
    textMuted: 'text-orange-400',
    primary: 'text-orange-600',
    secondary: 'text-amber-600',
    accent: 'bg-orange-100',
  },
};
