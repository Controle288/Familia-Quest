// Definição dos temas de cores customizáveis para o FamiliaQuest.
// Cada tema expõe utilitários de classe Tailwind para: fundo, cartões, bordas,
// textos, cores de destaque e variações sólidas (botões/barras de progresso) + glow.

export interface ThemeConfig {
  bg: string; // Fundo principal da página
  card: string; // Fundo dos cartões/seções
  border: string; // Bordas
  text: string; // Texto principal
  textMuted: string; // Texto secundário/suave
  primary: string; // Cor de destaque (texto/ícones)
  primaryBg: string; // Cor sólida de destaque (botões, barras de progresso)
  primaryText: string; // Texto sobre a cor primária
  secondary: string; // Cor de destaque secundária (texto)
  secondaryBg: string; // Cor sólida secundária (badges, detalhes)
  accent: string; // Fundo suave de acento
  glow: string; // Sombra/brilho decorativo
}

export type ThemeName = 'cyberpunk' | 'ocean' | 'pastel' | 'sunset';

export const dashboardThemes: Record<ThemeName, ThemeConfig> = {
  // Escuro, Roxo Neon e Ciano — estilo gamer/cyberpunk
  cyberpunk: {
    bg: 'bg-gray-950',
    card: 'bg-gray-900/80',
    border: 'border-purple-500/30',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    primary: 'text-purple-400',
    primaryBg: 'bg-purple-600',
    primaryText: 'text-white',
    secondary: 'text-cyan-400',
    secondaryBg: 'bg-cyan-500',
    accent: 'bg-purple-500/10',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.45)]',
  },
  // Azul Turquesa e Verde Menta — fresco/oceânico
  ocean: {
    bg: 'bg-cyan-950',
    card: 'bg-cyan-900/50',
    border: 'border-teal-400/30',
    text: 'text-slate-100',
    textMuted: 'text-cyan-200/70',
    primary: 'text-teal-300',
    primaryBg: 'bg-teal-500',
    primaryText: 'text-white',
    secondary: 'text-emerald-300',
    secondaryBg: 'bg-emerald-500',
    accent: 'bg-teal-500/10',
    glow: 'shadow-[0_0_22px_rgba(20,184,166,0.4)]',
  },
  // Lilás Suave e Rosa Pastel — delicado/infantil
  pastel: {
    bg: 'bg-purple-50',
    card: 'bg-white',
    border: 'border-purple-200',
    text: 'text-purple-950',
    textMuted: 'text-purple-400',
    primary: 'text-purple-600',
    primaryBg: 'bg-purple-500',
    primaryText: 'text-white',
    secondary: 'text-pink-500',
    secondaryBg: 'bg-pink-400',
    accent: 'bg-purple-100',
    glow: 'shadow-md',
  },
  // Laranja Quente e Âmbar — energético/entardecer
  sunset: {
    bg: 'bg-orange-50',
    card: 'bg-white',
    border: 'border-orange-200',
    text: 'text-orange-950',
    textMuted: 'text-orange-500',
    primary: 'text-orange-600',
    primaryBg: 'bg-orange-500',
    primaryText: 'text-white',
    secondary: 'text-amber-500',
    secondaryBg: 'bg-amber-400',
    accent: 'bg-orange-100',
    glow: 'shadow-[0_0_22px_rgba(249,115,22,0.3)]',
  },
};

// Label amigável exibido no seletor de tema
export const themeLabels: Record<ThemeName, string> = {
  cyberpunk: 'Cyberpunk',
  ocean: 'Ocean',
  pastel: 'Pastel',
  sunset: 'Sunset',
};

// Swatch de preview usado nos botões do seletor
export const themeSwatch: Record<ThemeName, string> = {
  cyberpunk: 'from-purple-500 to-cyan-400',
  ocean: 'from-teal-400 to-emerald-300',
  pastel: 'from-purple-400 to-pink-300',
  sunset: 'from-orange-400 to-amber-300',
};
